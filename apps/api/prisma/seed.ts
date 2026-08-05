import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// IDs fixes (UUID valides) pour un seed idempotent. Toutes les DTO de
// l'API valident les références (organisationId, capaciteMetierId, etc.)
// avec @IsUUID() — des identifiants lisibles comme "org-demo-001"
// passeraient la création en base mais feraient échouer en 400 toute
// requête ultérieure qui les référence (ex. POST /zones-urbanisation/affecter).
const ORG_ID = '10000000-0000-4000-8000-000000000001';
const CAP_FORMATION_ID = '10000000-0000-4000-8000-000000000010';
const CAP_RH_ID = '10000000-0000-4000-8000-000000000011';
const ELEM_ACTEUR_ID = '10000000-0000-4000-8000-000000000020';
const ELEM_PROCESSUS_ID = '10000000-0000-4000-8000-000000000021';
const REL_ID = '10000000-0000-4000-8000-000000000030';
const APP_ID = '10000000-0000-4000-8000-000000000040';
const ZONE_ID = '10000000-0000-4000-8000-000000000050';
const ILOT_ID = '10000000-0000-4000-8000-000000000051';
const SERVICE_DG_ID = '10000000-0000-4000-8000-000000000060';
const OBJECTIF_ID = '10000000-0000-4000-8000-000000000070';

async function main() {
  // Organisation de démonstration (K&B Groupe SARL — cas d'usage référentiel.md)
  const org = await prisma.organisation.upsert({
    where: { id: ORG_ID },
    update: {},
    create: {
      id: ORG_ID,
      nom: 'K&B Groupe SARL',
      description: 'Organisation de démonstration ArchiVision',
      logoUrl: 'https://via.placeholder.com/128?text=K%26B',
      secteur: 'Conseil & services',
      taille: '150 collaborateurs',
      pays: 'France',
    },
  });

  // Service racine (organigramme)
  const serviceDG = await prisma.service.upsert({
    where: { id: SERVICE_DG_ID },
    update: {},
    create: {
      id: SERVICE_DG_ID,
      nom: 'Direction Générale',
      description: 'Pilotage stratégique de K&B Groupe SARL',
      organisationId: org.id,
    },
  });

  // Utilisateur admin — premier Architecte de l'organisation
  const passwordHash = await bcrypt.hash('Admin123!', 10);
  const user = await prisma.user.upsert({
    where: { email: 'admin@archivision.local' },
    update: {},
    create: {
      email: 'admin@archivision.local',
      passwordHash,
      nom: 'Admin ArchiVision',
      organisationId: org.id,
      role: 'ARCHITECTE',
      serviceId: serviceDG.id,
    },
  });

  await prisma.objectif.upsert({
    where: { id: OBJECTIF_ID },
    update: {},
    create: {
      id: OBJECTIF_ID,
      nom: 'Digitaliser la gestion administrative',
      description: "Réduire les traitements manuels sur les processus RH et formation d'ici fin d'année",
      organisationId: org.id,
    },
  });

  // Capacités métier
  const capaciteFormation = await prisma.capaciteMetier.upsert({
    where: { id: CAP_FORMATION_ID },
    update: {},
    create: {
      id: CAP_FORMATION_ID,
      nom: 'Gestion des formations',
      description: 'Planification, suivi et évaluation des formations internes',
      organisationId: org.id,
    },
  });

  await prisma.capaciteMetier.upsert({
    where: { id: CAP_RH_ID },
    update: {},
    create: {
      id: CAP_RH_ID,
      nom: 'Gestion RH',
      description: 'Recrutement, paie et administration du personnel',
      organisationId: org.id,
    },
  });

  // Éléments ArchiMate
  const acteur = await prisma.elementArchimate.upsert({
    where: { id: ELEM_ACTEUR_ID },
    update: {},
    create: {
      id: ELEM_ACTEUR_ID,
      nom: 'Responsable Formation',
      type: 'ACTEUR_METIER',
      organisationId: org.id,
      capaciteMetierId: capaciteFormation.id,
    },
  });

  const processus = await prisma.elementArchimate.upsert({
    where: { id: ELEM_PROCESSUS_ID },
    update: {},
    create: {
      id: ELEM_PROCESSUS_ID,
      nom: 'Planifier une formation',
      type: 'PROCESSUS_METIER',
      organisationId: org.id,
      capaciteMetierId: capaciteFormation.id,
    },
  });

  await prisma.relationArchimate.upsert({
    where: { id: REL_ID },
    update: {},
    create: {
      id: REL_ID,
      type: 'ASSIGNATION',
      sourceId: acteur.id,
      targetId: processus.id,
    },
  });

  // Application et zone d'urbanisation
  const app = await prisma.application.upsert({
    where: { id: APP_ID },
    update: {},
    create: {
      id: APP_ID,
      nom: 'SIRH',
      description: 'Système d\'Information RH',
      criticite: 'HAUTE',
      organisationId: org.id,
    },
  });

  const zone = await prisma.zoneUrbanisation.upsert({
    where: { id: ZONE_ID },
    update: {},
    create: {
      id: ZONE_ID,
      nom: 'Zone RH',
      type: 'ZONE',
      organisationId: org.id,
    },
  });

  const ilot = await prisma.zoneUrbanisation.upsert({
    where: { id: ILOT_ID },
    update: {},
    create: {
      id: ILOT_ID,
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

  console.log(`✓ User    : ${user.email} (${user.role})`);
  console.log(`✓ Org     : ${org.nom}`);
  console.log(`✓ Service : ${serviceDG.nom}`);
  console.log(`✓ Seed complet — référentiel multi-tenant prêt`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
