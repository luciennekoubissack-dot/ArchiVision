import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@archivision/infrastructure';
import { TypeElement } from '@prisma/client';
import { CreateCapaciteDto } from './dto/create-capacite.dto';
import { UpdateCapaciteDto } from './dto/update-capacite.dto';
import { CreateElementDto } from './dto/create-element.dto';
import { UpdateElementDto } from './dto/update-element.dto';
import { CreateRelationDto } from './dto/create-relation.dto';

@Injectable()
export class ArchimateService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── CapaciteMetier ───────────────────────────────────────────────────────

  createCapacite(dto: CreateCapaciteDto) {
    return this.prisma.capaciteMetier.create({ data: dto });
  }

  findAllCapacites(organisationId: string) {
    return this.prisma.capaciteMetier.findMany({
      where: { organisationId },
      orderBy: { nom: 'asc' },
      include: { _count: { select: { elements: true } } },
    });
  }

  async findOneCapacite(id: string) {
    const capacite = await this.prisma.capaciteMetier.findUnique({
      where: { id },
      include: {
        elements: { orderBy: { nom: 'asc' } },
      },
    });
    if (!capacite) throw new NotFoundException(`Capacité ${id} introuvable`);
    return capacite;
  }

  async updateCapacite(id: string, dto: UpdateCapaciteDto) {
    await this.assertCapaciteExists(id);
    return this.prisma.capaciteMetier.update({ where: { id }, data: dto });
  }

  async removeCapacite(id: string) {
    await this.assertCapaciteExists(id);
    return this.prisma.capaciteMetier.delete({ where: { id } });
  }

  // ─── ElementArchimate ─────────────────────────────────────────────────────

  createElement(dto: CreateElementDto) {
    return this.prisma.elementArchimate.create({
      data: {
        organisationId: dto.organisationId,
        nom: dto.nom,
        type: dto.type,
        description: dto.description,
        ...(dto.capaciteMetierId && { capaciteMetierId: dto.capaciteMetierId }),
      },
    });
  }

  findAllElements(organisationId: string, type?: TypeElement) {
    return this.prisma.elementArchimate.findMany({
      where: {
        organisationId,
        ...(type && { type }),
      },
      orderBy: { nom: 'asc' },
      include: {
        capacite: { select: { id: true, nom: true } },
        _count: {
          select: { relationsSource: true, relationsTarget: true },
        },
      },
    });
  }

  async findOneElement(id: string) {
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
    if (!element) throw new NotFoundException(`Élément ${id} introuvable`);
    return element;
  }

  async updateElement(id: string, dto: UpdateElementDto) {
    await this.assertElementExists(id);
    return this.prisma.elementArchimate.update({
      where: { id },
      data: {
        ...(dto.nom !== undefined && { nom: dto.nom }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.description !== undefined && { description: dto.description }),
        // null permet de détacher la capacité, undefined l'ignore
        ...('capaciteMetierId' in dto && { capaciteMetierId: dto.capaciteMetierId }),
      },
    });
  }

  async removeElement(id: string) {
    await this.assertElementExists(id);
    // onDelete: Cascade sur les relations via le schéma Prisma
    return this.prisma.elementArchimate.delete({ where: { id } });
  }

  // ─── RelationArchimate ────────────────────────────────────────────────────

  async createRelation(dto: CreateRelationDto) {
    // Vérifier que source et target existent
    await Promise.all([
      this.assertElementExists(dto.sourceId),
      this.assertElementExists(dto.targetId),
    ]);

    return this.prisma.relationArchimate.create({
      data: dto,
      include: {
        source: { select: { id: true, nom: true, type: true } },
        target: { select: { id: true, nom: true, type: true } },
      },
    });
  }

  findAllRelations(organisationId: string) {
    return this.prisma.relationArchimate.findMany({
      where: { source: { organisationId } },
      include: {
        source: { select: { id: true, nom: true, type: true } },
        target: { select: { id: true, nom: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async removeRelation(id: string) {
    const relation = await this.prisma.relationArchimate.findUnique({ where: { id } });
    if (!relation) throw new NotFoundException(`Relation ${id} introuvable`);
    return this.prisma.relationArchimate.delete({ where: { id } });
  }

  // ─── Utilitaires ──────────────────────────────────────────────────────────

  private async assertCapaciteExists(id: string) {
    const count = await this.prisma.capaciteMetier.count({ where: { id } });
    if (!count) throw new NotFoundException(`Capacité ${id} introuvable`);
  }

  private async assertElementExists(id: string) {
    const count = await this.prisma.elementArchimate.count({ where: { id } });
    if (!count) throw new NotFoundException(`Élément ${id} introuvable`);
  }
}
