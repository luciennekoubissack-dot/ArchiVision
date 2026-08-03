import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@archivision/infrastructure';
import { CreateOrganisationDto } from './dto/create-organisation.dto';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';

const organisationSelect = {
  id: true,
  nom: true,
  description: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class OrganisationService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateOrganisationDto) {
    return this.prisma.organisation.create({
      data: dto,
      select: organisationSelect,
    });
  }

  findAll() {
    return this.prisma.organisation.findMany({
      select: organisationSelect,
      orderBy: { nom: 'asc' },
    });
  }

  async findOne(id: string) {
    const organisation = await this.prisma.organisation.findUnique({
      where: { id },
      select: organisationSelect,
    });

    if (!organisation) {
      throw new NotFoundException(`Organisation ${id} introuvable`);
    }

    return organisation;
  }

  async update(id: string, dto: UpdateOrganisationDto) {
    await this.assertExists(id);

    return this.prisma.organisation.update({
      where: { id },
      data: dto,
      select: organisationSelect,
    });
  }

  async remove(id: string) {
    await this.assertExists(id);
    await this.prisma.organisation.delete({ where: { id } });
  }

  private async assertExists(id: string) {
    const count = await this.prisma.organisation.count({ where: { id } });
    if (!count) {
      throw new NotFoundException(`Organisation ${id} introuvable`);
    }
  }
}
