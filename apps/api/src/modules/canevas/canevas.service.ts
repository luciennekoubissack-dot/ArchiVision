import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@archivision/infrastructure';
import { ElementKind } from '@prisma/client';
import { CreateCanevasRelationDto } from './dto/create-canevas-relation.dto';

interface CountableModel {
  count(args: { where: { id: string; organisationId: string } }): Promise<number>;
}

@Injectable()
export class CanevasService {
  constructor(private readonly prisma: PrismaService) {}

  async createRelation(organisationId: string, dto: CreateCanevasRelationDto) {
    if (dto.sourceKind === dto.targetKind && dto.sourceId === dto.targetId) {
      throw new BadRequestException('Source et cible doivent être différentes');
    }
    await Promise.all([
      this.assertBelongsToOrg(dto.sourceKind, dto.sourceId, organisationId),
      this.assertBelongsToOrg(dto.targetKind, dto.targetId, organisationId),
    ]);
    return this.prisma.canevasRelation.create({ data: { ...dto, organisationId } });
  }

  findAll(organisationId: string) {
    return this.prisma.canevasRelation.findMany({
      where: { organisationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: string, organisationId: string) {
    const relation = await this.prisma.canevasRelation.findUnique({ where: { id } });
    if (!relation || relation.organisationId !== organisationId) {
      throw new NotFoundException(`Relation ${id} introuvable`);
    }
    return this.prisma.canevasRelation.delete({ where: { id } });
  }

  private async assertBelongsToOrg(kind: ElementKind, id: string, organisationId: string): Promise<void> {
    const count = await this.resolveModel(kind).count({ where: { id, organisationId } });
    if (!count) throw new NotFoundException(`Élément ${kind}:${id} introuvable dans votre organisation`);
  }

  /** Delegate Prisma correspondant au kind — permet de valider l'appartenance
   * à l'organisation avant de créer une relation inter-couches. */
  private resolveModel(kind: ElementKind): CountableModel {
    switch (kind) {
      case ElementKind.ARCHIMATE:
        return this.prisma.elementArchimate;
      case ElementKind.APPLICATION:
        return this.prisma.application;
      case ElementKind.TECH_COMPONENT:
        return this.prisma.techComponent;
      case ElementKind.DATA_ENTITY:
        return this.prisma.dataEntity;
    }
  }
}
