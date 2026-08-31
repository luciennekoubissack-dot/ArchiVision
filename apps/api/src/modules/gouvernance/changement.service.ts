import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@archivision/infrastructure';
import { PaginationQueryDto, paginateFindMany } from '@archivision/shared';
import { StatutChangement } from '@prisma/client';
import { CreateChangementDto } from './dto/create-changement.dto';
import { UpdateChangementDto } from './dto/update-changement.dto';

@Injectable()
export class ChangementService {
  constructor(private readonly prisma: PrismaService) {}

  create(organisationId: string, dto: CreateChangementDto) {
    return this.prisma.demandeChangement.create({ data: { ...dto, organisationId } });
  }

  findAll(organisationId: string, pagination?: PaginationQueryDto) {
    return paginateFindMany(this.prisma.demandeChangement, { where: { organisationId }, orderBy: { createdAt: 'desc' } }, pagination);
  }

  /**
   * Évite au frontend de charger la liste complète des demandes rien que
   * pour afficher un total et un compte "en cours" (onglet Rapport).
   */
  async getStats(organisationId: string): Promise<{ total: number; enCours: number }> {
    const [total, enCours] = await Promise.all([
      this.prisma.demandeChangement.count({ where: { organisationId } }),
      this.prisma.demandeChangement.count({
        where: { organisationId, statut: { in: [StatutChangement.PROPOSE, StatutChangement.APPROUVE] } },
      }),
    ]);
    return { total, enCours };
  }

  async update(id: string, organisationId: string, dto: UpdateChangementDto) {
    await this.assertExists(id, organisationId);
    return this.prisma.demandeChangement.update({ where: { id }, data: dto });
  }

  async remove(id: string, organisationId: string) {
    await this.assertExists(id, organisationId);
    return this.prisma.demandeChangement.delete({ where: { id } });
  }

  private async assertExists(id: string, organisationId: string) {
    const count = await this.prisma.demandeChangement.count({ where: { id, organisationId } });
    if (!count) throw new NotFoundException(`Demande de changement ${id} introuvable`);
  }
}
