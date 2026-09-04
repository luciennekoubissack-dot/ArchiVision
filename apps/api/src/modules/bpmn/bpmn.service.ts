import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@archivision/infrastructure';
import { PaginationQueryDto, paginateFindMany } from '@archivision/shared';
import { CreateBpmnProcessusDto } from './dto/create-bpmn-processus.dto';
import { UpdateBpmnProcessusDto } from './dto/update-bpmn-processus.dto';
import { CreateBpmnElementDto } from './dto/create-bpmn-element.dto';
import { UpdateBpmnElementDto } from './dto/update-bpmn-element.dto';
import { CreateBpmnFlowDto } from './dto/create-bpmn-flow.dto';
import { construirePropositionDiagramme } from './bpmn-diagramme-proposal';

const OBJECTIFS_INCLUDE = {
  objectifs: {
    include: {
      objectif: { select: { id: true, nom: true, statut: true } },
    },
  },
};

@Injectable()
export class BpmnService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Processus ────────────────────────────────────────────────────────────

  async create(organisationId: string, dto: CreateBpmnProcessusDto) {
    const processus = await this.prisma.bpmnProcessus.create({
      data: { ...dto, organisationId },
      include: OBJECTIFS_INCLUDE,
    });
    if (dto.etapes?.trim()) {
      await this.genererDiagramme(processus.id, organisationId);
    }
    return processus;
  }

  /**
   * Génère une proposition de diagramme (éléments + flux) à partir du champ
   * `etapes` du processus et la persiste. Refuse si le diagramme contient déjà
   * des éléments (l'utilisateur doit d'abord le vider), pour ne jamais écraser
   * un travail d'édition.
   */
  async genererDiagramme(id: string, organisationId: string) {
    const processus = await this.prisma.bpmnProcessus.findUnique({
      where: { id },
      include: { elements: { select: { id: true } } },
    });
    if (!processus || processus.organisationId !== organisationId) {
      throw new NotFoundException(`Processus BPMN ${id} introuvable`);
    }
    if (processus.elements.length > 0) {
      throw new BadRequestException(
        'Le diagramme contient déjà des éléments. Videz-le avant de régénérer une proposition.',
      );
    }
    const etapes = (processus.etapes ?? '').trim();
    if (!etapes) {
      throw new BadRequestException("Aucune étape n'est renseignée pour ce processus.");
    }

    let proposition: ReturnType<typeof construirePropositionDiagramme>;
    try {
      proposition = construirePropositionDiagramme(etapes);
    } catch (erreur) {
      throw new BadRequestException(erreur instanceof Error ? erreur.message : 'Étapes invalides.');
    }

    await this.prisma.$transaction(async (tx) => {
      const ids: string[] = [];
      for (const noeud of proposition.noeuds) {
        const element = await tx.bpmnElement.create({
          data: {
            processusId: id,
            nom: noeud.nom,
            type: noeud.type,
            typeTache: noeud.typeTache ?? null,
            declencheur: noeud.declencheur ?? null,
            statut: 'LES_DEUX',
            positionX: noeud.x,
            positionY: noeud.y,
          },
        });
        ids.push(element.id);
      }
      for (const lien of proposition.liens) {
        await tx.bpmnFlow.create({
          data: { sourceId: ids[lien.source], targetId: ids[lien.cible], label: lien.label ?? null },
        });
      }
    });

    return this.findOne(id, organisationId);
  }

  findAll(organisationId: string, pagination?: PaginationQueryDto) {
    return paginateFindMany(
      this.prisma.bpmnProcessus,
      {
        where: { organisationId },
        orderBy: { nom: 'asc' },
        include: { _count: { select: { elements: true } }, ...OBJECTIFS_INCLUDE },
      },
      pagination,
    );
  }

  async findOne(id: string, organisationId: string) {
    const processus = await this.prisma.bpmnProcessus.findUnique({
      where: { id },
      include: {
        elements: {
          orderBy: { createdAt: 'asc' },
          include: { flowsSource: true, flowsTarget: true },
        },
        ...OBJECTIFS_INCLUDE,
      },
    });
    if (!processus || processus.organisationId !== organisationId) {
      throw new NotFoundException(`Processus BPMN ${id} introuvable`);
    }
    return processus;
  }

  async update(id: string, organisationId: string, dto: UpdateBpmnProcessusDto) {
    await this.assertProcessusExists(id, organisationId);
    const processus = await this.prisma.bpmnProcessus.update({
      where: { id },
      data: dto,
      include: OBJECTIFS_INCLUDE,
    });
    // Même comportement qu'à la création : des étapes renseignées sur un
    // diagramme encore vide déclenchent la génération d'une proposition.
    if (dto.etapes?.trim()) {
      const nbElements = await this.prisma.bpmnElement.count({ where: { processusId: id } });
      if (nbElements === 0) {
        return this.genererDiagramme(id, organisationId);
      }
    }
    return processus;
  }

  async remove(id: string, organisationId: string) {
    await this.assertProcessusExists(id, organisationId);
    return this.prisma.bpmnProcessus.delete({ where: { id } });
  }

  // ── Objectifs visés ──────────────────────────────────────────────────────

  /**
   * Remplace la liste des objectifs visés par ce processus.
   * Valide que tous les objectifs appartiennent à la même organisation.
   */
  async updateObjectifs(id: string, organisationId: string, objectifIds: string[]) {
    await this.assertProcessusExists(id, organisationId);

    if (objectifIds.length > 0) {
      const count = await this.prisma.objectif.count({
        where: { id: { in: objectifIds }, organisationId },
      });
      if (count !== new Set(objectifIds).size) {
        throw new BadRequestException('Un ou plusieurs objectifs introuvables.');
      }
    }

    await this.prisma.$transaction([
      this.prisma.objectifProcessus.deleteMany({ where: { processusId: id } }),
      this.prisma.objectifProcessus.createMany({
        data: objectifIds.map((objectifId) => ({ processusId: id, objectifId })),
      }),
    ]);

    return this.findOne(id, organisationId);
  }

  /**
   * Calcule la progression d'un processus BPMN vers ses objectifs cibles.
   * Pour chaque objectif visé, détermine si toutes les solutions liées sont TERMINEE.
   */
  async getProgression(id: string, organisationId: string) {
    const processus = await this.findOne(id, organisationId);
    const elements = processus.elements;

    const totalElements = elements.length;
    const elementsAsIs = elements.filter((e) => e.statut === 'AS_IS').length;
    const elementsToBe = elements.filter((e) => e.statut === 'TO_BE').length;
    const elementsInchanges = elements.filter((e) => e.statut === 'LES_DEUX').length;
    const tauxTransition =
      totalElements > 0 ? Math.round((elementsInchanges / totalElements) * 100) : 0;

    const objectifsProgression = await Promise.all(
      processus.objectifs.map(async (link) => {
        const objectif = link.objectif;

        const gaps = await this.prisma.solutionGap.findMany({
          where: { solution: { organisationId }, domaine: 'OBJECTIF', elementId: objectif.id },
          include: { solution: { select: { avancement: true } } },
        });

        const solutionsTotal = gaps.length;
        const solutionsTerminees = gaps.filter((g) => g.solution.avancement === 'TERMINEE').length;
        const peutEtreMarqueAtteint =
          solutionsTotal > 0 && solutionsTerminees === solutionsTotal && objectif.statut === 'AS_IS';

        return {
          id: objectif.id,
          nom: objectif.nom,
          statut: objectif.statut as string,
          solutionsTotal,
          solutionsTerminees,
          peutEtreMarqueAtteint,
        };
      }),
    );

    return {
      processusId: id,
      totalElements,
      elementsAsIs,
      elementsToBe,
      elementsInchanges,
      tauxTransition,
      objectifs: objectifsProgression,
    };
  }

  // ── Éléments ─────────────────────────────────────────────────────────────

  async addElement(processusId: string, organisationId: string, dto: CreateBpmnElementDto) {
    await this.assertProcessusExists(processusId, organisationId);
    return this.prisma.bpmnElement.create({ data: { ...dto, processusId } });
  }

  async updateElement(elementId: string, organisationId: string, dto: UpdateBpmnElementDto) {
    await this.assertElementExists(elementId, organisationId);
    return this.prisma.bpmnElement.update({ where: { id: elementId }, data: dto });
  }

  async removeElement(elementId: string, organisationId: string) {
    await this.assertElementExists(elementId, organisationId);
    return this.prisma.bpmnElement.delete({ where: { id: elementId } });
  }

  // ── Flux ─────────────────────────────────────────────────────────────────

  async addFlow(processusId: string, organisationId: string, dto: CreateBpmnFlowDto) {
    await this.assertProcessusExists(processusId, organisationId);
    const [source, target] = await Promise.all([
      this.prisma.bpmnElement.findUnique({ where: { id: dto.sourceId } }),
      this.prisma.bpmnElement.findUnique({ where: { id: dto.targetId } }),
    ]);
    if (!source || source.processusId !== processusId || !target || target.processusId !== processusId) {
      throw new BadRequestException('Source et cible doivent appartenir au même processus');
    }
    return this.prisma.bpmnFlow.create({ data: dto });
  }

  async removeFlow(flowId: string, organisationId: string) {
    const flow = await this.prisma.bpmnFlow.findUnique({
      where: { id: flowId },
      include: { source: { include: { processus: true } } },
    });
    if (!flow || flow.source.processus.organisationId !== organisationId) {
      throw new NotFoundException(`Flux ${flowId} introuvable`);
    }
    return this.prisma.bpmnFlow.delete({ where: { id: flowId } });
  }

  // ── Assertions ───────────────────────────────────────────────────────────

  private async assertProcessusExists(id: string, organisationId: string) {
    const count = await this.prisma.bpmnProcessus.count({ where: { id, organisationId } });
    if (!count) throw new NotFoundException(`Processus BPMN ${id} introuvable`);
  }

  private async assertElementExists(id: string, organisationId: string) {
    const element = await this.prisma.bpmnElement.findUnique({
      where: { id },
      include: { processus: true },
    });
    if (!element || element.processus.organisationId !== organisationId) {
      throw new NotFoundException(`Élément BPMN ${id} introuvable`);
    }
  }
}
