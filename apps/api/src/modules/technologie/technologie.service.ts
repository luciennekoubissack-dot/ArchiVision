import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@archivision/infrastructure';
import { PaginationQueryDto, paginateFindMany } from '@archivision/shared';
import { CreateTechComponentDto } from './dto/create-tech-component.dto';
import { UpdateTechComponentDto } from './dto/update-tech-component.dto';
import { DeployerApplicationDto } from './dto/deployer-application.dto';

@Injectable()
export class TechnologieService {
  constructor(private readonly prisma: PrismaService) {}

  create(organisationId: string, dto: CreateTechComponentDto) {
    return this.prisma.techComponent.create({ data: { ...dto, organisationId } });
  }

  findAll(organisationId: string, pagination?: PaginationQueryDto) {
    return paginateFindMany(
      this.prisma.techComponent,
      { where: { organisationId }, orderBy: { nom: 'asc' }, include: { deploiements: { include: { application: true } } } },
      pagination,
    );
  }

  async findOne(id: string, organisationId: string) {
    const component = await this.prisma.techComponent.findUnique({
      where: { id },
      include: { deploiements: { include: { application: true } } },
    });
    if (!component || component.organisationId !== organisationId) {
      throw new NotFoundException(`Composant technique ${id} introuvable`);
    }
    return component;
  }

  async update(id: string, organisationId: string, dto: UpdateTechComponentDto) {
    await this.assertExists(id, organisationId);
    return this.prisma.techComponent.update({ where: { id }, data: dto });
  }

  async remove(id: string, organisationId: string) {
    await this.assertExists(id, organisationId);
    return this.prisma.techComponent.delete({ where: { id } });
  }

  async deployer(organisationId: string, dto: DeployerApplicationDto) {
    const [application, techComponent] = await Promise.all([
      this.prisma.application.findUnique({ where: { id: dto.applicationId } }),
      this.prisma.techComponent.findUnique({ where: { id: dto.techComponentId } }),
    ]);
    if (!application || application.organisationId !== organisationId) {
      throw new BadRequestException("L'application choisie n'appartient pas à votre organisation");
    }
    if (!techComponent || techComponent.organisationId !== organisationId) {
      throw new BadRequestException("Le composant technique choisi n'appartient pas à votre organisation");
    }
    const existant = await this.prisma.techDeploiement.findUnique({
      where: {
        applicationId_techComponentId: { applicationId: dto.applicationId, techComponentId: dto.techComponentId },
      },
    });
    if (existant) {
      throw new ConflictException('Cette application est déjà déployée sur ce composant');
    }
    return this.prisma.techDeploiement.create({ data: dto });
  }

  async undeployer(applicationId: string, techComponentId: string, organisationId: string) {
    const component = await this.prisma.techComponent.findUnique({ where: { id: techComponentId } });
    if (!component || component.organisationId !== organisationId) {
      throw new NotFoundException(`Composant technique ${techComponentId} introuvable`);
    }
    await this.prisma.techDeploiement.delete({
      where: { applicationId_techComponentId: { applicationId, techComponentId } },
    });
  }

  private async assertExists(id: string, organisationId: string) {
    const count = await this.prisma.techComponent.count({ where: { id, organisationId } });
    if (!count) throw new NotFoundException(`Composant technique ${id} introuvable`);
  }
}
