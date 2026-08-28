import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@archivision/infrastructure';
import { CreateArchiApplicativeElementDto } from './dto/create-element.dto';
import { UpdateArchiApplicativeElementDto } from './dto/update-element.dto';
import { CreateArchiApplicativeFluxDto } from './dto/create-flux.dto';

@Injectable()
export class ArchitectureApplicativeService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Éléments ─────────────────────────────────────────────────────────────

  createElement(organisationId: string, dto: CreateArchiApplicativeElementDto) {
    return this.prisma.archiApplicativeElement.create({ data: { ...dto, organisationId } });
  }

  findAllElements(organisationId: string) {
    return this.prisma.archiApplicativeElement.findMany({
      where: { organisationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOneElement(id: string, organisationId: string) {
    const element = await this.prisma.archiApplicativeElement.findUnique({ where: { id } });
    if (!element || element.organisationId !== organisationId) {
      throw new NotFoundException(`Élément ${id} introuvable`);
    }
    return element;
  }

  async updateElement(id: string, organisationId: string, dto: UpdateArchiApplicativeElementDto) {
    await this.findOneElement(id, organisationId);
    return this.prisma.archiApplicativeElement.update({ where: { id }, data: dto });
  }

  async removeElement(id: string, organisationId: string) {
    await this.findOneElement(id, organisationId);
    return this.prisma.archiApplicativeElement.delete({ where: { id } });
  }

  // ── Flux ─────────────────────────────────────────────────────────────────

  findAllFlux(organisationId: string) {
    return this.prisma.archiApplicativeFlux.findMany({
      where: { source: { organisationId } },
      include: { source: true, target: true },
    });
  }

  async createFlux(organisationId: string, dto: CreateArchiApplicativeFluxDto) {
    const [source, target] = await Promise.all([
      this.prisma.archiApplicativeElement.findUnique({ where: { id: dto.sourceId } }),
      this.prisma.archiApplicativeElement.findUnique({ where: { id: dto.targetId } }),
    ]);
    if (
      !source ||
      source.organisationId !== organisationId ||
      !target ||
      target.organisationId !== organisationId
    ) {
      throw new BadRequestException('Source et cible doivent appartenir à votre organisation');
    }
    return this.prisma.archiApplicativeFlux.create({ data: dto });
  }

  async removeFlux(id: string, organisationId: string) {
    const flux = await this.prisma.archiApplicativeFlux.findUnique({
      where: { id },
      include: { source: true },
    });
    if (!flux || flux.source.organisationId !== organisationId) {
      throw new NotFoundException(`Flux ${id} introuvable`);
    }
    return this.prisma.archiApplicativeFlux.delete({ where: { id } });
  }
}
