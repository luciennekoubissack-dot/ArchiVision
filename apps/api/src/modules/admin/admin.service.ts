import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@archivision/infrastructure';
import { RoleUtilisateur, StatutOrganisation } from '@prisma/client';
import { PaginationQueryDto, paginateFindMany } from '@archivision/shared';

export interface SimulatedEmail {
  to: string;
  subject: string;
  body: string;
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  listOrganisations(statut?: StatutOrganisation, pagination?: PaginationQueryDto) {
    return paginateFindMany(
      this.prisma.organisation,
      {
        where: statut ? { statut } : {},
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          nom: true,
          secteur: true,
          taille: true,
          pays: true,
          statut: true,
          createdAt: true,
          validatedAt: true,
          _count: { select: { users: true } },
        },
      },
      pagination,
    );
  }

  async getOrganisation(id: string) {
    const organisation = await this.prisma.organisation.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, nom: true, email: true, role: true, createdAt: true },
          orderBy: { nom: 'asc' },
        },
      },
    });
    if (!organisation) throw new NotFoundException(`Organisation ${id} introuvable`);
    return organisation;
  }

  async valider(id: string): Promise<{ organisation: unknown; email: SimulatedEmail }> {
    await this.assertExists(id);
    const organisation = await this.prisma.organisation.update({
      where: { id },
      data: { statut: StatutOrganisation.VALIDEE, validatedAt: new Date() },
      include: { _count: { select: { users: true } } },
    });
    const email = await this.buildEmail(id, organisation.nom, 'VALIDEE');
    this.logSimulatedEmail(email);
    return { organisation, email };
  }

  async rejeter(id: string): Promise<{ organisation: unknown; email: SimulatedEmail }> {
    await this.assertExists(id);
    const organisation = await this.prisma.organisation.update({
      where: { id },
      data: { statut: StatutOrganisation.REJETEE },
      include: { _count: { select: { users: true } } },
    });
    const email = await this.buildEmail(id, organisation.nom, 'REJETEE');
    this.logSimulatedEmail(email);
    return { organisation, email };
  }

  async remove(id: string): Promise<void> {
    await this.assertExists(id);
    await this.prisma.organisation.delete({ where: { id } });
  }

  listUtilisateurs(pagination?: PaginationQueryDto) {
    return paginateFindMany(
      this.prisma.user,
      {
        where: { role: { not: RoleUtilisateur.SUPERADMIN } },
        select: {
          id: true,
          nom: true,
          email: true,
          role: true,
          createdAt: true,
          organisation: { select: { id: true, nom: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      pagination,
    );
  }

  async stats() {
    const [totalUtilisateurs, enAttente, validees, rejetees] = await Promise.all([
      this.prisma.user.count({ where: { role: { not: RoleUtilisateur.SUPERADMIN } } }),
      this.prisma.organisation.count({ where: { statut: StatutOrganisation.EN_ATTENTE } }),
      this.prisma.organisation.count({ where: { statut: StatutOrganisation.VALIDEE } }),
      this.prisma.organisation.count({ where: { statut: StatutOrganisation.REJETEE } }),
    ]);
    return {
      totalUtilisateurs,
      organisations: { enAttente, validees, rejetees, total: enAttente + validees + rejetees },
    };
  }

  private async assertExists(id: string) {
    const organisation = await this.prisma.organisation.findUnique({ where: { id } });
    if (!organisation) throw new NotFoundException(`Organisation ${id} introuvable`);
    return organisation;
  }

  private async buildEmail(
    organisationId: string,
    organisationNom: string,
    statut: 'VALIDEE' | 'REJETEE',
  ): Promise<SimulatedEmail> {
    const admin = await this.prisma.user.findFirst({
      where: { organisationId, role: RoleUtilisateur.ADMINISTRATEUR },
      select: { email: true },
    });
    const to = admin?.email ?? '(destinataire introuvable)';

    if (statut === 'VALIDEE') {
      return {
        to,
        subject: 'Bienvenue sur ArchiVision — votre organisation est validée',
        body: `Bonjour,\n\nVotre organisation « ${organisationNom} » a été validée par notre équipe. Vous pouvez désormais vous connecter à ArchiVision.\n\nÀ bientôt !`,
      };
    }
    return {
      to,
      subject: "ArchiVision — votre demande d'inscription",
      body: `Bonjour,\n\nNous ne sommes pas en mesure de donner suite à l'inscription de « ${organisationNom} » pour le moment.\n\nCordialement.`,
    };
  }

  private logSimulatedEmail(email: SimulatedEmail): void {
    console.log(`[MAIL:SIMULÉ] À: ${email.to} | Sujet: ${email.subject}\n${email.body}`);
  }
}
