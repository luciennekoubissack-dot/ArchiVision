import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── IDs fixes (UUID v4 valides) — seed idempotent ───────────────────────────

// Auth
const SUPERADMIN_EMAIL = 'superadmin@archivision.local';
const SUPERADMIN_PASSWORD = 'SuperAdmin123!';

// Organisation
const ORG_ID          = '20000000-0000-4000-8000-000000000001';

// Structures (Services)
const SVC_DG_ID       = '20000000-0000-4000-8000-000000000100';
const SVC_DSI_ID      = '20000000-0000-4000-8000-000000000101';
const SVC_DEV_ID      = '20000000-0000-4000-8000-000000000102';
const SVC_INFRA_ID    = '20000000-0000-4000-8000-000000000103';
const SVC_RH_ID       = '20000000-0000-4000-8000-000000000104';
const SVC_FIN_ID      = '20000000-0000-4000-8000-000000000105';
const SVC_COM_ID      = '20000000-0000-4000-8000-000000000106';
const SVC_PROD_ID     = '20000000-0000-4000-8000-000000000107';

// Membres (Users)
const USER_ADMIN_ID   = '20000000-0000-4000-8000-000000000200';
const USER_ARCHI1_ID  = '20000000-0000-4000-8000-000000000201';
const USER_ARCHI2_ID  = '20000000-0000-4000-8000-000000000202';
const USER_ARCHI3_ID  = '20000000-0000-4000-8000-000000000203';

// Objectifs
const OBJ_DIG_ID      = '20000000-0000-4000-8000-000000000300';
const OBJ_PERF_ID     = '20000000-0000-4000-8000-000000000301';
const OBJ_SEC_ID      = '20000000-0000-4000-8000-000000000302';
const OBJ_DIG_TOBE_ID = '20000000-0000-4000-8000-000000000303';
const OBJ_PERF_TOBE_ID= '20000000-0000-4000-8000-000000000304';

// Capacités métier
const CAP_PROD_ID     = '20000000-0000-4000-8000-000000000400';
const CAP_LOG_ID      = '20000000-0000-4000-8000-000000000401';
const CAP_RH_ID       = '20000000-0000-4000-8000-000000000402';
const CAP_MAINT_ID    = '20000000-0000-4000-8000-000000000403';
const CAP_VENTE_ID    = '20000000-0000-4000-8000-000000000404';
const CAP_FIN_ID      = '20000000-0000-4000-8000-000000000405';

// Éléments ArchiMate
const E_VISION_ID     = '20000000-0000-4000-8000-000000000500';
const E_OBJ_ARCH_ID   = '20000000-0000-4000-8000-000000000501';
const E_PRIN1_ID      = '20000000-0000-4000-8000-000000000502';
const E_PRIN2_ID      = '20000000-0000-4000-8000-000000000503';
const E_EXI1_ID       = '20000000-0000-4000-8000-000000000504';
const E_EXI2_ID       = '20000000-0000-4000-8000-000000000505';
const E_ACT1_ID       = '20000000-0000-4000-8000-000000000506';
const E_ACT2_ID       = '20000000-0000-4000-8000-000000000507';
const E_ACT3_ID       = '20000000-0000-4000-8000-000000000508';
const E_ROLE1_ID      = '20000000-0000-4000-8000-000000000509';
const E_ROLE2_ID      = '20000000-0000-4000-8000-000000000510';
const E_PROC1_ID      = '20000000-0000-4000-8000-000000000511';
const E_PROC2_ID      = '20000000-0000-4000-8000-000000000512';
const E_PROC3_ID      = '20000000-0000-4000-8000-000000000513';
const E_SVC1_ID       = '20000000-0000-4000-8000-000000000514';
const E_SVC2_ID       = '20000000-0000-4000-8000-000000000515';
const E_OBJ1_ID       = '20000000-0000-4000-8000-000000000516';

// Relations ArchiMate
const REL_01_ID       = '20000000-0000-4000-8000-000000000600';
const REL_02_ID       = '20000000-0000-4000-8000-000000000601';
const REL_03_ID       = '20000000-0000-4000-8000-000000000602';
const REL_04_ID       = '20000000-0000-4000-8000-000000000603';
const REL_05_ID       = '20000000-0000-4000-8000-000000000604';
const REL_06_ID       = '20000000-0000-4000-8000-000000000605';
const REL_07_ID       = '20000000-0000-4000-8000-000000000606';
const REL_08_ID       = '20000000-0000-4000-8000-000000000607';

// BPMN Processus
const BPMN_PROD_ID    = '20000000-0000-4000-8000-000000000700';
const BPMN_RH_ID      = '20000000-0000-4000-8000-000000000701';
const BPMN_MAINT_ID   = '20000000-0000-4000-8000-000000000702';

// BPMN Éléments (processus production)
const BE_P1_START     = '20000000-0000-4000-8000-000000000710';
const BE_P1_T1        = '20000000-0000-4000-8000-000000000711';
const BE_P1_T2        = '20000000-0000-4000-8000-000000000712';
const BE_P1_GW1       = '20000000-0000-4000-8000-000000000713';
const BE_P1_T3        = '20000000-0000-4000-8000-000000000714';
const BE_P1_T4        = '20000000-0000-4000-8000-000000000715';
const BE_P1_END       = '20000000-0000-4000-8000-000000000716';
// BPMN Éléments (processus RH recrutement)
const BE_R1_START     = '20000000-0000-4000-8000-000000000720';
const BE_R1_T1        = '20000000-0000-4000-8000-000000000721';
const BE_R1_T2        = '20000000-0000-4000-8000-000000000722';
const BE_R1_GW1       = '20000000-0000-4000-8000-000000000723';
const BE_R1_T3        = '20000000-0000-4000-8000-000000000724';
const BE_R1_T4        = '20000000-0000-4000-8000-000000000725';
const BE_R1_END       = '20000000-0000-4000-8000-000000000726';
// BPMN Éléments (processus maintenance)
const BE_M1_START     = '20000000-0000-4000-8000-000000000730';
const BE_M1_T1        = '20000000-0000-4000-8000-000000000731';
const BE_M1_T2        = '20000000-0000-4000-8000-000000000732';
const BE_M1_GW1       = '20000000-0000-4000-8000-000000000733';
const BE_M1_T3        = '20000000-0000-4000-8000-000000000734';
const BE_M1_END       = '20000000-0000-4000-8000-000000000735';

// Applications
const APP_ERP_ID      = '20000000-0000-4000-8000-000000000800';
const APP_SIRH_ID     = '20000000-0000-4000-8000-000000000801';
const APP_GMAO_ID     = '20000000-0000-4000-8000-000000000802';
const APP_CRM_ID      = '20000000-0000-4000-8000-000000000803';
const APP_GED_ID      = '20000000-0000-4000-8000-000000000804';

// Zones d'urbanisation
const ZONE_METIER_ID  = '20000000-0000-4000-8000-000000000900';
const ZONE_TECH_ID    = '20000000-0000-4000-8000-000000000901';
const QRT_RH_ID       = '20000000-0000-4000-8000-000000000902';
const QRT_PROD_ID     = '20000000-0000-4000-8000-000000000903';
const QRT_COM_ID      = '20000000-0000-4000-8000-000000000904';
const ILOT_SIRH_ID    = '20000000-0000-4000-8000-000000000905';
const ILOT_REC_ID     = '20000000-0000-4000-8000-000000000906';
const ILOT_ERP_ID     = '20000000-0000-4000-8000-000000000907';
const ILOT_GMAO_ID    = '20000000-0000-4000-8000-000000000908';
const ILOT_CRM_ID     = '20000000-0000-4000-8000-000000000909';

// Données
const DE_EMPLOYE_ID   = '20000000-0000-4000-8000-000000000A00';
const DE_ORDRE_ID     = '20000000-0000-4000-8000-000000000A01';
const DE_PRODUIT_ID   = '20000000-0000-4000-8000-000000000A02';
const DE_CLIENT_ID    = '20000000-0000-4000-8000-000000000A03';
const DE_MACHINE_ID   = '20000000-0000-4000-8000-000000000A04';

// Composants technologiques
const TC_SRV1_ID      = '20000000-0000-4000-8000-000000000B00';
const TC_SRV2_ID      = '20000000-0000-4000-8000-000000000B01';
const TC_DB1_ID       = '20000000-0000-4000-8000-000000000B02';
const TC_CLOUD_ID     = '20000000-0000-4000-8000-000000000B03';
const TC_PF_ID        = '20000000-0000-4000-8000-000000000B04';
const TC_SWITCH_ID    = '20000000-0000-4000-8000-000000000B05';
const TC_VPN_ID       = '20000000-0000-4000-8000-000000000B06';
const TC_API_ID       = '20000000-0000-4000-8000-000000000B07';

// Arch applicative — éléments diagramme
const AA_USER_ID      = '20000000-0000-4000-8000-000000000C00';
const AA_ERP_ID       = '20000000-0000-4000-8000-000000000C01';
const AA_SIRH_ID      = '20000000-0000-4000-8000-000000000C02';
const AA_GMAO_ID      = '20000000-0000-4000-8000-000000000C03';
const AA_DB_ID        = '20000000-0000-4000-8000-000000000C04';
const AA_SEC_ID       = '20000000-0000-4000-8000-000000000C05';
const AA_EXT_ID       = '20000000-0000-4000-8000-000000000C06';

// Solutions
const SOL_ERP_ID      = '20000000-0000-4000-8000-000000000D00';
const SOL_CLOUD_ID    = '20000000-0000-4000-8000-000000000D01';
const SOL_SEC_ID      = '20000000-0000-4000-8000-000000000D02';

// Critères
const CRIT_COUT_ID    = '20000000-0000-4000-8000-000000000E00';
const CRIT_RISK_ID    = '20000000-0000-4000-8000-000000000E01';
const CRIT_VAL_ID     = '20000000-0000-4000-8000-000000000E02';
const CRIT_MATUR_ID   = '20000000-0000-4000-8000-000000000E03';

// Politiques
const POL_SEC_ID      = '20000000-0000-4000-8000-000000000F00';
const POL_RGPD_ID     = '20000000-0000-4000-8000-000000000F01';
const POL_INTEROP_ID  = '20000000-0000-4000-8000-000000000F02';

// Projets
const PROJ_ERP_ID     = '20000000-0000-4000-8000-000000000e00';
const PROJ_CLOUD_ID   = '20000000-0000-4000-8000-000000000e01';
const PROJ_SEC_ID     = '20000000-0000-4000-8000-000000000e02';
const PROJ_MOB_ID     = '20000000-0000-4000-8000-000000000e03';

async function main() {
  console.log('🚀 Seed KIRO Industries en cours...');

  // ── 0. Superadmin plateforme ────────────────────────────────────────────
  const superHash = await bcrypt.hash(SUPERADMIN_PASSWORD, 10);
  await prisma.user.upsert({
    where: { email: SUPERADMIN_EMAIL },
    update: {},
    create: {
      email: SUPERADMIN_EMAIL,
      passwordHash: superHash,
      nom: 'Superadmin ArchiVision',
      role: 'SUPERADMIN',
      organisationId: null,
    },
  });

  // ── 1. Organisation ─────────────────────────────────────────────────────
  // TOGAF ADM Phase Préliminaire : identification de l'organisation modélisée
  const org = await prisma.organisation.upsert({
    where: { id: ORG_ID },
    update: {},
    create: {
      id: ORG_ID,
      nom: 'KIRO Industries',
      description: 'Fabricant industriel de composants électroniques pour l\'automobile et l\'aéronautique.',
      secteur: 'Industrie manufacturière',
      taille: '850 collaborateurs',
      pays: 'France',
      ville: 'Bordeaux',
      statut: 'VALIDEE',
      validatedAt: new Date(),
      // TOGAF ADM Phase A — Vision d'architecture
      vision: 'Devenir un acteur industriel 4.0 de référence en Europe d\'ici 2027, en numérisant l\'intégralité de la chaîne de production et en garantissant une traçabilité bout-en-bout des composants.',
      problemesResoudre: 'Systèmes d\'information hétérogènes et non intégrés entre la production, la logistique et les RH. Absence de traçabilité temps réel des ordres de fabrication. Maintenance curative coûteuse faute de données prédictives. Montée en charge difficile des infrastructures on-premise.',
    },
  });

  // ── 2. Structures organisationnelles ────────────────────────────────────
  // TOGAF ADM Phase Préliminaire : cartographie des unités organisationnelles
  const svcDG = await prisma.service.upsert({
    where: { id: SVC_DG_ID },
    update: {},
    create: {
      id: SVC_DG_ID,
      nom: 'Direction Générale',
      description: 'Pilotage stratégique et gouvernance de KIRO Industries.',
      organisationId: ORG_ID,
    },
  });
  const svcDSI = await prisma.service.upsert({
    where: { id: SVC_DSI_ID },
    update: {},
    create: {
      id: SVC_DSI_ID,
      nom: 'Direction des Systèmes d\'Information',
      description: 'Conception, déploiement et exploitation du SI de KIRO Industries.',
      parentId: SVC_DG_ID,
      organisationId: ORG_ID,
    },
  });
  await prisma.service.upsert({
    where: { id: SVC_DEV_ID },
    update: {},
    create: {
      id: SVC_DEV_ID,
      nom: 'Pôle Développement & Intégration',
      description: 'Développement des applications métier et intégrations API.',
      parentId: SVC_DSI_ID,
      organisationId: ORG_ID,
    },
  });
  await prisma.service.upsert({
    where: { id: SVC_INFRA_ID },
    update: {},
    create: {
      id: SVC_INFRA_ID,
      nom: 'Pôle Infrastructure & Sécurité',
      description: 'Gestion des serveurs, réseaux, cloud et cybersécurité.',
      parentId: SVC_DSI_ID,
      organisationId: ORG_ID,
    },
  });
  await prisma.service.upsert({
    where: { id: SVC_RH_ID },
    update: {},
    create: {
      id: SVC_RH_ID,
      nom: 'Direction des Ressources Humaines',
      description: 'Recrutement, formation, paie et gestion des compétences.',
      parentId: SVC_DG_ID,
      organisationId: ORG_ID,
    },
  });
  await prisma.service.upsert({
    where: { id: SVC_FIN_ID },
    update: {},
    create: {
      id: SVC_FIN_ID,
      nom: 'Direction Financière',
      description: 'Comptabilité, contrôle de gestion et trésorerie.',
      parentId: SVC_DG_ID,
      organisationId: ORG_ID,
    },
  });
  await prisma.service.upsert({
    where: { id: SVC_COM_ID },
    update: {},
    create: {
      id: SVC_COM_ID,
      nom: 'Direction Commerciale',
      description: 'Gestion du portefeuille clients et développement des ventes B2B.',
      parentId: SVC_DG_ID,
      organisationId: ORG_ID,
    },
  });
  await prisma.service.upsert({
    where: { id: SVC_PROD_ID },
    update: {},
    create: {
      id: SVC_PROD_ID,
      nom: 'Direction de la Production',
      description: 'Pilotage des lignes de fabrication et maintenance industrielle.',
      parentId: SVC_DG_ID,
      organisationId: ORG_ID,
    },
  });

  // ── 3. Membres (Users) ──────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin123!', 10);
  const archiHash = await bcrypt.hash('Archi123!', 10);

  await prisma.user.upsert({
    where: { email: 'admin@kiro-industries.fr' },
    update: {},
    create: {
      id: USER_ADMIN_ID,
      email: 'admin@kiro-industries.fr',
      passwordHash: adminHash,
      nom: 'Sophie Marchand',
      role: 'ADMINISTRATEUR',
      organisationId: ORG_ID,
      serviceId: SVC_DSI_ID,
      poste: 'Directrice des Systèmes d\'Information',
      contact: '+33 5 56 00 10 00',
    },
  });
  await prisma.user.upsert({
    where: { email: 'archi1@kiro-industries.fr' },
    update: {},
    create: {
      id: USER_ARCHI1_ID,
      email: 'archi1@kiro-industries.fr',
      passwordHash: archiHash,
      nom: 'Thomas Rivière',
      role: 'ARCHITECTE',
      organisationId: ORG_ID,
      serviceId: SVC_DEV_ID,
      poste: 'Architecte Applicatif Senior',
      contact: '+33 5 56 00 10 01',
    },
  });
  await prisma.user.upsert({
    where: { email: 'archi2@kiro-industries.fr' },
    update: {},
    create: {
      id: USER_ARCHI2_ID,
      email: 'archi2@kiro-industries.fr',
      passwordHash: archiHash,
      nom: 'Léa Fontaine',
      role: 'ARCHITECTE',
      organisationId: ORG_ID,
      serviceId: SVC_INFRA_ID,
      poste: 'Architecte Infrastructure',
      contact: '+33 5 56 00 10 02',
    },
  });
  await prisma.user.upsert({
    where: { email: 'archi3@kiro-industries.fr' },
    update: {},
    create: {
      id: USER_ARCHI3_ID,
      email: 'archi3@kiro-industries.fr',
      passwordHash: archiHash,
      nom: 'Karim Belhadj',
      role: 'ARCHITECTE',
      organisationId: ORG_ID,
      serviceId: SVC_PROD_ID,
      poste: 'Architecte Métier & Processus',
      contact: '+33 5 56 00 10 03',
    },
  });

  // Mise à jour des titulaires des structures
  await prisma.service.update({ where: { id: SVC_DSI_ID }, data: { titulaireId: USER_ADMIN_ID } });
  await prisma.service.update({ where: { id: SVC_DEV_ID }, data: { titulaireId: USER_ARCHI1_ID } });
  await prisma.service.update({ where: { id: SVC_INFRA_ID }, data: { titulaireId: USER_ARCHI2_ID } });

  // ── 4. Parties prenantes ─────────────────────────────────────────────────
  // TOGAF ADM Phase A : identification des parties prenantes
  await prisma.partiePrenante.upsert({
    where: { id: '20000000-0000-4000-8000-000000001001' },
    update: {},
    create: {
      id: '20000000-0000-4000-8000-000000001001',
      nom: 'Groupe Stellantis',
      role: 'Client principal — commandes OEM composants automobiles',
      organisationId: ORG_ID,
    },
  });
  await prisma.partiePrenante.upsert({
    where: { id: '20000000-0000-4000-8000-000000001002' },
    update: {},
    create: {
      id: '20000000-0000-4000-8000-000000001002',
      nom: 'Airbus SE',
      role: 'Client aéronautique — certifications NADCAP exigées',
      organisationId: ORG_ID,
    },
  });
  await prisma.partiePrenante.upsert({
    where: { id: '20000000-0000-4000-8000-000000001003' },
    update: {},
    create: {
      id: '20000000-0000-4000-8000-000000001003',
      nom: 'CNIL',
      role: 'Régulateur — conformité RGPD données RH et traçabilité',
      organisationId: ORG_ID,
    },
  });
  await prisma.partiePrenante.upsert({
    where: { id: '20000000-0000-4000-8000-000000001004' },
    update: {},
    create: {
      id: '20000000-0000-4000-8000-000000001004',
      nom: 'SAP France',
      role: 'Éditeur ERP — partenaire intégration S/4HANA',
      organisationId: ORG_ID,
    },
  });

  // ── 5. Objectifs stratégiques ────────────────────────────────────────────
  // TOGAF ADM Phase A — objectifs AS-IS et TO-BE pour l'analyse des écarts
  await prisma.objectif.upsert({
    where: { id: OBJ_DIG_ID },
    update: {},
    create: {
      id: OBJ_DIG_ID,
      nom: 'Digitaliser la chaîne de production',
      description: 'Numériser les ordres de fabrication, la traçabilité des composants et les rapports de qualité.',
      sousObjectif: 'Intégrer MES et ERP pour une visibilité temps réel sur les lignes de production.',
      statut: 'AS_IS',
      organisationId: ORG_ID,
    },
  });
  await prisma.objectif.upsert({
    where: { id: OBJ_PERF_ID },
    update: {},
    create: {
      id: OBJ_PERF_ID,
      nom: 'Améliorer la performance opérationnelle',
      description: 'Réduire le taux de panne machines de 18% à moins de 5% grâce à la maintenance prédictive.',
      sousObjectif: 'Déployer un système GMAO connecté aux capteurs IoT des équipements industriels.',
      statut: 'AS_IS',
      organisationId: ORG_ID,
    },
  });
  await prisma.objectif.upsert({
    where: { id: OBJ_SEC_ID },
    update: {},
    create: {
      id: OBJ_SEC_ID,
      nom: 'Renforcer la cybersécurité et la conformité RGPD',
      description: 'Mettre en conformité le SI avec les exigences RGPD et les standards ISO 27001.',
      statut: 'AS_IS',
      organisationId: ORG_ID,
    },
  });
  // Objectifs TO-BE (cibles après transformation)
  await prisma.objectif.upsert({
    where: { id: OBJ_DIG_TOBE_ID },
    update: {},
    create: {
      id: OBJ_DIG_TOBE_ID,
      nom: 'Production 100% numérique et traçable',
      description: 'Chaque composant dispose d\'un jumeau numérique et d\'une traçabilité bout-en-bout de la matière première à la livraison.',
      statut: 'TO_BE',
      objectifAsIsId: OBJ_DIG_ID,
      organisationId: ORG_ID,
    },
  });
  await prisma.objectif.upsert({
    where: { id: OBJ_PERF_TOBE_ID },
    update: {},
    create: {
      id: OBJ_PERF_TOBE_ID,
      nom: 'Maintenance prédictive opérationnelle',
      description: 'Taux de disponibilité machines > 95% grâce à l\'IA prédictive et aux capteurs IoT.',
      statut: 'TO_BE',
      objectifAsIsId: OBJ_PERF_ID,
      organisationId: ORG_ID,
    },
  });

  // ── 6. Capacités métier ──────────────────────────────────────────────────
  // TOGAF ADM Phase B — Architecture Métier : cartographie des capacités
  const capProd = await prisma.capaciteMetier.upsert({
    where: { id: CAP_PROD_ID },
    update: {},
    create: {
      id: CAP_PROD_ID,
      nom: 'Gestion de la production',
      description: 'Planification des ordres de fabrication, suivi des lignes et contrôle qualité.',
      organisationId: ORG_ID,
    },
  });
  const capLog = await prisma.capaciteMetier.upsert({
    where: { id: CAP_LOG_ID },
    update: {},
    create: {
      id: CAP_LOG_ID,
      nom: 'Gestion de la logistique',
      description: 'Gestion des stocks, approvisionnements, expéditions et traçabilité des composants.',
      organisationId: ORG_ID,
    },
  });
  const capRH = await prisma.capaciteMetier.upsert({
    where: { id: CAP_RH_ID },
    update: {},
    create: {
      id: CAP_RH_ID,
      nom: 'Gestion des ressources humaines',
      description: 'Recrutement, gestion des compétences, paie et formation continue.',
      organisationId: ORG_ID,
    },
  });
  const capMaint = await prisma.capaciteMetier.upsert({
    where: { id: CAP_MAINT_ID },
    update: {},
    create: {
      id: CAP_MAINT_ID,
      nom: 'Maintenance industrielle',
      description: 'Maintenance préventive et corrective des équipements de production.',
      organisationId: ORG_ID,
    },
  });
  const capVente = await prisma.capaciteMetier.upsert({
    where: { id: CAP_VENTE_ID },
    update: {},
    create: {
      id: CAP_VENTE_ID,
      nom: 'Gestion commerciale et relation client',
      description: 'Gestion des devis, commandes clients, CRM et facturation.',
      organisationId: ORG_ID,
    },
  });
  await prisma.capaciteMetier.upsert({
    where: { id: CAP_FIN_ID },
    update: {},
    create: {
      id: CAP_FIN_ID,
      nom: 'Gestion financière et contrôle de gestion',
      description: 'Budget, comptabilité analytique, reporting financier et trésorerie.',
      organisationId: ORG_ID,
    },
  });

  // ── 7. Éléments ArchiMate ────────────────────────────────────────────────
  // TOGAF ADM Phase A+B — couches Motivation et Métier

  // ── 7a. Couche Motivation
  await prisma.elementArchimate.upsert({
    where: { id: E_VISION_ID },
    update: {},
    create: {
      id: E_VISION_ID,
      nom: 'Vision KIRO 4.0',
      type: 'VISION',
      description: 'Devenir le fabricant industriel 4.0 de référence en Europe d\'ici 2027.',
      statut: 'TO_BE',
      organisationId: ORG_ID,
    },
  });
  await prisma.elementArchimate.upsert({
    where: { id: E_OBJ_ARCH_ID },
    update: {},
    create: {
      id: E_OBJ_ARCH_ID,
      nom: 'Architecture SI unifiée et interopérable',
      type: 'OBJECTIF_ARCHIMATE',
      description: 'Remplacer les systèmes silos par un SI intégré autour d\'un ERP central et d\'une couche API.',
      statut: 'TO_BE',
      organisationId: ORG_ID,
    },
  });
  await prisma.elementArchimate.upsert({
    where: { id: E_PRIN1_ID },
    update: {},
    create: {
      id: E_PRIN1_ID,
      nom: 'Principe API-First',
      type: 'PRINCIPE',
      description: 'Tout échange de données entre systèmes passe par des API REST documentées — aucune intégration point-à-point.',
      statut: 'TO_BE',
      organisationId: ORG_ID,
    },
  });
  await prisma.elementArchimate.upsert({
    where: { id: E_PRIN2_ID },
    update: {},
    create: {
      id: E_PRIN2_ID,
      nom: 'Principe Cloud-First',
      type: 'PRINCIPE',
      description: 'Toute nouvelle application est déployée en cloud avant d\'envisager un hébergement on-premise.',
      statut: 'TO_BE',
      organisationId: ORG_ID,
    },
  });
  await prisma.elementArchimate.upsert({
    where: { id: E_EXI1_ID },
    update: {},
    create: {
      id: E_EXI1_ID,
      nom: 'Traçabilité temps réel des ordres de fabrication',
      type: 'EXIGENCE',
      categorieExigence: 'FONCTIONNELLE',
      description: 'Le SI doit permettre de suivre l\'état de chaque ordre de fabrication en temps réel depuis la saisie jusqu\'à l\'expédition.',
      statut: 'TO_BE',
      organisationId: ORG_ID,
    },
  });
  await prisma.elementArchimate.upsert({
    where: { id: E_EXI2_ID },
    update: {},
    create: {
      id: E_EXI2_ID,
      nom: 'Disponibilité SI > 99,5 %',
      type: 'EXIGENCE',
      categorieExigence: 'NON_FONCTIONNELLE',
      description: 'L\'ensemble des applications critiques (ERP, GMAO, MES) doit garantir une disponibilité de 99,5% minimum (SLA contractuels clients).',
      statut: 'TO_BE',
      organisationId: ORG_ID,
    },
  });
  await prisma.elementArchimate.upsert({
    where: { id: E_OBJ1_ID },
    update: {},
    create: {
      id: E_OBJ1_ID,
      nom: 'Objectif : Réduction coûts maintenance de 30 %',
      type: 'OBJECTIF_ARCHIMATE',
      description: 'Réduire les coûts de maintenance corrective de 30% d\'ici fin 2026 via la maintenance prédictive IoT.',
      statut: 'TO_BE',
      organisationId: ORG_ID,
    },
  });

  // ── 7b. Couche Métier
  const eAct1 = await prisma.elementArchimate.upsert({
    where: { id: E_ACT1_ID },
    update: {},
    create: {
      id: E_ACT1_ID,
      nom: 'Responsable Production',
      type: 'ACTEUR_METIER',
      description: 'Pilote les lignes de fabrication et valide les ordres de production.',
      statut: 'LES_DEUX',
      capaciteMetierId: capProd.id,
      organisationId: ORG_ID,
    },
  });
  const eAct2 = await prisma.elementArchimate.upsert({
    where: { id: E_ACT2_ID },
    update: {},
    create: {
      id: E_ACT2_ID,
      nom: 'Responsable Logistique',
      type: 'ACTEUR_METIER',
      description: 'Gère les flux entrants et sortants, les stocks et les expéditions.',
      statut: 'LES_DEUX',
      capaciteMetierId: capLog.id,
      organisationId: ORG_ID,
    },
  });
  const eAct3 = await prisma.elementArchimate.upsert({
    where: { id: E_ACT3_ID },
    update: {},
    create: {
      id: E_ACT3_ID,
      nom: 'Technicien de Maintenance',
      type: 'ACTEUR_METIER',
      description: 'Réalise les interventions préventives et correctives sur les équipements industriels.',
      statut: 'LES_DEUX',
      capaciteMetierId: capMaint.id,
      organisationId: ORG_ID,
    },
  });
  const eRole1 = await prisma.elementArchimate.upsert({
    where: { id: E_ROLE1_ID },
    update: {},
    create: {
      id: E_ROLE1_ID,
      nom: 'Opérateur de saisie OF',
      type: 'ROLE_METIER',
      description: 'Saisit et met à jour les ordres de fabrication dans l\'ERP.',
      statut: 'LES_DEUX',
      capaciteMetierId: capProd.id,
      organisationId: ORG_ID,
    },
  });
  const eRole2 = await prisma.elementArchimate.upsert({
    where: { id: E_ROLE2_ID },
    update: {},
    create: {
      id: E_ROLE2_ID,
      nom: 'Gestionnaire de stocks',
      type: 'ROLE_METIER',
      description: 'Met à jour les mouvements de stock et déclenche les réapprovisionnements.',
      statut: 'LES_DEUX',
      capaciteMetierId: capLog.id,
      organisationId: ORG_ID,
    },
  });
  const eProc1 = await prisma.elementArchimate.upsert({
    where: { id: E_PROC1_ID },
    update: {},
    create: {
      id: E_PROC1_ID,
      nom: 'Planification et lancement de la production',
      type: 'PROCESSUS_METIER',
      description: 'Création des ordres de fabrication à partir des commandes clients et du stock disponible.',
      statut: 'AS_IS',
      capaciteMetierId: capProd.id,
      organisationId: ORG_ID,
    },
  });
  const eProc2 = await prisma.elementArchimate.upsert({
    where: { id: E_PROC2_ID },
    update: {},
    create: {
      id: E_PROC2_ID,
      nom: 'Gestion des approvisionnements',
      type: 'PROCESSUS_METIER',
      description: 'Déclenchement des commandes fournisseurs selon les besoins en matières premières.',
      statut: 'AS_IS',
      capaciteMetierId: capLog.id,
      organisationId: ORG_ID,
    },
  });
  const eProc3 = await prisma.elementArchimate.upsert({
    where: { id: E_PROC3_ID },
    update: {},
    create: {
      id: E_PROC3_ID,
      nom: 'Intervention de maintenance corrective',
      type: 'PROCESSUS_METIER',
      description: 'Traitement d\'une panne machine : diagnostic, réparation, validation et retour en production.',
      statut: 'AS_IS',
      capaciteMetierId: capMaint.id,
      organisationId: ORG_ID,
    },
  });
  const eSvc1 = await prisma.elementArchimate.upsert({
    where: { id: E_SVC1_ID },
    update: {},
    create: {
      id: E_SVC1_ID,
      nom: 'Service de suivi des ordres de fabrication',
      type: 'SERVICE_METIER',
      description: 'Fournit une vue consolidée et temps réel de l\'avancement de chaque OF sur les lignes.',
      statut: 'TO_BE',
      capaciteMetierId: capProd.id,
      organisationId: ORG_ID,
    },
  });
  await prisma.elementArchimate.upsert({
    where: { id: E_SVC2_ID },
    update: {},
    create: {
      id: E_SVC2_ID,
      nom: 'Service de maintenance prédictive',
      type: 'SERVICE_METIER',
      description: 'Analyse les données capteurs IoT pour anticiper les pannes et planifier les interventions.',
      statut: 'TO_BE',
      capaciteMetierId: capMaint.id,
      organisationId: ORG_ID,
    },
  });

  // ── 8. Relations ArchiMate ───────────────────────────────────────────────
  // NOTE TOGAF/ArchiMate : les relations respectent la sémantique ArchiMate 3.1
  // ASSIGNATION : acteur/rôle ↔ processus/comportement (qui fait quoi)
  // COMPOSITION : élément composé d'autres éléments
  // REALISATION : élément réalise un autre (ex. processus réalise un service)
  // ASSOCIATION : lien sémantique libre entre deux éléments

  const relDefs = [
    // Assignation acteur → processus (qui réalise le processus)
    { id: REL_01_ID, type: 'ASSIGNATION' as const, sourceId: eAct1.id, targetId: eProc1.id },
    { id: REL_02_ID, type: 'ASSIGNATION' as const, sourceId: eAct2.id, targetId: eProc2.id },
    { id: REL_03_ID, type: 'ASSIGNATION' as const, sourceId: eAct3.id, targetId: eProc3.id },
    // Assignation rôle → processus (rôle opérationnel dans le processus)
    { id: REL_04_ID, type: 'ASSIGNATION' as const, sourceId: eRole1.id, targetId: eProc1.id },
    { id: REL_05_ID, type: 'ASSIGNATION' as const, sourceId: eRole2.id, targetId: eProc2.id },
    // Réalisation : processus → service métier (le processus réalise le service)
    { id: REL_06_ID, type: 'REALISATION' as const, sourceId: eProc1.id, targetId: eSvc1.id },
    { id: REL_07_ID, type: 'REALISATION' as const, sourceId: eProc3.id, targetId: E_SVC2_ID },
    // Association : vision ↔ objectif architecture
    { id: REL_08_ID, type: 'ASSOCIATION' as const, sourceId: E_VISION_ID, targetId: E_OBJ_ARCH_ID },
  ];
  for (const rel of relDefs) {
    await prisma.relationArchimate.upsert({
      where: { id: rel.id },
      update: {},
      create: rel,
    });
  }

  // ── 9. Processus BPMN ────────────────────────────────────────────────────
  // TOGAF ADM Phase B — Architecture Métier : modélisation des processus clés

  // ── 9a. Processus : Planification et lancement d'un ordre de fabrication
  const bpmnProd = await prisma.bpmnProcessus.upsert({
    where: { id: BPMN_PROD_ID },
    update: {},
    create: {
      id: BPMN_PROD_ID,
      nom: 'Lancement d\'un ordre de fabrication',
      description: 'Processus de création, validation et lancement d\'un OF depuis la commande client jusqu\'au démarrage ligne.',
      type: 'METIER',
      etapes: 'Réception commande client\nVérification disponibilité matières premières\nDécision : stock suffisant ?\nSi oui : créer l\'ordre de fabrication\nSi non : déclencher approvisionnement\nValider l\'OF par le Responsable Production\nLancer la production sur la ligne\nNotifier le client',
      organisationId: ORG_ID,
    },
  });
  // Lien processus BPMN → objectif stratégique
  await prisma.objectifProcessus.upsert({
    where: { processusId_objectifId: { processusId: BPMN_PROD_ID, objectifId: OBJ_DIG_ID } },
    update: {},
    create: { processusId: BPMN_PROD_ID, objectifId: OBJ_DIG_ID },
  });

  // Éléments BPMN du processus production (flux BPMN 2.0 conforme)
  const bpmnElemsProd = [
    { id: BE_P1_START, nom: 'Commande client reçue',         type: 'EVENEMENT_DEBUT' as const,          declencheur: 'MESSAGE' as const,  statut: 'AS_IS' as const },
    { id: BE_P1_T1,   nom: 'Vérifier disponibilité matières',type: 'TACHE' as const,                    typeTache: 'SERVICE' as const,    statut: 'AS_IS' as const },
    { id: BE_P1_GW1,  nom: 'Stock suffisant ?',              type: 'PASSERELLE_EXCLUSIVE' as const,                                        statut: 'AS_IS' as const },
    { id: BE_P1_T2,   nom: 'Déclencher approvisionnement',   type: 'TACHE' as const,                    typeTache: 'ENVOI' as const,      statut: 'AS_IS' as const },
    { id: BE_P1_T3,   nom: 'Créer l\'ordre de fabrication',  type: 'TACHE' as const,                    typeTache: 'UTILISATEUR' as const,statut: 'AS_IS' as const },
    { id: BE_P1_T4,   nom: 'Valider et lancer la production',type: 'TACHE' as const,                    typeTache: 'UTILISATEUR' as const,statut: 'TO_BE' as const },
    { id: BE_P1_END,  nom: 'Production lancée',              type: 'EVENEMENT_FIN' as const,                                              statut: 'TO_BE' as const },
  ];
  for (const el of bpmnElemsProd) {
    await prisma.bpmnElement.upsert({
      where: { id: el.id },
      update: {},
      create: { ...el, processusId: BPMN_PROD_ID },
    });
  }
  // Flux BPMN production (séquences conformes BPMN 2.0)
  const bpmnFlowsProd = [
    { id: '20000000-0000-4000-8000-000000000F10', sourceId: BE_P1_START, targetId: BE_P1_T1 },
    { id: '20000000-0000-4000-8000-000000000F11', sourceId: BE_P1_T1,    targetId: BE_P1_GW1 },
    { id: '20000000-0000-4000-8000-000000000F12', sourceId: BE_P1_GW1,   targetId: BE_P1_T2, label: 'Non' },
    { id: '20000000-0000-4000-8000-000000000F13', sourceId: BE_P1_GW1,   targetId: BE_P1_T3, label: 'Oui' },
    { id: '20000000-0000-4000-8000-000000000F14', sourceId: BE_P1_T2,    targetId: BE_P1_T3 },
    { id: '20000000-0000-4000-8000-000000000F15', sourceId: BE_P1_T3,    targetId: BE_P1_T4 },
    { id: '20000000-0000-4000-8000-000000000F16', sourceId: BE_P1_T4,    targetId: BE_P1_END },
  ];
  for (const f of bpmnFlowsProd) {
    await prisma.bpmnFlow.upsert({
      where: { id: f.id },
      update: {},
      create: f,
    });
  }

  // ── 9b. Processus : Recrutement RH
  await prisma.bpmnProcessus.upsert({
    where: { id: BPMN_RH_ID },
    update: {},
    create: {
      id: BPMN_RH_ID,
      nom: 'Recrutement d\'un collaborateur',
      description: 'Du besoin identifié par le manager jusqu\'à l\'intégration du nouveau collaborateur.',
      type: 'SUPPORT',
      etapes: 'Identification du besoin par le manager\nRédaction et publication de l\'offre\nSélection des candidatures\nEntretiens\nDécision d\'embauche\nOnboarding',
      organisationId: ORG_ID,
    },
  });
  const bpmnElemsRH = [
    { id: BE_R1_START, nom: 'Besoin de recrutement identifié',  type: 'EVENEMENT_DEBUT' as const,         statut: 'LES_DEUX' as const },
    { id: BE_R1_T1,   nom: 'Rédiger et publier l\'offre',       type: 'TACHE' as const,  typeTache: 'UTILISATEUR' as const, statut: 'LES_DEUX' as const },
    { id: BE_R1_T2,   nom: 'Analyser les candidatures',         type: 'TACHE' as const,  typeTache: 'UTILISATEUR' as const, statut: 'LES_DEUX' as const },
    { id: BE_R1_GW1,  nom: 'Candidat retenu ?',                 type: 'PASSERELLE_EXCLUSIVE' as const,    statut: 'LES_DEUX' as const },
    { id: BE_R1_T3,   nom: 'Réaliser les entretiens',           type: 'TACHE' as const,  typeTache: 'UTILISATEUR' as const, statut: 'LES_DEUX' as const },
    { id: BE_R1_T4,   nom: 'Onboarding et intégration',         type: 'TACHE' as const,  typeTache: 'MANUELLE' as const,    statut: 'TO_BE' as const },
    { id: BE_R1_END,  nom: 'Collaborateur intégré',             type: 'EVENEMENT_FIN' as const,           statut: 'TO_BE' as const },
  ];
  for (const el of bpmnElemsRH) {
    await prisma.bpmnElement.upsert({
      where: { id: el.id },
      update: {},
      create: { ...el, processusId: BPMN_RH_ID },
    });
  }
  const bpmnFlowsRH = [
    { id: '20000000-0000-4000-8000-000000000F20', sourceId: BE_R1_START, targetId: BE_R1_T1 },
    { id: '20000000-0000-4000-8000-000000000F21', sourceId: BE_R1_T1,    targetId: BE_R1_T2 },
    { id: '20000000-0000-4000-8000-000000000F22', sourceId: BE_R1_T2,    targetId: BE_R1_GW1 },
    { id: '20000000-0000-4000-8000-000000000F23', sourceId: BE_R1_GW1,   targetId: BE_R1_T3, label: 'Oui' },
    { id: '20000000-0000-4000-8000-000000000F24', sourceId: BE_R1_GW1,   targetId: BE_R1_END, label: 'Non' },
    { id: '20000000-0000-4000-8000-000000000F25', sourceId: BE_R1_T3,    targetId: BE_R1_T4 },
    { id: '20000000-0000-4000-8000-000000000F26', sourceId: BE_R1_T4,    targetId: BE_R1_END },
  ];
  for (const f of bpmnFlowsRH) {
    await prisma.bpmnFlow.upsert({
      where: { id: f.id },
      update: {},
      create: f,
    });
  }

  // ── 9c. Processus : Maintenance corrective
  await prisma.bpmnProcessus.upsert({
    where: { id: BPMN_MAINT_ID },
    update: {},
    create: {
      id: BPMN_MAINT_ID,
      nom: 'Traitement d\'une panne machine',
      description: 'Processus de maintenance corrective depuis la détection de la panne jusqu\'au retour en production.',
      type: 'SUPPORT',
      etapes: 'Détection de la panne\nDiagnostic de la panne\nRéparation ou remplacement\nTest de remise en service\nRetour en production',
      organisationId: ORG_ID,
    },
  });
  await prisma.objectifProcessus.upsert({
    where: { processusId_objectifId: { processusId: BPMN_MAINT_ID, objectifId: OBJ_PERF_ID } },
    update: {},
    create: { processusId: BPMN_MAINT_ID, objectifId: OBJ_PERF_ID },
  });
  const bpmnElemsMaint = [
    { id: BE_M1_START, nom: 'Panne détectée',             type: 'EVENEMENT_DEBUT' as const,  declencheur: 'SIGNAL' as const,   statut: 'AS_IS' as const },
    { id: BE_M1_T1,   nom: 'Diagnostiquer la panne',      type: 'TACHE' as const, typeTache: 'UTILISATEUR' as const, statut: 'AS_IS' as const },
    { id: BE_M1_GW1,  nom: 'Pièce disponible en stock ?', type: 'PASSERELLE_EXCLUSIVE' as const,                     statut: 'AS_IS' as const },
    { id: BE_M1_T2,   nom: 'Commander la pièce',          type: 'TACHE' as const, typeTache: 'ENVOI' as const,       statut: 'AS_IS' as const },
    { id: BE_M1_T3,   nom: 'Réparer et tester',           type: 'TACHE' as const, typeTache: 'MANUELLE' as const,    statut: 'AS_IS' as const },
    { id: BE_M1_END,  nom: 'Machine opérationnelle',      type: 'EVENEMENT_FIN' as const,                            statut: 'AS_IS' as const },
  ];
  for (const el of bpmnElemsMaint) {
    await prisma.bpmnElement.upsert({
      where: { id: el.id },
      update: {},
      create: { ...el, processusId: BPMN_MAINT_ID },
    });
  }
  const bpmnFlowsMaint = [
    { id: '20000000-0000-4000-8000-000000000F30', sourceId: BE_M1_START, targetId: BE_M1_T1 },
    { id: '20000000-0000-4000-8000-000000000F31', sourceId: BE_M1_T1,    targetId: BE_M1_GW1 },
    { id: '20000000-0000-4000-8000-000000000F32', sourceId: BE_M1_GW1,   targetId: BE_M1_T2, label: 'Non' },
    { id: '20000000-0000-4000-8000-000000000F33', sourceId: BE_M1_GW1,   targetId: BE_M1_T3, label: 'Oui' },
    { id: '20000000-0000-4000-8000-000000000F34', sourceId: BE_M1_T2,    targetId: BE_M1_T3 },
    { id: '20000000-0000-4000-8000-000000000F35', sourceId: BE_M1_T3,    targetId: BE_M1_END },
  ];
  for (const f of bpmnFlowsMaint) {
    await prisma.bpmnFlow.upsert({
      where: { id: f.id },
      update: {},
      create: f,
    });
  }

  // ── 10. Applications (portefeuille applicatif) ───────────────────────────
  // TOGAF ADM Phase C — Architecture des systèmes d'information
  const appERP = await prisma.application.upsert({
    where: { id: APP_ERP_ID },
    update: {},
    create: {
      id: APP_ERP_ID,
      nom: 'SAP S/4HANA',
      description: 'ERP central couvrant la production, la logistique, la finance et les ventes.',
      statut: 'TO_BE',
      organisationId: ORG_ID,
    },
  });
  const appSIRH = await prisma.application.upsert({
    where: { id: APP_SIRH_ID },
    update: {},
    create: {
      id: APP_SIRH_ID,
      nom: 'Système d\'Information RH (SIRH)',
      description: 'Gestion de la paie, des congés, des formations et des compétences.',
      statut: 'LES_DEUX',
      organisationId: ORG_ID,
    },
  });
  const appGMAO = await prisma.application.upsert({
    where: { id: APP_GMAO_ID },
    update: {},
    create: {
      id: APP_GMAO_ID,
      nom: 'GMAO (Gestion Maintenance Assistée par Ordinateur)',
      description: 'Planification des interventions, gestion des pièces détachées et historique des pannes.',
      statut: 'LES_DEUX',
      organisationId: ORG_ID,
    },
  });
  const appCRM = await prisma.application.upsert({
    where: { id: APP_CRM_ID },
    update: {},
    create: {
      id: APP_CRM_ID,
      nom: 'CRM Salesforce',
      description: 'Gestion des opportunités commerciales, devis et suivi client.',
      statut: 'LES_DEUX',
      organisationId: ORG_ID,
    },
  });
  const appGED = await prisma.application.upsert({
    where: { id: APP_GED_ID },
    update: {},
    create: {
      id: APP_GED_ID,
      nom: 'GED (Gestion Électronique Documents)',
      description: 'Archivage et gestion des documents techniques, qualité et réglementaires.',
      statut: 'LES_DEUX',
      organisationId: ORG_ID,
    },
  });

  // Services applicatifs (capacités exposées par chaque application)
  const appServices = [
    { nom: 'Gestion des ordres de fabrication', applicationId: appERP.id },
    { nom: 'Contrôle de gestion analytique',    applicationId: appERP.id },
    { nom: 'Gestion des achats et stocks',      applicationId: appERP.id },
    { nom: 'Gestion de la paie',                applicationId: appSIRH.id },
    { nom: 'Suivi des formations',              applicationId: appSIRH.id },
    { nom: 'Planification des interventions',   applicationId: appGMAO.id },
    { nom: 'Historique des équipements',        applicationId: appGMAO.id },
    { nom: 'Gestion des opportunités client',   applicationId: appCRM.id },
    { nom: 'Archivage documentaire',            applicationId: appGED.id },
  ];
  for (const svc of appServices) {
    const existing = await prisma.applicationService.findFirst({ where: { nom: svc.nom, applicationId: svc.applicationId } });
    if (!existing) {
      await prisma.applicationService.create({ data: svc });
    }
  }

  // Échanges inter-applicatifs (flux de données entre systèmes)
  // NOTE : conformes au diagramme de composants UML — les échanges reflètent
  // des intégrations réelles (ERP ↔ SIRH pour la paie, ERP ↔ CRM pour les commandes)
  const echanges = [
    { sourceId: appCRM.id, targetId: appERP.id, description: 'Transmission des commandes clients confirmées', protocole: 'REST API' },
    { sourceId: appERP.id, targetId: appSIRH.id, description: 'Données RH pour le contrôle de gestion des heures', protocole: 'REST API' },
    { sourceId: appERP.id, targetId: appGMAO.id, description: 'Données équipements et stock pièces détachées', protocole: 'REST API' },
    { sourceId: appGMAO.id, targetId: appGED.id, description: 'Archivage des rapports d\'intervention', protocole: 'SFTP' },
    { sourceId: appSIRH.id, targetId: appGED.id, description: 'Archivage des documents contractuels RH', protocole: 'SFTP' },
  ];
  for (const e of echanges) {
    const existing = await prisma.applicationEchange.findFirst({
      where: { sourceId: e.sourceId, targetId: e.targetId },
    });
    if (!existing) {
      await prisma.applicationEchange.create({ data: e });
    }
  }

  // ── 11. Zones d'urbanisation (Plan d'Occupation des Sols) ───────────────
  // TOGAF ADM Phase C — Cartographie applicative par domaine fonctionnel
  await prisma.zoneUrbanisation.upsert({
    where: { id: ZONE_METIER_ID },
    update: {},
    create: {
      id: ZONE_METIER_ID, nom: 'Zone Métier', type: 'ZONE', organisationId: ORG_ID,
    },
  });
  await prisma.zoneUrbanisation.upsert({
    where: { id: ZONE_TECH_ID },
    update: {},
    create: {
      id: ZONE_TECH_ID, nom: 'Zone Technique & Transverse', type: 'ZONE', organisationId: ORG_ID,
    },
  });
  await prisma.zoneUrbanisation.upsert({
    where: { id: QRT_RH_ID },
    update: {},
    create: {
      id: QRT_RH_ID, nom: 'Quartier RH & Pilotage', type: 'QUARTIER', parentId: ZONE_METIER_ID, organisationId: ORG_ID,
    },
  });
  await prisma.zoneUrbanisation.upsert({
    where: { id: QRT_PROD_ID },
    update: {},
    create: {
      id: QRT_PROD_ID, nom: 'Quartier Production & Maintenance', type: 'QUARTIER', parentId: ZONE_METIER_ID, organisationId: ORG_ID,
    },
  });
  await prisma.zoneUrbanisation.upsert({
    where: { id: QRT_COM_ID },
    update: {},
    create: {
      id: QRT_COM_ID, nom: 'Quartier Commercial & Finance', type: 'QUARTIER', parentId: ZONE_METIER_ID, organisationId: ORG_ID,
    },
  });
  const ilotSIRH = await prisma.zoneUrbanisation.upsert({
    where: { id: ILOT_SIRH_ID },
    update: {},
    create: {
      id: ILOT_SIRH_ID, nom: 'Îlot SIRH', type: 'ILOT', parentId: QRT_RH_ID, organisationId: ORG_ID,
    },
  });
  const ilotRec = await prisma.zoneUrbanisation.upsert({
    where: { id: ILOT_REC_ID },
    update: {},
    create: {
      id: ILOT_REC_ID, nom: 'Îlot GED', type: 'ILOT', parentId: QRT_RH_ID, organisationId: ORG_ID,
    },
  });
  const ilotERP = await prisma.zoneUrbanisation.upsert({
    where: { id: ILOT_ERP_ID },
    update: {},
    create: {
      id: ILOT_ERP_ID, nom: 'Îlot ERP Production', type: 'ILOT', parentId: QRT_PROD_ID, organisationId: ORG_ID,
    },
  });
  const ilotGMAO = await prisma.zoneUrbanisation.upsert({
    where: { id: ILOT_GMAO_ID },
    update: {},
    create: {
      id: ILOT_GMAO_ID, nom: 'Îlot GMAO', type: 'ILOT', parentId: QRT_PROD_ID, organisationId: ORG_ID,
    },
  });
  const ilotCRM = await prisma.zoneUrbanisation.upsert({
    where: { id: ILOT_CRM_ID },
    update: {},
    create: {
      id: ILOT_CRM_ID, nom: 'Îlot CRM', type: 'ILOT', parentId: QRT_COM_ID, organisationId: ORG_ID,
    },
  });

  // Affectation des applications aux îlots
  const affectations = [
    { applicationId: appSIRH.id, zoneId: ilotSIRH.id },
    { applicationId: appGED.id,  zoneId: ilotRec.id  },
    { applicationId: appERP.id,  zoneId: ilotERP.id  },
    { applicationId: appGMAO.id, zoneId: ilotGMAO.id },
    { applicationId: appCRM.id,  zoneId: ilotCRM.id  },
  ];
  for (const aff of affectations) {
    await prisma.applicationZone.upsert({
      where: { applicationId_zoneId: aff },
      update: {},
      create: aff,
    });
  }

  // ── 12. Entités de données ───────────────────────────────────────────────
  // TOGAF ADM Phase C — Architecture des données
  const deEmploye = await prisma.dataEntity.upsert({
    where: { id: DE_EMPLOYE_ID },
    update: {},
    create: {
      id: DE_EMPLOYE_ID, nom: 'Employé', description: 'Collaborateur de KIRO Industries.',
      proprietaire: 'Direction RH', statut: 'LES_DEUX', organisationId: ORG_ID,
    },
  });
  const deOrdre = await prisma.dataEntity.upsert({
    where: { id: DE_ORDRE_ID },
    update: {},
    create: {
      id: DE_ORDRE_ID, nom: 'Ordre de Fabrication', description: 'OF déclenché par une commande client.',
      proprietaire: 'Direction Production', statut: 'AS_IS', organisationId: ORG_ID,
    },
  });
  const deProduit = await prisma.dataEntity.upsert({
    where: { id: DE_PRODUIT_ID },
    update: {},
    create: {
      id: DE_PRODUIT_ID, nom: 'Produit Fini', description: 'Composant électronique fabriqué et livrable.',
      proprietaire: 'Direction Production', statut: 'LES_DEUX', organisationId: ORG_ID,
    },
  });
  const deClient = await prisma.dataEntity.upsert({
    where: { id: DE_CLIENT_ID },
    update: {},
    create: {
      id: DE_CLIENT_ID, nom: 'Client', description: 'Entreprise acheteuse (OEM automobile ou aéronautique).',
      proprietaire: 'Direction Commerciale', statut: 'LES_DEUX', organisationId: ORG_ID,
    },
  });
  const deMachine = await prisma.dataEntity.upsert({
    where: { id: DE_MACHINE_ID },
    update: {},
    create: {
      id: DE_MACHINE_ID, nom: 'Équipement Industriel', description: 'Machine de production avec capteurs IoT.',
      proprietaire: 'Direction Production', statut: 'LES_DEUX', organisationId: ORG_ID,
    },
  });

  // Attributs des entités
  const attrs = [
    { nom: 'matricule',       type: 'string',   entityId: deEmploye.id },
    { nom: 'nomComplet',      type: 'string',   entityId: deEmploye.id },
    { nom: 'dateEmbauche',    type: 'date',     entityId: deEmploye.id },
    { nom: 'service',         type: 'string',   entityId: deEmploye.id },
    { nom: 'numeroOF',        type: 'string',   entityId: deOrdre.id },
    { nom: 'dateCreation',    type: 'datetime', entityId: deOrdre.id },
    { nom: 'statut',          type: 'enum',     entityId: deOrdre.id },
    { nom: 'quantite',        type: 'integer',  entityId: deOrdre.id },
    { nom: 'reference',       type: 'string',   entityId: deProduit.id },
    { nom: 'designation',     type: 'string',   entityId: deProduit.id },
    { nom: 'poids',           type: 'float',    entityId: deProduit.id },
    { nom: 'codeClient',      type: 'string',   entityId: deClient.id },
    { nom: 'raisonSociale',   type: 'string',   entityId: deClient.id },
    { nom: 'secteur',         type: 'enum',     entityId: deClient.id },
    { nom: 'tagEquipement',   type: 'string',   entityId: deMachine.id },
    { nom: 'modele',          type: 'string',   entityId: deMachine.id },
    { nom: 'dateMiseEnService',type: 'date',    entityId: deMachine.id },
  ];
  for (const attr of attrs) {
    const existing = await prisma.dataAttribute.findFirst({ where: { nom: attr.nom, entityId: attr.entityId } });
    if (!existing) await prisma.dataAttribute.create({ data: attr });
  }

  // Relations entre entités de données (diagramme ER)
  const dataRels = [
    { sourceId: deOrdre.id,    targetId: deProduit.id,  cardinalite: 'UN_A_PLUSIEURS' as const, label: 'produit' },
    { sourceId: deOrdre.id,    targetId: deEmploye.id,  cardinalite: 'PLUSIEURS_A_PLUSIEURS' as const, label: 'exécuté par' },
    { sourceId: deClient.id,   targetId: deOrdre.id,    cardinalite: 'UN_A_PLUSIEURS' as const, label: 'passe' },
    { sourceId: deEmploye.id,  targetId: deMachine.id,  cardinalite: 'PLUSIEURS_A_PLUSIEURS' as const, label: 'opère' },
  ];
  for (const r of dataRels) {
    const existing = await prisma.dataRelation.findFirst({ where: { sourceId: r.sourceId, targetId: r.targetId } });
    if (!existing) await prisma.dataRelation.create({ data: r });
  }

  // ── 13. Composants technologiques ────────────────────────────────────────
  // TOGAF ADM Phase D — Architecture Technologique
  const tcSrv1 = await prisma.techComponent.upsert({
    where: { id: TC_SRV1_ID },
    update: {},
    create: {
      id: TC_SRV1_ID, nom: 'Serveur Applicatif Principal', type: 'SERVEUR_APPLICATIONS',
      description: 'Serveur hébergeant les applications SAP S/4HANA et GMAO (on-premise).',
      statut: 'AS_IS', organisationId: ORG_ID,
    },
  });
  const tcSrv2 = await prisma.techComponent.upsert({
    where: { id: TC_SRV2_ID },
    update: {},
    create: {
      id: TC_SRV2_ID, nom: 'Serveur de Bases de Données', type: 'BASE_DE_DONNEES_POSTGRESQL',
      description: 'Serveur PostgreSQL hébergeant les bases de données ERP et SIRH.',
      statut: 'LES_DEUX', organisationId: ORG_ID,
    },
  });
  const tcCloud = await prisma.techComponent.upsert({
    where: { id: TC_CLOUD_ID },
    update: {},
    create: {
      id: TC_CLOUD_ID, nom: 'Microsoft Azure (Cloud)', type: 'PLATEFORME_CLOUD',
      description: 'Plateforme cloud cible pour la migration des applications à faible criticité et le DR.',
      statut: 'TO_BE', organisationId: ORG_ID,
    },
  });
  await prisma.techComponent.upsert({
    where: { id: TC_PF_ID },
    update: {},
    create: {
      id: TC_PF_ID, nom: 'Pare-feu Palo Alto', type: 'PARE_FEU',
      description: 'Protection périmétrique du réseau industriel et du SI d\'entreprise.',
      statut: 'LES_DEUX', organisationId: ORG_ID,
    },
  });
  await prisma.techComponent.upsert({
    where: { id: TC_SWITCH_ID },
    update: {},
    create: {
      id: TC_SWITCH_ID, nom: 'Switch réseau industriel', type: 'SWITCH',
      description: 'Infrastructure réseau des ateliers de production (VLAN séparé OT/IT).',
      statut: 'LES_DEUX', organisationId: ORG_ID,
    },
  });
  await prisma.techComponent.upsert({
    where: { id: TC_VPN_ID },
    update: {},
    create: {
      id: TC_VPN_ID, nom: 'VPN Site-à-Site', type: 'VPN',
      description: 'Tunnel VPN entre le siège de Bordeaux et le site de production de Toulouse.',
      statut: 'LES_DEUX', organisationId: ORG_ID,
    },
  });
  const tcAPI = await prisma.techComponent.upsert({
    where: { id: TC_API_ID },
    update: {},
    create: {
      id: TC_API_ID, nom: 'API Gateway (Kong)', type: 'API_REST',
      description: 'Passerelle API centralisée pour toutes les intégrations applicatives.',
      statut: 'TO_BE', organisationId: ORG_ID,
    },
  });
  await prisma.techComponent.upsert({
    where: { id: TC_DB1_ID },
    update: {},
    create: {
      id: TC_DB1_ID, nom: 'NAS stockage documentaire', type: 'STOCKAGE_NAS',
      description: 'Stockage NAS pour la GED et les archives des rapports techniques.',
      statut: 'LES_DEUX', organisationId: ORG_ID,
    },
  });

  // Déploiements d'applications sur les composants
  const deploiements = [
    { applicationId: appERP.id,  techComponentId: tcSrv1.id  },
    { applicationId: appGMAO.id, techComponentId: tcSrv1.id  },
    { applicationId: appERP.id,  techComponentId: tcSrv2.id  },
    { applicationId: appSIRH.id, techComponentId: tcSrv2.id  },
    { applicationId: appCRM.id,  techComponentId: tcCloud.id },
    { applicationId: appGED.id,  techComponentId: TC_DB1_ID  },
  ];
  for (const d of deploiements) {
    await prisma.techDeploiement.upsert({
      where: { applicationId_techComponentId: d },
      update: {},
      create: d,
    });
  }

  // ── 14. Architecture applicative (diagramme composants) ─────────────────
  const aaElems = [
    { id: AA_USER_ID,  nom: 'Utilisateur Interne',         type: 'UTILISATEUR_INTERNE' as const, description: 'Opérateur, technicien ou cadre de KIRO.' },
    { id: AA_ERP_ID,   nom: 'SAP S/4HANA',                 type: 'APPLICATION' as const,          description: 'ERP central.' },
    { id: AA_SIRH_ID,  nom: 'SIRH',                         type: 'APPLICATION' as const,          description: 'Gestion RH et paie.' },
    { id: AA_GMAO_ID,  nom: 'GMAO',                         type: 'APPLICATION' as const,          description: 'Maintenance assistée par ordinateur.' },
    { id: AA_DB_ID,    nom: 'PostgreSQL',                   type: 'BASE_DE_DONNEES' as const,      description: 'Base de données relationnelle centralisée.' },
    { id: AA_SEC_ID,   nom: 'Système SSO / IAM',            type: 'SECURITE' as const,             description: 'Authentification centralisée et gestion des droits.' },
    { id: AA_EXT_ID,   nom: 'Portail Fournisseur (EDI)',    type: 'SYSTEME_EXTERNE' as const,       description: 'Échange de données avec les fournisseurs via EDI.' },
  ];
  for (const el of aaElems) {
    await prisma.archiApplicativeElement.upsert({
      where: { id: el.id },
      update: {},
      create: { ...el, organisationId: ORG_ID },
    });
  }
  const aaFlux = [
    { sourceId: AA_USER_ID,  targetId: AA_SEC_ID,  type: 'AUTHENTIFICATION' as const, label: 'SSO' },
    { sourceId: AA_USER_ID,  targetId: AA_ERP_ID,  type: 'DONNEES' as const,          label: 'Saisie OF' },
    { sourceId: AA_USER_ID,  targetId: AA_GMAO_ID, type: 'DONNEES' as const,          label: 'Déclaration panne' },
    { sourceId: AA_ERP_ID,   targetId: AA_DB_ID,   type: 'DONNEES' as const,          label: 'Lecture/écriture' },
    { sourceId: AA_SIRH_ID,  targetId: AA_DB_ID,   type: 'DONNEES' as const,          label: 'Données RH' },
    { sourceId: AA_GMAO_ID,  targetId: AA_DB_ID,   type: 'DONNEES' as const,          label: 'Historique pannes' },
    { sourceId: AA_ERP_ID,   targetId: AA_SIRH_ID, type: 'API' as const,              label: 'REST API' },
    { sourceId: AA_EXT_ID,   targetId: AA_ERP_ID,  type: 'DONNEES' as const,          label: 'Commandes EDI' },
  ];
  for (const f of aaFlux) {
    const existing = await prisma.archiApplicativeFlux.findFirst({ where: { sourceId: f.sourceId, targetId: f.targetId } });
    if (!existing) await prisma.archiApplicativeFlux.create({ data: f });
  }

  // ── 15. Critères d'évaluation (phase E ADM) ──────────────────────────────
  await prisma.critereEvaluation.upsert({
    where: { id: CRIT_COUT_ID },
    update: {},
    create: { id: CRIT_COUT_ID, nom: 'Coût d\'implémentation', description: 'Coût total d\'acquisition, d\'intégration et de migration (TCO 5 ans).', organisationId: ORG_ID },
  });
  await prisma.critereEvaluation.upsert({
    where: { id: CRIT_RISK_ID },
    update: {},
    create: { id: CRIT_RISK_ID, nom: 'Niveau de risque', description: 'Risque opérationnel et technique lié à la mise en œuvre de la solution.', organisationId: ORG_ID },
  });
  await prisma.critereEvaluation.upsert({
    where: { id: CRIT_VAL_ID },
    update: {},
    create: { id: CRIT_VAL_ID, nom: 'Valeur métier', description: 'Bénéfices directs attendus pour la production et la compétitivité de KIRO.', organisationId: ORG_ID },
  });
  await prisma.critereEvaluation.upsert({
    where: { id: CRIT_MATUR_ID },
    update: {},
    create: { id: CRIT_MATUR_ID, nom: 'Maturité technologique', description: 'Niveau de maturité de la solution et de l\'écosystème fournisseur.', organisationId: ORG_ID },
  });

  // ── 16. Solutions ────────────────────────────────────────────────────────
  // TOGAF ADM Phase E — Opportunités & Solutions
  const solERP = await prisma.solution.upsert({
    where: { id: SOL_ERP_ID },
    update: {},
    create: {
      id: SOL_ERP_ID,
      nom: 'Migration vers SAP S/4HANA',
      description: 'Remplacement du système de gestion de production legacy par SAP S/4HANA pour unifier ERP, production et logistique.',
      statut: 'RETENUE',
      planMiseOeuvre: 'Phase 1 (S1 2025) : Audit et mapping des données. Phase 2 (S2 2025) : Paramétrage et tests. Phase 3 (S1 2026) : Migration et formation. Phase 4 (S2 2026) : Stabilisation.',
      avancement: 'EN_COURS',
      commentaireSuivi: 'Mapping des données de production terminé. Paramétrage module PP en cours.',
      organisationId: ORG_ID,
    },
  });
  const solCloud = await prisma.solution.upsert({
    where: { id: SOL_CLOUD_ID },
    update: {},
    create: {
      id: SOL_CLOUD_ID,
      nom: 'Migration Cloud Microsoft Azure',
      description: 'Migration des applications non critiques vers Azure et mise en place d\'un plan de reprise d\'activité (PRA) cloud.',
      statut: 'PROPOSEE',
      planMiseOeuvre: 'Phase 1 : Audit du parc applicatif et classification. Phase 2 : Migration CRM et GED. Phase 3 : Mise en place PRA.',
      avancement: 'NON_DEMARRE',
      organisationId: ORG_ID,
    },
  });
  const solSec = await prisma.solution.upsert({
    where: { id: SOL_SEC_ID },
    update: {},
    create: {
      id: SOL_SEC_ID,
      nom: 'Déploiement SSO et IAM',
      description: 'Centralisation de l\'authentification via un système SSO/IAM pour renforcer la sécurité et simplifier la gestion des accès.',
      statut: 'RETENUE',
      planMiseOeuvre: 'Phase 1 : Choix de la solution (Keycloak ou Azure AD). Phase 2 : Intégration ERP et SIRH. Phase 3 : Extension à toutes les applications.',
      avancement: 'NON_DEMARRE',
      organisationId: ORG_ID,
    },
  });

  // Scores d'évaluation des solutions
  const scores = [
    // SAP S/4HANA : coût élevé (2/5), risque moyen (3/5), valeur forte (5/5), mature (5/5)
    { solutionId: solERP.id,   critereId: CRIT_COUT_ID,  score: 2, commentaire: 'Investissement significatif — 1,2 M€ sur 3 ans' },
    { solutionId: solERP.id,   critereId: CRIT_RISK_ID,  score: 3, commentaire: 'Migration complexe mais maîtrisée avec SAP France' },
    { solutionId: solERP.id,   critereId: CRIT_VAL_ID,   score: 5, commentaire: 'Traçabilité et intégration complètes de la chaîne' },
    { solutionId: solERP.id,   critereId: CRIT_MATUR_ID, score: 5, commentaire: 'Solution leader du marché industriel' },
    // Migration Cloud : coût modéré (3/5), risque faible (4/5), valeur métier (4/5), maturité (4/5)
    { solutionId: solCloud.id, critereId: CRIT_COUT_ID,  score: 3, commentaire: 'Coût de migration amorti sur 2 ans par réduction infra' },
    { solutionId: solCloud.id, critereId: CRIT_RISK_ID,  score: 4, commentaire: 'Migration progressive limitant les risques de rupture' },
    { solutionId: solCloud.id, critereId: CRIT_VAL_ID,   score: 4, commentaire: 'Flexibilité et disponibilité améliorées' },
    { solutionId: solCloud.id, critereId: CRIT_MATUR_ID, score: 4, commentaire: 'Azure bien implanté dans l\'industrie' },
    // SSO/IAM : coût faible (5/5), risque faible (5/5), valeur (4/5), maturité (5/5)
    { solutionId: solSec.id,   critereId: CRIT_COUT_ID,  score: 5, commentaire: 'Solution open source (Keycloak) — coût réduit' },
    { solutionId: solSec.id,   critereId: CRIT_RISK_ID,  score: 5, commentaire: 'Risque faible — déploiement incrémental' },
    { solutionId: solSec.id,   critereId: CRIT_VAL_ID,   score: 4, commentaire: 'Réduction des incidents de sécurité liés aux accès' },
    { solutionId: solSec.id,   critereId: CRIT_MATUR_ID, score: 5, commentaire: 'Standard de l\'industrie bien documenté' },
  ];
  for (const s of scores) {
    await prisma.evaluationScore.upsert({
      where: { solutionId_critereId: { solutionId: s.solutionId, critereId: s.critereId } },
      update: {},
      create: s,
    });
  }

  // ── 17. Politiques de gouvernance ────────────────────────────────────────
  // TOGAF ADM Phase G — Gouvernance de l'architecture
  const polSec = await prisma.politiqueGouvernance.upsert({
    where: { id: POL_SEC_ID },
    update: {},
    create: {
      id: POL_SEC_ID,
      nom: 'Politique de Sécurité SI (ISO 27001)',
      description: 'Toute application traitant des données sensibles doit respecter les contrôles ISO 27001 : chiffrement des données au repos et en transit, journalisation des accès, gestion des vulnérabilités.',
      organisationId: ORG_ID,
    },
  });
  const polRGPD = await prisma.politiqueGouvernance.upsert({
    where: { id: POL_RGPD_ID },
    update: {},
    create: {
      id: POL_RGPD_ID,
      nom: 'Conformité RGPD',
      description: 'Les données personnelles des employés et clients doivent être traitées conformément au RGPD : minimisation, droit à l\'oubli, registre des traitements, consentement explicite.',
      organisationId: ORG_ID,
    },
  });
  const polInterop = await prisma.politiqueGouvernance.upsert({
    where: { id: POL_INTEROP_ID },
    update: {},
    create: {
      id: POL_INTEROP_ID,
      nom: 'Standard d\'Interopérabilité API-First',
      description: 'Toute nouvelle intégration entre applications doit passer par l\'API Gateway centralisée (Kong). Les intégrations point-à-point sont proscrites.',
      organisationId: ORG_ID,
    },
  });

  // Conformités des solutions aux politiques
  const conformites = [
    { solutionId: solERP.id,   politiqueId: polSec.id,     statut: 'CONFORME' as const,     commentaire: 'SAP S/4HANA inclut le chiffrement AES-256 et la journalisation native.' },
    { solutionId: solERP.id,   politiqueId: polRGPD.id,    statut: 'A_EVALUER' as const,    commentaire: 'Cartographie des données personnelles en cours avec le DPO.' },
    { solutionId: solERP.id,   politiqueId: polInterop.id, statut: 'CONFORME' as const,     commentaire: 'Toutes les intégrations SAP passent par Kong API Gateway.' },
    { solutionId: solCloud.id, politiqueId: polSec.id,     statut: 'CONFORME' as const,     commentaire: 'Azure native avec chiffrement et RBAC.' },
    { solutionId: solCloud.id, politiqueId: polRGPD.id,    statut: 'CONFORME' as const,     commentaire: 'Hébergement Azure France Center — données en UE.' },
    { solutionId: solCloud.id, politiqueId: polInterop.id, statut: 'A_EVALUER' as const,    commentaire: 'Vérification du routage via Kong pour les APIs cloud.' },
    { solutionId: solSec.id,   politiqueId: polSec.id,     statut: 'CONFORME' as const,     commentaire: 'SSO/IAM est lui-même une mesure de sécurité ISO 27001.' },
    { solutionId: solSec.id,   politiqueId: polRGPD.id,    statut: 'CONFORME' as const,     commentaire: 'Gestion centralisée des consentements et des droits d\'accès.' },
    { solutionId: solSec.id,   politiqueId: polInterop.id, statut: 'NON_CONFORME' as const, commentaire: 'L\'IAM communique directement avec les annuaires LDAP — exception documentée.' },
  ];
  for (const c of conformites) {
    await prisma.conformiteSolution.upsert({
      where: { solutionId_politiqueId: { solutionId: c.solutionId, politiqueId: c.politiqueId } },
      update: {},
      create: c,
    });
  }

  // Demandes de changement architectural
  const changements = [
    { titre: 'Migration ERP : arrêt du module legacy Production', description: 'Désactiver le module de gestion de production de l\'ERP legacy après migration SAP.', statut: 'APPROUVE' as const },
    { titre: 'Création de l\'API Gateway Kong', description: 'Déploiement et configuration de Kong API Gateway comme point d\'entrée unique.', statut: 'IMPLEMENTE' as const },
    { titre: 'Mise en place du PRA Cloud Azure', description: 'Configuration du plan de reprise d\'activité sur Azure pour les applications critiques.', statut: 'PROPOSE' as const },
  ];
  for (const c of changements) {
    const existing = await prisma.demandeChangement.findFirst({ where: { titre: c.titre, organisationId: ORG_ID } });
    if (!existing) await prisma.demandeChangement.create({ data: { ...c, organisationId: ORG_ID } });
  }

  // ── 18. Roadmap de transformation ───────────────────────────────────────
  // TOGAF ADM Phase F — Planification de la migration
  const projets = [
    {
      id: PROJ_ERP_ID,
      nom: 'Migration SAP S/4HANA',
      description: 'Remplacement de l\'ERP legacy et des systèmes de gestion de production. Périmètre : modules PP (Production Planning), MM (Materials Management), CO (Controlling).',
      priorite: 'HAUTE' as const,
      coutEstime: '1 200 000 €',
      dateDebut: new Date('2025-01-06'),
      dateFin:   new Date('2026-12-31'),
      statut: 'EN_COURS' as const,
    },
    {
      id: PROJ_CLOUD_ID,
      nom: 'Migration Cloud Azure',
      description: 'Migration des applications non critiques (CRM, GED) vers Azure. Mise en place du PRA cloud.',
      priorite: 'MOYENNE' as const,
      coutEstime: '280 000 €',
      dateDebut: new Date('2025-07-01'),
      dateFin:   new Date('2026-06-30'),
      statut: 'PLANIFIE' as const,
    },
    {
      id: PROJ_SEC_ID,
      nom: 'Déploiement SSO / IAM',
      description: 'Centralisation de l\'authentification et des autorisations sur l\'ensemble du SI.',
      priorite: 'HAUTE' as const,
      coutEstime: '95 000 €',
      dateDebut: new Date('2025-03-01'),
      dateFin:   new Date('2025-09-30'),
      statut: 'PLANIFIE' as const,
    },
    {
      id: PROJ_MOB_ID,
      nom: 'Application mobile GMAO techniciens',
      description: 'Développement d\'une application mobile pour les techniciens de maintenance (déclaration pannes, consultation historique, scan QR code machines).',
      priorite: 'MOYENNE' as const,
      coutEstime: '65 000 €',
      dateDebut: new Date('2026-01-05'),
      dateFin:   new Date('2026-06-30'),
      statut: 'PLANIFIE' as const,
    },
  ];
  for (const p of projets) {
    await prisma.projet.upsert({
      where: { id: p.id },
      update: {},
      create: { ...p, organisationId: ORG_ID },
    });
  }

  // ── 19. Évaluation et amélioration continue ──────────────────────────────
  // TOGAF ADM Phase H — Gestion du changement architectural
  const reponses = [
    { repondant: 'Groupe Stellantis', score: 3, commentaire: 'Délais de livraison respectés mais traçabilité insuffisante — attente du déploiement ERP.' },
    { repondant: 'Airbus SE',         score: 4, commentaire: 'Qualité des composants satisfaisante. Demande de certification numérique des dossiers FAI.' },
    { repondant: 'Direction Production (interne)', score: 2, commentaire: 'Systèmes trop fragmentés — double saisie quotidienne entre ERP et feuilles Excel.' },
    { repondant: 'Direction RH (interne)',         score: 3, commentaire: 'SIRH fonctionnel mais pas connecté à la GMAO pour les habilitations machines.' },
  ];
  for (const r of reponses) {
    const existing = await prisma.enqueteReponse.findFirst({ where: { repondant: r.repondant, organisationId: ORG_ID } });
    if (!existing) await prisma.enqueteReponse.create({ data: { ...r, organisationId: ORG_ID } });
  }

  // ── 20. Vision Canvas ────────────────────────────────────────────────────
  // Résumé de la phase A du TOGAF ADM pour KIRO Industries
  await prisma.visionCanvas.upsert({
    where: { organisationId: ORG_ID },
    update: {},
    create: {
      organisationId: ORG_ID,
      targetGroup: 'Fabricants automobiles (OEM) et aéronautiques — Stellantis, PSA, Airbus, Safran.',
      needs: 'Traçabilité numérique des composants, intégration temps réel production-logistique, maintenance prédictive et conformité NADCAP/IATF 16949.',
      product: 'Composants électroniques embarqués pour l\'automobile et l\'aéronautique, fabriqués selon les normes qualité les plus strictes.',
      businessGoals: 'Numériser 100% de la chaîne de production d\'ici 2026. Réduire le taux de panne machines à moins de 5%. Obtenir la certification ISO 27001.',
      competitors: 'Valeo, Continental, Aptiv — avance sur la digitalisation et les capacités IoT industrielles.',
      revenueStreams: 'Contrats cadres OEM (75%), commandes spot (15%), services de co-développement (10%).',
      costFactors: 'Matières premières (45%), main d\'œuvre (30%), maintenance machines (15%), SI et licences (10%).',
      channels: 'Force commerciale B2B directe, salons industriels (Industrie Lyon, Embedded World), portail fournisseur EDI.',
    },
  });

  // ── Résumé ───────────────────────────────────────────────────────────────
  console.log('\n✅ Seed KIRO Industries terminé avec succès !\n');
  console.log('🔐 Superadmin     :', SUPERADMIN_EMAIL, '/', SUPERADMIN_PASSWORD);
  console.log('👤 Administrateur : admin@kiro-industries.fr / Admin123!');
  console.log('👤 Architecte 1   : archi1@kiro-industries.fr / Archi123!');
  console.log('👤 Architecte 2   : archi2@kiro-industries.fr / Archi123!');
  console.log('👤 Architecte 3   : archi3@kiro-industries.fr / Archi123!');
  console.log('\n📋 Contenu créé :');
  console.log('   • 1 organisation KIRO Industries (Bordeaux, industrie manufacturière)');
  console.log('   • 8 structures organisationnelles (DG > DSI/RH/Finance/Commercial/Production)');
  console.log('   • 4 membres (1 admin DSI + 3 architectes)');
  console.log('   • 4 parties prenantes (Stellantis, Airbus, CNIL, SAP France)');
  console.log('   • 5 objectifs stratégiques AS-IS + TO-BE avec liens d\'évolution');
  console.log('   • 6 capacités métier (Production, Logistique, RH, Maintenance, Ventes, Finance)');
  console.log('   • 16 éléments ArchiMate (Motivation + Métier) + 8 relations');
  console.log('   • 3 processus BPMN avec éléments et flux complets (Production, RH, Maintenance)');
  console.log('   • 5 applications + services applicatifs + échanges inter-applicatifs');
  console.log('   • Plan d\'urbanisation (2 zones > 3 quartiers > 5 îlots) + affectations');
  console.log('   • 5 entités de données + attributs + relations ER');
  console.log('   • 8 composants technologiques + 6 déploiements');
  console.log('   • 7 éléments architecture applicative + flux');
  console.log('   • 3 solutions évaluées avec scores sur 4 critères');
  console.log('   • 3 politiques de gouvernance + matrice de conformité');
  console.log('   • 3 demandes de changement architectural');
  console.log('   • 4 projets roadmap (2025-2026)');
  console.log('   • 4 réponses d\'enquête satisfaction');
  console.log('   • Vision Canvas complète (Phase A TOGAF ADM)');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
