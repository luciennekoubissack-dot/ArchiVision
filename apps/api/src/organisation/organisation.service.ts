import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@archivision/infrastructure';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';

const organisationSelect = {
  id: true,
  nom: true,
  description: true,
  logoUrl: true,
  secteur: true,
  taille: true,
  pays: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class OrganisationService {
  constructor(private readonly prisma: PrismaService) {}

  async findMine(organisationId: string) {
    const organisation = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: organisationSelect,
    });
    if (!organisation) {
      throw new NotFoundException('Organisation introuvable');
    }
    return organisation;
  }

  async updateMine(organisationId: string, dto: UpdateOrganisationDto) {
    await this.findMine(organisationId);
    return this.prisma.organisation.update({
      where: { id: organisationId },
      data: dto,
      select: organisationSelect,
    });
  }

  async exportReferentiel(organisationId: string) {
    const [organisation, capacites, elements, relations, applications, zones] = await Promise.all([
      this.prisma.organisation.findUnique({ where: { id: organisationId }, select: organisationSelect }),
      this.prisma.capaciteMetier.findMany({ where: { organisationId } }),
      this.prisma.elementArchimate.findMany({ where: { organisationId } }),
      this.prisma.relationArchimate.findMany({ where: { source: { organisationId } } }),
      this.prisma.application.findMany({ where: { organisationId } }),
      this.prisma.zoneUrbanisation.findMany({ where: { organisationId } }),
    ]);

    if (!organisation) {
      throw new NotFoundException('Organisation introuvable');
    }

    return {
      exportedAt: new Date().toISOString(),
      organisation,
      capacites,
      elements,
      relations,
      applications,
      zones,
    };
  }
}
