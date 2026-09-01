import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@archivision/infrastructure';
import { PaginationQueryDto, paginateFindMany } from '@archivision/shared';
import { CreateBpmnProcessusDto } from './dto/create-bpmn-processus.dto';
import { UpdateBpmnProcessusDto } from './dto/update-bpmn-processus.dto';
import { CreateBpmnElementDto } from './dto/create-bpmn-element.dto';
import { UpdateBpmnElementDto } from './dto/update-bpmn-element.dto';
import { CreateBpmnFlowDto } from './dto/create-bpmn-flow.dto';
import { construirePropositionDiagramme } from './bpmn-diagramme-proposal';

@Injectable()
export class BpmnService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Processus ────────────────────────────────────────────────────────────

  async create(organisationId: string, dto: CreateBpmnProcessusDto) {
    const processus = await this.prisma.bpmnProcessus.create({ data: { ...dto, organisationId } });
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
      { where: { organisationId }, orderBy: { nom: 'asc' }, include: { _count: { select: { elements: true } } } },
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
      },
    });
    if (!processus || processus.organisationId !== organisationId) {
      throw new NotFoundException(`Processus BPMN ${id} introuvable`);
    }
    return processus;
  }

  async update(id: string, organisationId: string, dto: UpdateBpmnProcessusDto) {
    await this.assertProcessusExists(id, organisationId);
    const processus = await this.prisma.bpmnProcessus.update({ where: { id }, data: dto });
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
