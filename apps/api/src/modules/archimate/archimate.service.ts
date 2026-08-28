import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@archivision/infrastructure';
import { TypeElement } from '@prisma/client';
import { PaginationQueryDto, paginateFindMany } from '@archivision/shared';
import { CreateCapaciteDto } from './dto/create-capacite.dto';
import { UpdateCapaciteDto } from './dto/update-capacite.dto';
import { CreateElementDto } from './dto/create-element.dto';
import { UpdateElementDto } from './dto/update-element.dto';
import { CreateRelationDto } from './dto/create-relation.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { PositionItemDto } from './dto/update-positions-batch.dto';

@Injectable()
export class ArchimateService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── CapaciteMetier ───────────────────────────────────────────────────────

  createCapacite(organisationId: string, dto: CreateCapaciteDto) {
    return this.prisma.capaciteMetier.create({ data: { ...dto, organisationId } });
  }

  findAllCapacites(organisationId: string, pagination?: PaginationQueryDto) {
    return paginateFindMany(
      this.prisma.capaciteMetier,
      { where: { organisationId }, orderBy: { nom: 'asc' }, include: { _count: { select: { elements: true } } } },
      pagination,
    );
  }

  async findOneCapacite(id: string, organisationId: string) {
    const capacite = await this.prisma.capaciteMetier.findUnique({
      where: { id },
      include: {
        elements: { orderBy: { nom: 'asc' } },
      },
    });
    if (!capacite || capacite.organisationId !== organisationId) {
      throw new NotFoundException(`Capacité ${id} introuvable`);
    }
    return capacite;
  }

  async updateCapacite(id: string, organisationId: string, dto: UpdateCapaciteDto) {
    await this.assertCapaciteExists(id, organisationId);
    return this.prisma.capaciteMetier.update({ where: { id }, data: dto });
  }

  async removeCapacite(id: string, organisationId: string) {
    await this.assertCapaciteExists(id, organisationId);
    return this.prisma.capaciteMetier.delete({ where: { id } });
  }

  // ─── ElementArchimate ─────────────────────────────────────────────────────

  async createElement(organisationId: string, dto: CreateElementDto) {
    if (dto.capaciteMetierId) {
      await this.assertCapaciteExists(dto.capaciteMetierId, organisationId);
    }
    return this.prisma.elementArchimate.create({
      data: {
        organisationId,
        nom: dto.nom,
        type: dto.type,
        description: dto.description,
        categorieExigence: dto.categorieExigence,
        positionX: dto.positionX,
        positionY: dto.positionY,
        ...(dto.capaciteMetierId && { capaciteMetierId: dto.capaciteMetierId }),
      },
    });
  }

  findAllElements(organisationId: string, type?: TypeElement, pagination?: PaginationQueryDto) {
    return paginateFindMany(
      this.prisma.elementArchimate,
      {
        where: { organisationId, ...(type && { type }) },
        orderBy: { nom: 'asc' },
        include: {
          capacite: { select: { id: true, nom: true } },
          _count: { select: { relationsSource: true, relationsTarget: true } },
        },
      },
      pagination,
    );
  }

  async findOneElement(id: string, organisationId: string) {
    const element = await this.prisma.elementArchimate.findUnique({
      where: { id },
      include: {
        capacite: { select: { id: true, nom: true } },
        relationsSource: {
          include: { target: { select: { id: true, nom: true, type: true } } },
        },
        relationsTarget: {
          include: { source: { select: { id: true, nom: true, type: true } } },
        },
      },
    });
    if (!element || element.organisationId !== organisationId) {
      throw new NotFoundException(`Élément ${id} introuvable`);
    }
    return element;
  }

  async updateElement(id: string, organisationId: string, dto: UpdateElementDto) {
    await this.assertElementExists(id, organisationId);
    if (dto.capaciteMetierId) {
      await this.assertCapaciteExists(dto.capaciteMetierId, organisationId);
    }
    return this.prisma.elementArchimate.update({
      where: { id },
      data: {
        ...(dto.nom !== undefined && { nom: dto.nom }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.categorieExigence !== undefined && { categorieExigence: dto.categorieExigence }),
        ...(dto.positionX !== undefined && { positionX: dto.positionX }),
        ...(dto.positionY !== undefined && { positionY: dto.positionY }),
        // null permet de détacher la capacité, undefined l'ignore
        ...('capaciteMetierId' in dto && { capaciteMetierId: dto.capaciteMetierId }),
      },
    });
  }

  async removeElement(id: string, organisationId: string) {
    await this.assertElementExists(id, organisationId);
    // onDelete: Cascade sur les relations via le schéma Prisma
    return this.prisma.elementArchimate.delete({ where: { id } });
  }

  async updateElementPosition(id: string, organisationId: string, dto: UpdatePositionDto) {
    await this.assertElementExists(id, organisationId);
    return this.prisma.elementArchimate.update({
      where: { id },
      data: { positionX: dto.positionX, positionY: dto.positionY },
    });
  }

  async updateElementPositionsBatch(organisationId: string, items: PositionItemDto[]) {
    const ids = items.map((item) => item.id);
    const count = await this.prisma.elementArchimate.count({ where: { id: { in: ids }, organisationId } });
    if (count !== ids.length) {
      throw new NotFoundException('Un ou plusieurs éléments introuvables');
    }
    return this.prisma.$transaction(
      items.map((item) =>
        this.prisma.elementArchimate.update({
          where: { id: item.id },
          data: { positionX: item.positionX, positionY: item.positionY },
        }),
      ),
    );
  }

  // ─── RelationArchimate ────────────────────────────────────────────────────

  async createRelation(organisationId: string, dto: CreateRelationDto) {
    // Source et cible doivent toutes deux appartenir à l'organisation de l'appelant
    await Promise.all([
      this.assertElementExists(dto.sourceId, organisationId),
      this.assertElementExists(dto.targetId, organisationId),
    ]);

    return this.prisma.relationArchimate.create({
      data: dto,
      include: {
        source: { select: { id: true, nom: true, type: true } },
        target: { select: { id: true, nom: true, type: true } },
      },
    });
  }

  findAllRelations(organisationId: string, pagination?: PaginationQueryDto) {
    return paginateFindMany(
      this.prisma.relationArchimate,
      {
        where: { source: { organisationId } },
        include: {
          source: { select: { id: true, nom: true, type: true } },
          target: { select: { id: true, nom: true, type: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      pagination,
    );
  }

  async removeRelation(id: string, organisationId: string) {
    const relation = await this.prisma.relationArchimate.findUnique({
      where: { id },
      include: { source: { select: { organisationId: true } } },
    });
    if (!relation || relation.source.organisationId !== organisationId) {
      throw new NotFoundException(`Relation ${id} introuvable`);
    }
    return this.prisma.relationArchimate.delete({ where: { id } });
  }

  // ─── Utilitaires ──────────────────────────────────────────────────────────

  private async assertCapaciteExists(id: string, organisationId: string) {
    const count = await this.prisma.capaciteMetier.count({ where: { id, organisationId } });
    if (!count) throw new NotFoundException(`Capacité ${id} introuvable`);
  }

  private async assertElementExists(id: string, organisationId: string) {
    const count = await this.prisma.elementArchimate.count({ where: { id, organisationId } });
    if (!count) throw new NotFoundException(`Élément ${id} introuvable`);
  }
}
