import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@archivision/infrastructure';
import { PaginationQueryDto, paginateFindMany } from '@archivision/shared';
import { CreateDataEntityDto } from './dto/create-data-entity.dto';
import { UpdateDataEntityDto } from './dto/update-data-entity.dto';
import { CreateDataAttributeDto } from './dto/create-data-attribute.dto';
import { CreateDataRelationDto } from './dto/create-data-relation.dto';

@Injectable()
export class DonneesService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Entités ──────────────────────────────────────────────────────────────

  create(organisationId: string, dto: CreateDataEntityDto) {
    if (dto.asIsId) {
      return this.assertAsIsLink(dto.asIsId, organisationId).then(() => this.prisma.dataEntity.create({ data: { ...dto, organisationId } }));
    }
    return this.prisma.dataEntity.create({ data: { ...dto, organisationId } });
  }

  findAll(organisationId: string, pagination?: PaginationQueryDto) {
    return paginateFindMany(
      this.prisma.dataEntity,
      { where: { organisationId }, orderBy: { nom: 'asc' }, include: { attributs: true, evolutionsToBe: { select: { id: true, nom: true } }, _count: { select: { attributs: true } } } },
      pagination,
    );
  }

  async findOne(id: string, organisationId: string) {
    const entity = await this.prisma.dataEntity.findUnique({
      where: { id },
      include: { attributs: true },
    });
    if (!entity || entity.organisationId !== organisationId) {
      throw new NotFoundException(`Entité de données ${id} introuvable`);
    }
    return entity;
  }

  async update(id: string, organisationId: string, dto: UpdateDataEntityDto) {
    await this.assertEntityExists(id, organisationId);
    if (dto.asIsId) await this.assertAsIsLink(dto.asIsId, organisationId);
    return this.prisma.dataEntity.update({ where: { id }, data: dto });
  }

  async remove(id: string, organisationId: string) {
    await this.assertEntityExists(id, organisationId);
    return this.prisma.dataEntity.delete({ where: { id } });
  }

  // ── Attributs ────────────────────────────────────────────────────────────

  async addAttribute(entityId: string, organisationId: string, dto: CreateDataAttributeDto) {
    await this.assertEntityExists(entityId, organisationId);
    return this.prisma.dataAttribute.create({ data: { ...dto, entityId } });
  }

  async removeAttribute(attributeId: string, organisationId: string) {
    const attribute = await this.prisma.dataAttribute.findUnique({
      where: { id: attributeId },
      include: { entity: true },
    });
    if (!attribute || attribute.entity.organisationId !== organisationId) {
      throw new NotFoundException(`Attribut ${attributeId} introuvable`);
    }
    return this.prisma.dataAttribute.delete({ where: { id: attributeId } });
  }

  // ── Relations ────────────────────────────────────────────────────────────

  findAllRelations(organisationId: string, pagination?: PaginationQueryDto) {
    return paginateFindMany(
      this.prisma.dataRelation,
      { where: { source: { organisationId } }, include: { source: true, target: true } },
      pagination,
    );
  }

  async createRelation(organisationId: string, dto: CreateDataRelationDto) {
    const [source, target] = await Promise.all([
      this.prisma.dataEntity.findUnique({ where: { id: dto.sourceId } }),
      this.prisma.dataEntity.findUnique({ where: { id: dto.targetId } }),
    ]);
    if (!source || source.organisationId !== organisationId || !target || target.organisationId !== organisationId) {
      throw new BadRequestException("Source et cible doivent appartenir à votre organisation");
    }
    return this.prisma.dataRelation.create({ data: dto });
  }

  async removeRelation(relationId: string, organisationId: string) {
    const relation = await this.prisma.dataRelation.findUnique({
      where: { id: relationId },
      include: { source: true },
    });
    if (!relation || relation.source.organisationId !== organisationId) {
      throw new NotFoundException(`Relation ${relationId} introuvable`);
    }
    return this.prisma.dataRelation.delete({ where: { id: relationId } });
  }

  private async assertEntityExists(id: string, organisationId: string) {
    const count = await this.prisma.dataEntity.count({ where: { id, organisationId } });
    if (!count) throw new NotFoundException(`Entité de données ${id} introuvable`);
  }

  private async assertAsIsLink(asIsId: string, organisationId: string) {
    const source = await this.prisma.dataEntity.findFirst({ where: { id: asIsId, organisationId, statut: 'AS_IS' } });
    if (!source) throw new BadRequestException("L'entité AS-IS liée doit appartenir à votre organisation et avoir le statut AS-IS");
  }
}
