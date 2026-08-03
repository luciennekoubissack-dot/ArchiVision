import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Utilisateur admin
  const passwordHash = await bcrypt.hash('Admin123!', 10);
  const user = await prisma.user.upsert({
    where: { email: 'admin@archivision.local' },
    update: {},
    create: {
      email: 'admin@archivision.local',
      passwordHash,
      nom: 'Admin ArchiVision',
    },
  });

  // Organisation de démonstration (K&B Groupe SARL — cas d'usage référentiel.md)
  const org = await prisma.organisation.upsert({
    where: { id: 'org-demo-001' },
    update: {},
    create: {
      id: 'org-demo-001',
      nom: 'K&B Groupe SARL',
      description: 'Organisation de démonstration ArchiVision',
    },
  });

  // Capacités métier
  const capaciteFormation = await prisma.capaciteMetier.upsert({
    where: { id: 'cap-001' },
    update: {},
    create: {
      id: 'cap-001',
      nom: 'Gestion des formations',
      description: 'Planification, suivi et évaluation des formations internes',
      organisationId: org.id,
    },
  });

  await prisma.capaciteMetier.upsert({
    where: { id: 'cap-002' },
    update: {},
    create: {
      id: 'cap-002',
      nom: 'Gestion RH',
      description: 'Recrutement, paie et administration du personnel',
      organisationId: org.id,
    },
  });

  // Éléments ArchiMate
  const acteur = await prisma.elementArchimate.upsert({
    where: { id: 'elem-001' },
    update: {},
    create: {
      id: 'elem-001',
      nom: 'Responsable Formation',
      type: 'ACTEUR_METIER',
      organisationId: org.id,
      capaciteMetierId: capaciteFormation.id,
    },
  });

  const processus = await prisma.elementArchimate.upsert({
    where: { id: 'elem-002' },
    update: {},
    create: {
      id: 'elem-002',
      nom: 'Planifier une formation',
      type: 'PROCESSUS_METIER',
      organisationId: org.id,
      capaciteMetierId: capaciteFormation.id,
    },
  });

  await prisma.relationArchimate.upsert({
    where: { id: 'rel-001' },
    update: {},
    create: {
      id: 'rel-001',
      type: 'ASSIGNATION',
      sourceId: acteur.id,
      targetId: processus.id,
    },
  });

  // Application et zone d'urbanisation
  const app = await prisma.application.upsert({
    where: { id: 'app-001' },
    update: {},
    create: {
      id: 'app-001',
      nom: 'SIRH',
      description: 'Système d\'Information RH',
      criticite: 'HAUTE',
      organisationId: org.id,
    },
  });

  const zone = await prisma.zoneUrbanisation.upsert({
    where: { id: 'zone-001' },
    update: {},
    create: {
      id: 'zone-001',
      nom: 'Zone RH',
      type: 'ZONE',
      organisationId: org.id,
    },
  });

  const ilot = await prisma.zoneUrbanisation.upsert({
    where: { id: 'zone-002' },
    update: {},
    create: {
      id: 'zone-002',
      nom: 'Îlot Formation',
      type: 'ILOT',
      parentId: zone.id,
      organisationId: org.id,
    },
  });

  await prisma.applicationZone.upsert({
    where: { applicationId_zoneId: { applicationId: app.id, zoneId: ilot.id } },
    update: {},
    create: { applicationId: app.id, zoneId: ilot.id },
  });

  console.log(`✓ User    : ${user.email}`);
  console.log(`✓ Org     : ${org.nom}`);
  console.log(`✓ Seed complet — référentiel v1 prêt`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
