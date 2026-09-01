import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@archivision/infrastructure';
import { requireFrontendOrigin } from '@archivision/shared';
import { RoleUtilisateur, StatutOrganisation } from '@prisma/client';
import { PaginationQueryDto, paginateFindMany } from '@archivision/shared';
import { MailService, SentEmail } from '../mail/mail.service';

/** Champs de l'organisation que le superadmin doit contrôler avant de valider. */
const CHAMPS_REQUIS_VALIDATION = ['nom', 'secteur', 'pays', 'ville', 'vision'] as const;

const CHAMP_LABELS: Record<string, string> = {
  nom: 'Nom',
  secteur: 'Secteur',
  pays: 'Pays',
  ville: 'Ville',
  vision: 'Objectif',
  administrateur: 'Compte administrateur',
};

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

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
          ville: true,
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

  async valider(id: string): Promise<{ organisation: unknown; email: SentEmail }> {
    const existante = await this.getOrganisation(id);

    // Contrôle de complétude : le superadmin ne peut valider qu'un dossier
    // dont toutes les informations de revue sont présentes.
    const manquants: string[] = CHAMPS_REQUIS_VALIDATION.filter(
      (champ) => !String(existante[champ] ?? '').trim(),
    );
    const admin = existante.users.find((u) => u.role === RoleUtilisateur.ADMINISTRATEUR);
    if (!admin) manquants.push('administrateur');
    if (manquants.length > 0 || !admin) {
      throw new BadRequestException(
        `Champs obligatoires incomplets : ${manquants.map((c) => CHAMP_LABELS[c] ?? c).join(', ')}`,
      );
    }

    const organisation = await this.prisma.organisation.update({
      where: { id },
      data: { statut: StatutOrganisation.VALIDEE, validatedAt: new Date() },
      include: { _count: { select: { users: true } } },
    });

    const loginUrl = `${requireFrontendOrigin(this.config)}/login`;
    const email = await this.mail.sendOrganisationValidee(admin.email, organisation.nom, loginUrl);
    return { organisation, email };
  }

  async rejeter(id: string): Promise<{ organisation: unknown; email: SentEmail }> {
    await this.assertExists(id);
    const organisation = await this.prisma.organisation.update({
      where: { id },
      data: { statut: StatutOrganisation.REJETEE },
      include: { _count: { select: { users: true } } },
    });

    const admin = await this.prisma.user.findFirst({
      where: { organisationId: id, role: RoleUtilisateur.ADMINISTRATEUR },
      select: { email: true },
    });
    const email = await this.mail.sendOrganisationRejetee(
      admin?.email ?? '(destinataire introuvable)',
      organisation.nom,
    );
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
}
