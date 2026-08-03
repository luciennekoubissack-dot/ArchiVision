import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@archivision/infrastructure';
import { TypeZone } from '@prisma/client';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { AffecterApplicationDto } from './dto/affecter-application.dto';

@Injectable()
export class UrbanisationService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Applications ─────────────────────────────────────────────────────────

  createApplication(dto: CreateApplicationDto) {
    return this.prisma.application.create({ data: dto });
  }

  findAllApplications(organisationId: string) {
    return this.prisma.application.findMany({
      where: { organisationId },
      orderBy: { nom: 'asc' },
      include: {
        _count: { select: { zones: true } },
      },
    });
  }

  async findOneApplication(id: string) {
    const app = await this.prisma.application.findUnique({
      where: { id },
      include: {
        zones: {
          include: {
            zone: { select: { id: true, nom: true, type: true } },
          },
        },
      },
    });
    if (!app) throw new NotFoundException(`Application ${id} introuvable`);
    return app;
  }

  async updateApplication(id: string, dto: UpdateApplicationDto) {
    await this.assertApplicationExists(id);
    return this.prisma.application.update({ where: { id }, data: dto });
  }

  async removeApplication(id: string) {
    await this.assertApplicationExists(id);
    return this.prisma.application.delete({ where: { id } });
  }

  // ─── Zones d'urbanisation ─────────────────────────────────────────────────

  createZone(dto: CreateZoneDto) {
    return this.prisma.zoneUrbanisation.create({
      data: {
        organisationId: dto.organisationId,
        nom: dto.nom,
        type: dto.type,
        ...(dto.parentId && { parentId: dto.parentId }),
      },
    });
  }

  /**
   * Retourne l'arbre complet de zones pour une organisation.
   * On renvoie uniquement les racines (sans parent) avec leurs enfants.
   */
  findAllZones(organisationId: string, type?: TypeZone) {
    return this.prisma.zoneUrbanisation.findMany({
      where: {
        organisationId,
        ...(type && { type }),
      },
      orderBy: [{ type: 'asc' }, { nom: 'asc' }],
      include: {
        enfants: {
          orderBy: { nom: 'asc' },
          include: {
            enfants: { orderBy: { nom: 'asc' } },
          },
        },
        _count: { select: { applications: true } },
      },
    });
  }

  async findOneZone(id: string) {
    const zone = await this.prisma.zoneUrbanisation.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, nom: true, type: true } },
        enfants: { orderBy: { nom: 'asc' } },
        applications: {
          include: {
            application: {
              select: { id: true, nom: true, criticite: true },
            },
          },
        },
      },
    });
    if (!zone) throw new NotFoundException(`Zone ${id} introuvable`);
    return zone;
  }

  async updateZone(id: string, dto: UpdateZoneDto) {
    await this.assertZoneExists(id);
    return this.prisma.zoneUrbanisation.update({
      where: { id },
      data: {
        ...(dto.nom !== undefined && { nom: dto.nom }),
        ...('parentId' in dto && { parentId: dto.parentId }),
      },
    });
  }

  async removeZone(id: string) {
    await this.assertZoneExists(id);
    return this.prisma.zoneUrbanisation.delete({ where: { id } });
  }

  // ─── Affectation application ↔ zone (POS) ────────────────────────────────

  async affecter(dto: AffecterApplicationDto) {
    await Promise.all([
      this.assertApplicationExists(dto.applicationId),
      this.assertZoneExists(dto.zoneId),
    ]);

    const existe = await this.prisma.applicationZone.findUnique({
      where: {
        applicationId_zoneId: {
          applicationId: dto.applicationId,
          zoneId: dto.zoneId,
        },
      },
    });
    if (existe) throw new ConflictException('Cette application est déjà affectée à cette zone');

    return this.prisma.applicationZone.create({
      data: { applicationId: dto.applicationId, zoneId: dto.zoneId },
      include: {
        application: { select: { id: true, nom: true } },
        zone: { select: { id: true, nom: true, type: true } },
      },
    });
  }

  async desaffecter(applicationId: string, zoneId: string) {
    const affectation = await this.prisma.applicationZone.findUnique({
      where: { applicationId_zoneId: { applicationId, zoneId } },
    });
    if (!affectation) throw new NotFoundException('Affectation introuvable');
    return this.prisma.applicationZone.delete({
      where: { applicationId_zoneId: { applicationId, zoneId } },
    });
  }

  // ─── Utilitaires ──────────────────────────────────────────────────────────

  private async assertApplicationExists(id: string) {
    const count = await this.prisma.application.count({ where: { id } });
    if (!count) throw new NotFoundException(`Application ${id} introuvable`);
  }

  private async assertZoneExists(id: string) {
    const count = await this.prisma.zoneUrbanisation.count({ where: { id } });
    if (!count) throw new NotFoundException(`Zone ${id} introuvable`);
  }
}
