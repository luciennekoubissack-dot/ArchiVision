import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@archivision/infrastructure';
import { TypeZone } from '@prisma/client';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { AffecterApplicationDto } from './dto/affecter-application.dto';
import { CreateEchangeDto } from './dto/create-echange.dto';
import { CreateApplicationServiceDto } from './dto/create-application-service.dto';

@Injectable()
export class UrbanisationService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Applications ─────────────────────────────────────────────────────────

  createApplication(organisationId: string, dto: CreateApplicationDto) {
    return this.prisma.application.create({ data: { ...dto, organisationId } });
  }

  findAllApplications(organisationId: string) {
    return this.prisma.application.findMany({
      where: { organisationId },
      orderBy: { nom: 'asc' },
      include: {
        services: true,
        _count: { select: { zones: true, services: true, echangesSource: true, echangesTarget: true } },
      },
    });
  }

  async findOneApplication(id: string, organisationId: string) {
    const app = await this.prisma.application.findUnique({
      where: { id },
      include: {
        zones: {
          include: {
            zone: { select: { id: true, nom: true, type: true } },
          },
        },
        services: true,
        // Liens applicatifs (interactions entre systèmes) dans les deux sens :
        // cette application peut être la source ou la cible de l'échange.
        echangesSource: { include: { target: { select: { id: true, nom: true } } } },
        echangesTarget: { include: { source: { select: { id: true, nom: true } } } },
      },
    });
    if (!app || app.organisationId !== organisationId) {
      throw new NotFoundException(`Application ${id} introuvable`);
    }
    return app;
  }

  async updateApplication(id: string, organisationId: string, dto: UpdateApplicationDto) {
    await this.assertApplicationExists(id, organisationId);
    return this.prisma.application.update({ where: { id }, data: dto });
  }

  async removeApplication(id: string, organisationId: string) {
    await this.assertApplicationExists(id, organisationId);
    return this.prisma.application.delete({ where: { id } });
  }

  // ─── Zones d'urbanisation ─────────────────────────────────────────────────

  createZone(organisationId: string, dto: CreateZoneDto) {
    return this.prisma.zoneUrbanisation.create({
      data: {
        organisationId,
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

  async findOneZone(id: string, organisationId: string) {
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
    if (!zone || zone.organisationId !== organisationId) {
      throw new NotFoundException(`Zone ${id} introuvable`);
    }
    return zone;
  }

  async updateZone(id: string, organisationId: string, dto: UpdateZoneDto) {
    await this.assertZoneExists(id, organisationId);
    return this.prisma.zoneUrbanisation.update({
      where: { id },
      data: {
        ...(dto.nom !== undefined && { nom: dto.nom }),
        ...('parentId' in dto && { parentId: dto.parentId }),
      },
    });
  }

  async removeZone(id: string, organisationId: string) {
    await this.assertZoneExists(id, organisationId);
    return this.prisma.zoneUrbanisation.delete({ where: { id } });
  }

  // ─── Affectation application ↔ zone (POS) ────────────────────────────────

  async affecter(organisationId: string, dto: AffecterApplicationDto) {
    const [, zone] = await Promise.all([
      this.assertApplicationExists(dto.applicationId, organisationId),
      this.prisma.zoneUrbanisation.findUnique({
        where: { id: dto.zoneId },
        select: { type: true, organisationId: true },
      }),
    ]);
    if (!zone || zone.organisationId !== organisationId) {
      throw new NotFoundException(`Zone ${dto.zoneId} introuvable`);
    }
    if (zone.type !== TypeZone.ILOT) {
      throw new BadRequestException(
        "Une application ne peut être affectée qu'à un îlot (référentiel POS) — la zone visée est de type " +
          zone.type,
      );
    }

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

  async desaffecter(organisationId: string, applicationId: string, zoneId: string) {
    await Promise.all([
      this.assertApplicationExists(applicationId, organisationId),
      this.assertZoneExists(zoneId, organisationId),
    ]);

    const affectation = await this.prisma.applicationZone.findUnique({
      where: { applicationId_zoneId: { applicationId, zoneId } },
    });
    if (!affectation) throw new NotFoundException('Affectation introuvable');
    return this.prisma.applicationZone.delete({
      where: { applicationId_zoneId: { applicationId, zoneId } },
    });
  }

  // ─── Échanges applicatifs (diagramme de composants UML) ──────────────────

  findAllEchanges(organisationId: string) {
    return this.prisma.applicationEchange.findMany({
      where: { source: { organisationId } },
      include: { source: true, target: true },
    });
  }

  async createEchange(organisationId: string, dto: CreateEchangeDto) {
    const [source, target] = await Promise.all([
      this.prisma.application.findUnique({ where: { id: dto.sourceId } }),
      this.prisma.application.findUnique({ where: { id: dto.targetId } }),
    ]);
    if (
      !source ||
      source.organisationId !== organisationId ||
      !target ||
      target.organisationId !== organisationId
    ) {
      throw new BadRequestException('Source et cible doivent appartenir à votre organisation');
    }
    return this.prisma.applicationEchange.create({ data: dto });
  }

  async removeEchange(echangeId: string, organisationId: string) {
    const echange = await this.prisma.applicationEchange.findUnique({
      where: { id: echangeId },
      include: { source: true },
    });
    if (!echange || echange.source.organisationId !== organisationId) {
      throw new NotFoundException(`Échange ${echangeId} introuvable`);
    }
    return this.prisma.applicationEchange.delete({ where: { id: echangeId } });
  }

  // ─── Services applicatifs ──────────────────────────────────────────────────

  async addService(applicationId: string, organisationId: string, dto: CreateApplicationServiceDto) {
    await this.assertApplicationExists(applicationId, organisationId);
    return this.prisma.applicationService.create({ data: { ...dto, applicationId } });
  }

  async removeService(serviceId: string, organisationId: string) {
    const service = await this.prisma.applicationService.findUnique({
      where: { id: serviceId },
      include: { application: true },
    });
    if (!service || service.application.organisationId !== organisationId) {
      throw new NotFoundException(`Service ${serviceId} introuvable`);
    }
    return this.prisma.applicationService.delete({ where: { id: serviceId } });
  }

  // ─── Utilitaires ──────────────────────────────────────────────────────────

  private async assertApplicationExists(id: string, organisationId: string) {
    const count = await this.prisma.application.count({ where: { id, organisationId } });
    if (!count) throw new NotFoundException(`Application ${id} introuvable`);
  }

  private async assertZoneExists(id: string, organisationId: string) {
    const count = await this.prisma.zoneUrbanisation.count({ where: { id, organisationId } });
    if (!count) throw new NotFoundException(`Zone ${id} introuvable`);
  }
}
