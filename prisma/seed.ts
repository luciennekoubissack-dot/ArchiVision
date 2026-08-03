import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

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

  // Organisation de démonstration
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

  // Éléments ArchiMate de démonstration
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

  console.log(`✓ User : ${user.email}`);
  console.log(`✓ Organisation : ${org.nom}`);
  console.log(`✓ Capacités, éléments et relations créés`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
