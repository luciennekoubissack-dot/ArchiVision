import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@archivision/infrastructure';
import { PaginationQueryDto, paginateFindMany } from '@archivision/shared';
import { StatutElement } from '@prisma/client';
import { CreateObjectifDto } from './dto/create-objectif.dto';
import { UpdateObjectifDto } from './dto/update-objectif.dto';

const REF_SELECT = { id: true, nom: true, statut: true };
const EVOLUTION_INCLUDE = {
  objectifAsIs: { select: REF_SELECT },
  objectifsToBe: { select: REF_SELECT },
};

@Injectable()
export class ObjectifService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organisationId: string, dto: CreateObjectifDto) {
    await this.assertValidEvolution(dto.statut, dto.objectifAsIsId, organisationId);
    return this.prisma.objectif.create({ data: { ...dto, organisationId }, include: EVOLUTION_INCLUDE });
  }

  findAll(organisationId: string, pagination?: PaginationQueryDto) {
    return paginateFindMany(
      this.prisma.objectif,
      { where: { organisationId }, orderBy: { nom: 'asc' }, include: EVOLUTION_INCLUDE },
      pagination,
    );
  }

  async findOne(id: string, organisationId: string) {
    const objectif = await this.prisma.objectif.findUnique({ where: { id }, include: EVOLUTION_INCLUDE });
    if (!objectif || objectif.organisationId !== organisationId) {
      throw new NotFoundException(`Objectif ${id} introuvable`);
    }
    return objectif;
  }

  async update(id: string, organisationId: string, dto: UpdateObjectifDto) {
    const existing = await this.getOwned(id, organisationId);
    const nextStatut = dto.statut ?? existing.statut;

    // Si le nouveau statut n'est plus TO_BE, le lien d'évolution n'a plus de
    // sens : on le supprime automatiquement, sauf si le dto en fixe un
    // nouveau explicitement (la validation ci-dessous s'applique alors).
    const nextObjectifAsIsId: string | null =
      dto.objectifAsIsId !== undefined
        ? dto.objectifAsIsId
        : nextStatut === StatutElement.TO_BE
          ? existing.objectifAsIsId
          : null;

    await this.assertValidEvolution(nextStatut, nextObjectifAsIsId, organisationId, id);
    return this.prisma.objectif.update({
      where: { id },
      data: { ...dto, objectifAsIsId: nextObjectifAsIsId },
      include: EVOLUTION_INCLUDE,
    });
  }

  async remove(id: string, organisationId: string) {
    await this.assertExists(id, organisationId);
    return this.prisma.objectif.delete({ where: { id } });
  }

  /**
   * Marque un objectif AS-IS comme atteint (passage à LES_DEUX = conservé dans
   * la cible). Possible uniquement si toutes les solutions qui adressent les
   * écarts de cet objectif ont un avancement TERMINEE, et qu'il en existe au
   * moins une. Empêche un passage manuel arbitraire non justifié par l'avancement
   * réel des solutions.
   */
  async marquerAtteint(id: string, organisationId: string) {
    const objectif = await this.getOwned(id, organisationId);
    if (objectif.statut !== 'AS_IS') {
      throw new BadRequestException("Seul un objectif AS-IS peut être marqué comme atteint.");
    }

    const gaps = await this.prisma.solutionGap.findMany({
      where: { solution: { organisationId }, domaine: 'OBJECTIF', elementId: id },
      include: { solution: { select: { avancement: true } } },
    });

    if (gaps.length === 0) {
      throw new BadRequestException(
        "Cet objectif n'est adressé par aucune solution. Associez-lui au moins une solution TERMINEE avant de le marquer comme atteint.",
      );
    }
    const toutesTerminees = gaps.every((g) => g.solution.avancement === 'TERMINE');
    if (!toutesTerminees) {
      throw new BadRequestException(
        "Toutes les solutions liées à cet objectif doivent être TERMINEE avant de le marquer comme atteint.",
      );
    }

    return this.prisma.objectif.update({
      where: { id },
      data: { statut: 'LES_DEUX' },
      include: EVOLUTION_INCLUDE,
    });
  }

  private async getOwned(id: string, organisationId: string) {
    const objectif = await this.prisma.objectif.findUnique({ where: { id } });
    if (!objectif || objectif.organisationId !== organisationId) {
      throw new NotFoundException(`Objectif ${id} introuvable`);
    }
    return objectif;
  }

  private async assertExists(id: string, organisationId: string) {
    const count = await this.prisma.objectif.count({ where: { id, organisationId } });
    if (!count) throw new NotFoundException(`Objectif ${id} introuvable`);
  }

  /**
   * Un lien d'évolution AS-IS → TO-BE n'a de sens que si l'objectif courant
   * est bien TO-BE et que sa source est un objectif AS-IS existant de la
   * même organisation (pas TO-BE ni LES_DEUX, et pas lui-même).
   */
  private async assertValidEvolution(
    statut: StatutElement | undefined,
    objectifAsIsId: string | null | undefined,
    organisationId: string,
    currentId?: string,
  ): Promise<void> {
    if (!objectifAsIsId) return;
    if (statut !== StatutElement.TO_BE) {
      throw new BadRequestException("Seul un objectif TO-BE peut être relié à un objectif AS-IS d'origine.");
    }
    if (objectifAsIsId === currentId) {
      throw new BadRequestException("Un objectif ne peut pas évoluer de lui-même.");
    }
    const asIs = await this.prisma.objectif.findUnique({ where: { id: objectifAsIsId } });
    if (!asIs || asIs.organisationId !== organisationId) {
      throw new BadRequestException(`Objectif AS-IS ${objectifAsIsId} introuvable.`);
    }
    if (asIs.statut !== StatutElement.AS_IS) {
      throw new BadRequestException("L'objectif d'origine doit être un objectif AS-IS.");
    }
  }
}
