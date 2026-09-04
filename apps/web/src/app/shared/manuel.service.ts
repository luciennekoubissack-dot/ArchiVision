import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';

/**
 * Génère et télécharge le manuel utilisateur d'ArchiVision au format PDF.
 * Utilise jsPDF (déjà dans les dépendances) — aucun serveur requis.
 */
@Injectable({ providedIn: 'root' })
export class ManuelService {

  telecharger(): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = 210;
    const margin = 18;
    const contentW = pageW - margin * 2;
    let y = 0;

    // ── Helpers ──────────────────────────────────────────────────────────────

    const newPage = () => {
      doc.addPage();
      y = 20;
    };

    const checkPage = (needed = 18) => {
      if (y + needed > 278) newPage();
    };

    const title = (text: string) => {
      checkPage(24);
      doc.setFillColor(26, 58, 108);
      doc.rect(margin, y, contentW, 10, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.text(text, margin + 4, y + 7);
      doc.setTextColor(30, 30, 30);
      y += 15;
    };

    const subtitle = (text: string) => {
      checkPage(14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(26, 58, 108);
      doc.text(text, margin, y);
      doc.setTextColor(30, 30, 30);
      y += 7;
    };

    const body = (text: string) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(50, 50, 50);
      const lines = doc.splitTextToSize(text, contentW) as string[];
      checkPage(lines.length * 5 + 2);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 2;
    };

    const field = (label: string, desc: string, required = false, example = '') => {
      checkPage(16);
      // Fond léger
      doc.setFillColor(245, 247, 252);
      doc.rect(margin, y, contentW, required ? 14 : 12, 'F');
      // Barre latérale colorée
      doc.setFillColor(required ? 220 : 99, required ? 53 : 130, required ? 69 : 200);
      doc.rect(margin, y, 2.5, required ? 14 : 12, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 30, 30);
      const req = required ? ' *' : '';
      doc.text(`${label}${req}`, margin + 5, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(80, 80, 80);
      const descLines = doc.splitTextToSize(desc, contentW - 8) as string[];
      doc.text(descLines, margin + 5, y + 10);

      if (example) {
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'italic');
        doc.text(`Ex. : ${example}`, margin + 5, y + (required ? 13 : 11) + descLines.length * 3.5);
        y += descLines.length * 3.5 + 2;
      }

      y += required ? 16 : 14;
    };

    const note = (text: string, color: [number, number, number] = [230, 245, 255]) => {
      checkPage(12);
      doc.setFillColor(...color);
      const lines = doc.splitTextToSize(`ℹ  ${text}`, contentW - 6) as string[];
      doc.rect(margin, y, contentW, lines.length * 4.5 + 4, 'F');
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(40, 80, 140);
      doc.text(lines, margin + 3, y + 4);
      doc.setTextColor(30, 30, 30);
      y += lines.length * 4.5 + 7;
    };

    const space = (n = 4) => { y += n; };

    // ── Page de couverture ────────────────────────────────────────────────────
    doc.setFillColor(26, 58, 108);
    doc.rect(0, 0, 210, 60, 'F');
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 55, 210, 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(255, 255, 255);
    doc.text('ArchiVision', 105, 28, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    doc.setTextColor(180, 210, 255);
    doc.text('Manuel Utilisateur', 105, 40, { align: 'center' });
    doc.setFontSize(10);
    doc.text('Plateforme d\'Architecture d\'Entreprise — TOGAF ADM', 105, 50, { align: 'center' });

    y = 75;
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Ce manuel décrit tous les champs de l\'application ArchiVision et explique comment', margin, y);
    y += 6;
    doc.text('les remplir correctement, module par module, dans l\'ordre du cycle ADM TOGAF.', margin, y);
    y += 10;

    // Légende
    doc.setFillColor(220, 53, 69);
    doc.rect(margin, y, 2.5, 6, 'F');
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    doc.text('Champ obligatoire *', margin + 5, y + 4.5);

    doc.setFillColor(99, 130, 200);
    doc.rect(margin + 55, y, 2.5, 6, 'F');
    doc.text('Champ optionnel', margin + 60, y + 4.5);
    y += 12;

    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text(`Version 1.0 — ${new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })}`, margin, y);

    // ── Page 2 : Sommaire ─────────────────────────────────────────────────────
    newPage();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(26, 58, 108);
    doc.text('Sommaire', margin, y);
    y += 10;

    const toc = [
      ['1.', 'Inscription et connexion', '3'],
      ['2.', 'Phase Préliminaire — Organisation', '3'],
      ['3.', 'Phase A — Vision', '4'],
      ['4.', 'Phase B — Architecture Métier (BPMN + ArchiMate)', '5'],
      ['5.', 'Phase C — Architecture des données', '7'],
      ['6.', 'Phase C — Architecture applicative', '8'],
      ['7.', 'Phase D — Architecture technologique', '9'],
      ['8.', 'Analyse des écarts', '10'],
      ['9.', 'Phase E — Opportunités & Solutions', '11'],
      ['10.', 'Phase F — Migration Planning (Roadmap)', '12'],
      ['11.', 'Phase G — Mise en œuvre', '12'],
      ['12.', 'Phase G — Gouvernance', '13'],
      ['13.', 'Phase H — Évaluation et amélioration continue', '13'],
      ['14.', 'Canevas d\'architecture global', '14'],
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    for (const [num, label, page] of toc) {
      doc.setTextColor(50, 50, 50);
      doc.text(num, margin, y);
      doc.text(label, margin + 10, y);
      doc.setTextColor(150, 150, 150);
      doc.text(page, pageW - margin, y, { align: 'right' });
      // Pointillés
      const labelW = doc.getTextWidth(label);
      const dotsStart = margin + 10 + labelW + 2;
      const dotsEnd = pageW - margin - 6;
      doc.setLineDashPattern([0.5, 2], 0);
      doc.setDrawColor(180, 180, 180);
      doc.line(dotsStart, y - 0.5, dotsEnd, y - 0.5);
      doc.setLineDashPattern([], 0);
      y += 7;
    }

    // ── 1. Inscription et connexion ───────────────────────────────────────────
    newPage();
    title('1. Inscription et connexion');
    body('ArchiVision utilise deux modes d\'accès : inscription libre (compte administrateur) ou invitation par e-mail (compte architecte). Le superadmin doit valider chaque nouvelle organisation avant que ses membres puissent se connecter.');
    space();

    subtitle('Formulaire d\'inscription');
    field('Nom de l\'organisation', 'Nom officiel ou commercial de votre entreprise.', true, 'KIRO Industries');
    field('Secteur', 'Secteur d\'activité principal.', false, 'Industrie manufacturière');
    field('Taille', 'Effectif approximatif.', false, '850 collaborateurs');
    field('Pays', 'Pays du siège social.', false, 'France');
    field('Ville', 'Ville du siège social.', false, 'Bordeaux');
    field('Votre nom complet', 'Nom et prénom du compte administrateur.', true, 'Sophie Marchand');
    field('Adresse e-mail', 'E-mail unique pour la connexion. Doit être valide.', true, 'admin@kiro-industries.fr');
    field('Mot de passe', 'Minimum 8 caractères. Ne sera jamais affiché.', true);
    note('Après inscription, votre organisation est EN_ATTENTE. Le superadmin reçoit une notification et valide (ou rejette) votre demande avant que vous puissiez vous connecter.');

    subtitle('Connexion par invitation');
    body('Si vous recevez un lien d\'invitation par e-mail, cliquez dessus. La page "Rejoindre" affiche l\'organisation et le rôle qui vous sont attribués. Saisissez uniquement votre nom et choisissez un mot de passe.');
    field('Votre nom complet', 'Comment vous serez identifié dans l\'application.', true, 'Thomas Rivière');
    field('Mot de passe', 'Minimum 8 caractères. Choisi librement.', true);
    note('L\'e-mail et le rôle (Administrateur ou Architecte) sont pré-remplis par l\'administrateur. Le lien expire après 7 jours.');

    // ── 2. Organisation ───────────────────────────────────────────────────────
    title('2. Phase Préliminaire — Organisation');
    body('Ce module représente la Phase Préliminaire du cycle ADM TOGAF. Il sert à positionner l\'organisation dans son contexte : identité, objectifs stratégiques, parties prenantes et organigramme.');
    space();

    subtitle('Identité (onglet "Identité")');
    field('Nom', 'Nom officiel de l\'organisation, tel qu\'il apparaîtra dans tous les diagrammes.', true, 'KIRO Industries');
    field('Description', 'Courte présentation de l\'activité et du périmètre de l\'organisation.', false, 'Fabricant industriel de composants électroniques pour l\'automobile.');
    field('Secteur', 'Secteur d\'activité (industrie, services, santé, public…).', false, 'Industrie manufacturière');
    field('Taille', 'Nombre de collaborateurs ou fourchette d\'effectif.', false, '850 collaborateurs');
    field('Pays', 'Pays du siège social.', false, 'France');
    field('Ville', 'Ville principale.', false, 'Bordeaux');
    field('Vision', 'Ambition à long terme de l\'organisation. Répondre à : "Où voulons-nous être dans 5 ans ?"', false, 'Devenir le fabricant industriel 4.0 de référence en Europe d\'ici 2027.');
    field('Problèmes à résoudre', 'Douleurs actuelles que l\'architecture doit adresser. Être concret et factuel.', false, 'Systèmes SI hétérogènes, absence de traçabilité production, maintenance curative coûteuse.');
    field('Logo', 'Image PNG/JPG. Apparaît dans le bandeau et les diagrammes exportés. Max 2 Mo.', false);

    space();
    subtitle('Structures (onglet "Structures")');
    body('Définit l\'organigramme de l\'organisation sous forme d\'arbre hiérarchique. Chaque nœud représente un service ou un poste.');
    field('Nom *', 'Nom officiel du service, département ou poste.', true, 'Direction des Systèmes d\'Information');
    field('Description', 'Responsabilités principales de cette unité.', false, 'Conception, déploiement et exploitation du SI.');
    field('Structure parente', 'Service dont dépend hiérarchiquement cette unité. Laisser vide pour un nœud racine.', false, 'Direction Générale');
    field('Titulaire', 'Membre de l\'organisation qui occupe ce poste. Sélectionner parmi les membres créés.', false, 'Sophie Marchand');
    note('Le champ Titulaire n\'affiche que les membres déjà créés dans l\'onglet Membres. Créez d\'abord les membres, puis revenez assigner les titulaires.');

    space();
    subtitle('Membres (onglet "Membres", réservé ADMINISTRATEUR)');
    field('Nom complet *', 'Prénom et nom du collaborateur.', true, 'Thomas Rivière');
    field('Email *', 'Adresse e-mail unique. Servira à la connexion.', true, 'thomas@kiro-industries.fr');
    field('Mot de passe temporaire *', 'Minimum 8 caractères. Le membre devra le changer à sa première connexion.', true);
    field('Rôle *', 'ADMINISTRATEUR : accès total y compris gestion des membres. ARCHITECTE : accès à tous les modules métier.', true);
    field('Poste', 'Intitulé de poste visible dans la fiche membre et l\'organigramme.', false, 'Architecte Applicatif Senior');
    field('Contact', 'Téléphone ou autre moyen de contact direct.', false, '+33 5 56 00 10 01');
    field('Structure', 'Service auquel ce membre appartient. Optionnel.', false, 'Pôle Développement & Intégration');

    space();
    subtitle('Parties prenantes (onglet "Identité")');
    body('Les parties prenantes sont des acteurs externes (clients, régulateurs, partenaires) qui influencent ou sont affectés par les décisions architecturales.');
    field('Nom *', 'Nom de l\'entité externe.', true, 'Groupe Stellantis');
    field('Rôle', 'Relation avec l\'organisation et influence sur l\'architecture.', false, 'Client principal — commandes OEM composants automobiles');

    // ── 3. Vision ─────────────────────────────────────────────────────────────
    newPage();
    title('3. Phase A — Vision (Canvas d\'architecture)');
    body('Le Vision Canvas est une synthèse de la Phase A du cycle ADM TOGAF. Il positionne l\'organisation sur son marché et identifie les moteurs de la transformation. Accessible via "Vision" dans le menu.');
    space();

    field('Groupe cible', 'À qui s\'adresse l\'organisation ? Quels clients ou utilisateurs finaux ?', false, 'Fabricants automobiles (OEM) et aéronautiques — Stellantis, Airbus, Safran.');
    field('Besoins', 'Quels problèmes ou besoins ces clients cherchent-ils à résoudre grâce à votre organisation ?', false, 'Traçabilité numérique des composants, intégration temps réel production-logistique.');
    field('Proposition de valeur', 'Ce que l\'organisation produit ou fournit. Son offre principale.', false, 'Composants électroniques embarqués pour l\'automobile et l\'aéronautique.');
    field('Objectifs métier', 'Résultats mesurables attendus à l\'issue de la transformation architecturale.', false, 'Numériser 100% de la chaîne de production d\'ici 2026. Réduire le taux de panne < 5%.');
    field('Concurrents', 'Acteurs avec lesquels l\'organisation est en concurrence. Aide à positionner les solutions.', false, 'Valeo, Continental, Aptiv.');
    field('Sources de revenus', 'Comment l\'organisation génère-t-elle de la valeur économique ?', false, 'Contrats cadres OEM (75%), commandes spot (15%), co-développement (10%).');
    field('Facteurs de coût', 'Principaux postes de dépenses à optimiser dans la transformation.', false, 'Matières premières (45%), main d\'œuvre (30%), maintenance (15%), SI (10%).');
    field('Canaux', 'Comment l\'organisation atteint ses clients et partenaires ?', false, 'Force commerciale B2B, salons industriels, portail EDI.');

    space();
    subtitle('Objectifs stratégiques (onglet "Stratégie")');
    body('Les objectifs sont les engagements mesurables de la transformation. Ils servent de référence à l\'analyse des écarts et à la progression des solutions.');
    field('Nom *', 'Intitulé court et précis de l\'objectif.', true, 'Digitaliser la chaîne de production');
    field('Description', 'Contexte, portée et résultat attendu. Être aussi concret que possible.', false, 'Numériser les ordres de fabrication et la traçabilité des composants.');
    field('Sous-objectif', 'Objectif opérationnel qui contribue à l\'objectif principal.', false, 'Intégrer MES et ERP pour une visibilité temps réel sur les lignes de production.');
    field('Statut *', 'AS-IS : situation actuelle à faire évoluer. TO-BE : cible souhaitée. LES_DEUX : objectif inchangé.', true);
    field('Objectif AS-IS associé', 'Si statut = TO-BE, lier à l\'objectif AS-IS dont il est l\'évolution. Crée le lien d\'analyse des écarts.', false);
    note('Créez d\'abord les objectifs AS-IS, puis les objectifs TO-BE en les liant à leur AS-IS correspondant. Ce lien alimente automatiquement la matrice d\'analyse des écarts.');

    // ── 4. BPMN + ArchiMate ───────────────────────────────────────────────────
    newPage();
    title('4. Phase B — Architecture Métier');

    subtitle('Processus BPMN');
    body('Les processus BPMN décrivent comment l\'organisation fonctionne aujourd\'hui (AS-IS) et comment elle devrait fonctionner demain (TO-BE). Chaque processus est composé d\'éléments (tâches, événements, passerelles) reliés par des flux.');
    space();

    subtitle('Créer un processus');
    field('Nom *', 'Intitulé du processus en mode verbe + objet.', true, 'Lancement d\'un ordre de fabrication');
    field('Description', 'Périmètre, déclencheur principal et résultat attendu du processus.', false, 'De la réception de commande client jusqu\'au démarrage de la ligne de production.');
    field('Type *', 'METIER : crée directement de la valeur (fabrication, vente). SUPPORT : fonctions internes (RH, SI). PILOTAGE : gouvernance et stratégie.', true);
    field('Étapes', 'Décrivez les étapes en langage naturel, une par ligne. L\'application génère automatiquement un diagramme BPMN de départ.', false, 'Réception commande\nVérifier stock\nCréer l\'ordre de fabrication\nLancer la production');
    field('Objectifs visés', 'Sélectionner les objectifs stratégiques que ce processus contribue à atteindre. Alimente la progression dans l\'analyse des écarts.', false);
    space();

    subtitle('Éléments d\'un processus (dans l\'éditeur graphique)');
    field('Nom *', 'Libellé de l\'étape, court et actionnable.', true, 'Vérifier disponibilité matières');
    field('Type *', 'EVENEMENT_DEBUT/FIN : début et fin du flux. TACHE : action à réaliser. PASSERELLE : branchement conditionnel (XOR, AND...). SOUS_PROCESSUS : processus imbriqué.', true);
    field('Déclencheur', 'Pour les événements uniquement. MESSAGE : déclenché par un message entrant. MINUTERIE : planifié. SIGNAL : déclenché par un signal externe.', false);
    field('Nature de la tâche', 'Pour les tâches uniquement. UTILISATEUR : action humaine. SERVICE : traitement automatique. ENVOI : envoi de message. RECEPTION : attente de réponse.', false);
    field('Statut *', 'AS-IS : étape qui existe aujourd\'hui. TO-BE : étape future. LES_DEUX : étape inchangée.', true);
    note('Conseil : créez d\'abord les événements début et fin, puis les tâches principales, puis les passerelles. Reliez-les en glissant depuis les points d\'ancrage (points bleus qui apparaissent au survol).');

    space();
    subtitle('Architecture Métier — Capacités');
    body('Les capacités métier décrivent ce que l\'organisation SAIT FAIRE, indépendamment de comment elle le fait. Elles structurent les éléments ArchiMate.');
    field('Nom *', 'Ce que l\'organisation sait faire. Formuler comme une capacité, pas un service.', true, 'Gestion de la production');
    field('Description', 'Périmètre détaillé de la capacité et les activités qu\'elle recouvre.', false, 'Planification des ordres de fabrication, suivi des lignes et contrôle qualité.');

    space();
    subtitle('Architecture Métier — Éléments ArchiMate');
    body('Les éléments ArchiMate modélisent l\'architecture dans deux couches : la couche Motivation (pourquoi) et la couche Métier (quoi/qui).');
    space();
    body('Couche Motivation : VISION (ambition long terme), OBJECTIF_ARCHIMATE (résultat mesurable), PRINCIPE (règle de conception), EXIGENCE (contrainte fonctionnelle ou non-fonctionnelle).');
    body('Couche Métier : ACTEUR_METIER (personne ou entité), ROLE_METIER (rôle joué dans un processus), PROCESSUS_METIER (enchaînement d\'activités), SERVICE_METIER (résultat fourni), OBJET_METIER (document ou donnée manipulée).');

    field('Nom *', 'Libellé précis de l\'élément.', true, 'Responsable Production');
    field('Type *', 'Voir les deux couches ci-dessus.', true);
    field('Description', 'Rôle exact de cet élément dans l\'architecture.', false);
    field('Catégorie (si EXIGENCE)', 'FONCTIONNELLE : ce que le système doit faire. NON_FONCTIONNELLE : comment il doit le faire (performance, sécurité).', false);
    field('Statut', 'AS-IS / TO-BE / LES_DEUX — même logique que pour les objectifs.', false);
    field('Capacité associée', 'Rattacher l\'élément à la capacité métier qu\'il réalise ou supporte.', false);

    space();
    subtitle('Relations ArchiMate');
    field('Source *', 'Élément d\'origine de la relation.', true);
    field('Cible *', 'Élément cible de la relation.', true);
    field('Type *', 'ASSIGNATION : qui fait quoi (acteur → processus). COMPOSITION : décomposition (processus → sous-processus). REALISATION : ce qui réalise quoi (processus → service). ASSOCIATION : lien libre entre deux éléments.', true);

    // ── 5. Données ────────────────────────────────────────────────────────────
    newPage();
    title('5. Phase C — Architecture des données');
    body('Ce module modélise le diagramme entité-relation (ER) de l\'organisation. Il répond à la question : quelles données manipule-t-on et comment sont-elles reliées ?');
    space();

    subtitle('Entités de données');
    field('Nom *', 'Nom de l\'objet métier représenté par cette entité.', true, 'Ordre de Fabrication');
    field('Description', 'Ce que représente cette entité et dans quel contexte elle est utilisée.', false, 'OF déclenché par une commande client, suivi jusqu\'à la livraison.');
    field('Propriétaire', 'Direction ou service responsable de la qualité et de la gestion de cette donnée.', false, 'Direction Production');
    field('Statut', 'AS-IS : donnée existante. TO-BE : donnée à créer. LES_DEUX : inchangée.', false);

    space();
    subtitle('Attributs d\'une entité');
    field('Nom *', 'Nom de l\'attribut en camelCase ou snake_case.', true, 'numeroOF');
    field('Type *', 'Type de données en texte libre : string, integer, float, date, datetime, boolean, enum, uuid.', true, 'string');

    space();
    subtitle('Relations entre entités');
    field('Source *', 'Entité d\'origine de la relation.', true, 'Client');
    field('Cible *', 'Entité cible de la relation.', true, 'Ordre de Fabrication');
    field('Cardinalité *', 'UN_A_UN : chaque instance source correspond à une seule cible. UN_A_PLUSIEURS : une source peut avoir plusieurs cibles. PLUSIEURS_A_PLUSIEURS : association libre des deux côtés.', true, 'UN_A_PLUSIEURS');
    field('Libellé', 'Verbe qui décrit la sémantique de la relation.', false, 'passe');

    // ── 6. Architecture applicative ───────────────────────────────────────────
    title('6. Phase C — Architecture applicative');
    body('Deux sous-modules décrivent l\'architecture applicative : le portefeuille d\'applications (avec urbanisation) et le diagramme de composants (flux entre applications).');
    space();

    subtitle('Applications (portefeuille)');
    field('Nom *', 'Nom commercial ou acronyme de l\'application.', true, 'SAP S/4HANA');
    field('Description', 'Périmètre fonctionnel couvert par l\'application.', false, 'ERP central couvrant la production, la logistique, la finance et les ventes.');
    field('Statut', 'AS-IS : application existante. TO-BE : à déployer. LES_DEUX : conservée telle quelle.', false);

    space();
    subtitle('Services applicatifs (onglet dans l\'application)');
    body('Les services applicatifs sont les capacités exposées par une application. Ils servent à la cartographie fonctionnelle.');
    field('Nom *', 'Intitulé du service fonctionnel exposé.', true, 'Gestion des ordres de fabrication');
    field('Description', 'Ce que ce service permet de faire et qui l\'utilise.', false);

    space();
    subtitle('Échanges entre applications');
    body('Les échanges représentent les flux de données et d\'appels entre applications. Ils alimentent le diagramme de composants.');
    field('Application source *', 'Application émettrice du flux.', true, 'CRM Salesforce');
    field('Application cible *', 'Application réceptrice du flux.', true, 'SAP S/4HANA');
    field('Description', 'Nature des données échangées ou de l\'appel.', false, 'Transmission des commandes clients confirmées');
    field('Protocole', 'Standard technique utilisé pour l\'échange.', false, 'REST API / SFTP / EDI / SOAP');

    space();
    subtitle('Plan d\'occupation des sols — Zones d\'urbanisation');
    body('Le POS organise les applications en zones fonctionnelles sur 3 niveaux : Zone > Quartier > Îlot.');
    field('Nom *', 'Nom fonctionnel de la zone.', true, 'Zone Métier / Quartier Production / Îlot ERP');
    field('Type *', 'ZONE : domaine fonctionnel de haut niveau. QUARTIER : sous-domaine. ILOT : regroupement applicatif fin.', true);
    field('Parent', 'Zone ou quartier dont cette unité dépend hiérarchiquement.', false);
    note('Pour affecter une application à un îlot : ouvrez le détail de l\'application, onglet "Urbanisation", puis choisissez l\'îlot.');

    // ── 7. Technologie ────────────────────────────────────────────────────────
    newPage();
    title('7. Phase D — Architecture technologique');
    body('Ce module décrit l\'infrastructure sur laquelle tournent les applications : serveurs, réseaux, cloud, bases de données. Il produit le diagramme de déploiement UML.');
    space();

    subtitle('Composants technologiques');
    field('Nom *', 'Nom de l\'équipement ou de la plateforme.', true, 'Serveur Applicatif Principal');
    field('Type *', 'SERVEUR, SERVEUR_APPLICATIONS, BASE_DE_DONNEES_POSTGRESQL, PLATEFORME_CLOUD, PARE_FEU, SWITCH, VPN, API_REST, STOCKAGE_NAS, LOGICIEL_CYBERSECURITE, AUTRE…', true, 'SERVEUR_APPLICATIONS');
    field('Description', 'Rôle dans l\'infrastructure et applications hébergées.', false, 'Héberge SAP S/4HANA et GMAO en on-premise.');
    field('Statut', 'AS-IS : infrastructure existante. TO-BE : à déployer. LES_DEUX : conservée.', false);

    space();
    subtitle('Déployer une application sur un composant');
    body('Dans l\'onglet Diagramme de déploiement, survolez un nœud et utilisez le bouton "Déployer". Cela crée un lien application → composant visible dans le diagramme.');
    note('Le bouton "Réorganiser le diagramme" replace automatiquement tous les nœuds en grille. Utile si les positions sont désordonnées.');

    space();
    subtitle('Chemins de communication (liens réseau dans l\'éditeur)');
    body('Pour créer un lien réseau entre deux composants : survolez un nœud, 4 points d\'ancrage apparaissent sur ses bords. Glissez depuis un point vers un autre nœud. Un dialogue propose le type de lien.');
    field('Type de lien *', 'TCP_IP, HTTPS (sécurisé), VPN (chiffré), FIBRE (haut débit), WIFI (sans fil), ETHERNET (filaire), AUTRE.', true);

    space();
    subtitle('Diagramme d\'architecture applicative (module Architecture Système)');
    body('Ce diagramme UML de composants montre les interactions entre éléments : utilisateurs, applications, bases de données, systèmes externes, infrastructure et sécurité.');
    field('Nom *', 'Nom de l\'élément représenté dans le diagramme.', true, 'Système SSO / IAM');
    field('Type *', 'APPLICATION, UTILISATEUR_INTERNE, UTILISATEUR_EXTERNE, BASE_DE_DONNEES, SYSTEME_EXTERNE, INFRASTRUCTURE, SECURITE.', true);
    field('Description', 'Rôle dans le schéma d\'architecture applicative.', false);

    // ── 8. Analyse des écarts ─────────────────────────────────────────────────
    newPage();
    title('8. Analyse des écarts');
    body('Ce module est alimenté automatiquement par les statuts AS-IS/TO-BE de tous les éléments. Il produit 5 matrices d\'écarts : Objectifs, Architecture Métier, Données, Applicatif, Technologique.');
    space();

    subtitle('Comment lire la matrice');
    body('Chaque ligne compare un état actuel (colonne Baseline) à un état cible (colonne Target). Les états possibles sont :');
    space(2);
    field('Conservé', 'L\'élément existe des deux côtés — rien à changer. Statut LES_DEUX.', false);
    field('Éliminé', 'L\'élément existe en AS-IS mais n\'a pas de cible TO-BE — à supprimer ou migrer.', false);
    field('Modifié', 'L\'élément AS-IS a une cible TO-BE associée — à faire évoluer.', false);
    field('Nouveau', 'L\'élément TO-BE n\'a pas d\'origine AS-IS — à créer ex nihilo.', false);
    field('Réalisé', 'Toutes les solutions liées à cet écart ont l\'avancement TERMINEE.', false);

    space();
    subtitle('Onglet Processus');
    body('Cliquez sur un processus dans la liste pour voir :');
    body('• La barre de progression AS-IS → TO-BE (ratio éléments TO-BE / total éléments).');
    body('• Les objectifs stratégiques visés par ce processus et le nombre de solutions terminées pour chacun.');
    body('• La liste des éléments AS-IS (à faire évoluer) et TO-BE (nouveaux).');
    space();
    note('Pour lier un processus à un objectif stratégique : ouvrez le processus dans Architecture Métier, onglet BPMN, puis modifiez les "Objectifs visés".');

    // ── 9. Opportunités & Solutions ───────────────────────────────────────────
    title('9. Phase E — Opportunités & Solutions');
    body('Pour chaque écart identifié, vous proposez des solutions candidates, vous les évaluez sur des critères et vous les liez aux écarts qu\'elles adressent.');
    space();

    subtitle('Critères d\'évaluation (à créer avant les solutions)');
    field('Nom *', 'Intitulé du critère de comparaison.', true, 'Coût d\'implémentation');
    field('Description', 'Ce que mesure ce critère et comment interpréter les scores.', false, 'TCO sur 5 ans incluant licences, intégration et formation.');

    space();
    subtitle('Solutions');
    field('Nom *', 'Nom de la solution candidate.', true, 'Migration vers SAP S/4HANA');
    field('Description', 'Ce que cette solution apporte et quel problème elle résout.', false, 'Remplacement de l\'ERP legacy pour unifier production, logistique et finance.');
    field('Statut *', 'PROPOSEE : en cours d\'évaluation. RETENUE : décision prise. REJETEE : écartée avec justification.', true);
    field('Plan de mise en œuvre', 'Phases, jalons et responsables. Détailler autant que possible.', false, 'Phase 1 (S1 2025) : audit. Phase 2 (S2 2025) : paramétrage. Phase 3 (S1 2026) : migration.');

    space();
    subtitle('Scores d\'évaluation (matrice)');
    body('Pour chaque couple solution/critère, saisir un score de 1 à 5 et un commentaire justificatif. La matrice affiche les scores sous forme de tableau comparatif.');
    field('Score *', 'Note de 1 (très défavorable) à 5 (très favorable). Cohérent avec la définition du critère.', true, '5 → très favorable ; 1 → très défavorable');
    field('Commentaire', 'Justification factuelle du score attribué.', false, 'Solution leader du marché industriel, +15 ans de stabilité.');

    space();
    subtitle('Lier une solution à un écart');
    body('Dans la fiche d\'une solution retenue, cliquez "Lier aux écarts" pour sélectionner les éléments (objectifs, applications, composants…) que cette solution adresse. Ces liens alimentent la colonne "Couverture solution" de la matrice des écarts.');

    // ── 10. Roadmap ───────────────────────────────────────────────────────────
    newPage();
    title('10. Phase F — Migration Planning (Roadmap)');
    body('La roadmap planifie concrètement les projets de transformation dans le temps avec des dates, budgets et priorités.');
    space();

    subtitle('Créer un projet');
    field('Nom *', 'Nom court du projet, identifiable sans contexte.', true, 'Déploiement SSO / IAM');
    field('Description', 'Périmètre, objectif et livrable principal du projet.', false, 'Centralisation de l\'authentification et des autorisations sur l\'ensemble du SI.');
    field('Priorité *', 'HAUTE : impact direct sur les objectifs stratégiques ou bloquant. MOYENNE : important mais non urgent. BASSE : amélioration ou nice-to-have.', true);
    field('Coût estimé', 'Budget prévisionnel en texte libre (montant + devise + précision).', false, '95 000 € (estimation initiale, hors maintenance)');
    field('Date de début', 'Date planifiée de démarrage du projet.', false, '01/03/2025');
    field('Date de fin', 'Date planifiée de livraison ou de mise en production.', false, '30/09/2025');
    field('Statut *', 'PLANIFIE : pas encore démarré. EN_COURS : en exécution active. TERMINE : livré et opérationnel.', true);
    note('La frise chronologique se génère automatiquement à partir des dates. Les projets sans dates apparaissent dans le tableau mais pas sur la frise.');

    // ── 11. Mise en œuvre ─────────────────────────────────────────────────────
    title('11. Phase G — Mise en œuvre');
    body('Ce module suit l\'avancement opérationnel des solutions retenues. Il s\'accède depuis Opportunités & Solutions → onglet Mise en œuvre.');
    space();

    field('Avancement *', 'NON_DEMARRE : solution retenue mais pas encore lancée. EN_COURS : implémentation active. TERMINE : déployé et opérationnel. BLOQUE : problème identifié.', true);
    field('Commentaire de suivi', 'Note de progression libre. Dater les entrées pour garder un historique lisible.', false, '15/09/2025 : Mapping données terminé. Paramétrage module PP en cours. Blocage : validation DPO en attente.');
    note('Quand une solution passe à TERMINEE, retournez dans Analyse des écarts : les lignes couvertes par cette solution s\'affichent automatiquement comme "Réalisé".');

    // ── 12. Gouvernance ───────────────────────────────────────────────────────
    title('12. Phase G — Gouvernance');
    body('La gouvernance s\'assure que les solutions retenues respectent les règles d\'architecture établies par l\'organisation.');
    space();

    subtitle('Politiques d\'architecture');
    field('Nom *', 'Intitulé de la règle ou du standard.', true, 'Standard d\'Interopérabilité API-First');
    field('Description', 'Ce que la politique impose, à qui elle s\'applique et comment la vérifier.', false, 'Toute intégration entre applications passe par l\'API Gateway. Aucune intégration point-à-point.');

    space();
    subtitle('Conformité (matrice politique × solution)');
    field('Statut *', 'CONFORME : la solution respecte la politique. NON_CONFORME : exception documentée (obligatoire). A_EVALUER : vérification en cours.', true);
    field('Commentaire', 'Justification ou plan de remédiation si NON_CONFORME.', false, 'L\'IAM communique directement avec LDAP — exception approuvée par le RSSI le 12/09/2025.');

    space();
    subtitle('Demandes de changement architectural (RFC)');
    field('Titre *', 'Intitulé court de la demande.', true, 'Arrêt du module legacy Production après migration SAP');
    field('Description', 'Contexte, impact et justification du changement demandé.', false);
    field('Statut *', 'PROPOSE → APPROUVE → IMPLEMENTE. REJETE si la demande n\'est pas retenue.', true);

    // ── 13. Évaluation ────────────────────────────────────────────────────────
    newPage();
    title('13. Phase H — Évaluation et amélioration continue');
    body('Ce module mesure si la transformation architecturale crée la valeur attendue, à travers les retours des parties prenantes et des questionnaires structurés.');
    space();

    subtitle('Enquêtes de satisfaction (import)');
    body('Les réponses d\'enquête s\'importent depuis un fichier Excel (format attendu : colonnes repondant, score, commentaire). Le module calcule la note moyenne et génère un rapport.');
    field('Répondant *', 'Nom ou identifiant du répondant (personne ou entité).', true, 'Groupe Stellantis');
    field('Score *', 'Note de 1 (très insatisfait) à 5 (très satisfait).', true, '4');
    field('Commentaire', 'Retour qualitatif libre du répondant.', false, 'Qualité satisfaisante, demande de certification numérique des dossiers FAI.');

    space();
    subtitle('Questionnaires d\'évaluation');
    body('Créez des questionnaires structurés pour évaluer la maturité architecturale après chaque livraison. Chaque question a un type qui détermine le mode de réponse.');
    field('Titre *', 'Nom du questionnaire.', true, 'Évaluation maturité SI post-migration SAP');
    field('Description', 'Contexte et objectif du questionnaire.', false);

    space();
    subtitle('Questions d\'un questionnaire');
    field('Intitulé *', 'Formulation claire de la question.', true, 'Le nouveau système ERP couvre-t-il tous les besoins de gestion de production ?');
    field('Type *', 'OUI_NON : réponse binaire. NOTE_MAX : note de 0 à N (définir N). CHOIX_MULTIPLE : liste de choix à définir. REPONSE_OUVERTE : texte libre. SUGGESTION : texte libre orienté amélioration.', true);
    field('Note max (si NOTE_MAX)', 'Borne supérieure de la note. Par défaut : 5.', false, '10');
    field('Options (si CHOIX_MULTIPLE)', 'Liste des options séparées par des virgules.', false, 'Totalement, Partiellement, Non');

    // ── 14. Canevas global ────────────────────────────────────────────────────
    title('14. Canevas d\'architecture global');
    body('Le canevas est un plan de travail interactif qui affiche tous les éléments de toutes les couches (ArchiMate, Applications, Composants technologiques, Entités de données) sur un seul espace. Il s\'accède depuis "Architecture Métier" → onglet Diagramme.');
    space();

    subtitle('Ajouter un élément au canevas');
    body('Glissez un type d\'élément depuis la palette (colonne gauche) vers la zone de dessin. Un formulaire demande le nom. L\'élément est créé en base et apparaît sur le canevas.');

    subtitle('Créer une relation entre deux éléments');
    body('Survolez un élément : 4 points bleus apparaissent sur ses bords. Glissez depuis un point vers un autre élément. Un formulaire demande le type de relation (Assignation, Composition, Réalisation, Association).');

    subtitle('Bouton "Générer"');
    body('Place automatiquement tous les éléments en grille organisée par couche. Utile à la première ouverture ou pour réinitialiser les positions après avoir ajouté de nombreux éléments. Attention : écrase les positions manuelles.');
    note('Pour naviguer : molette souris = zoom. Glisser sur le fond = pan. Glisser un nœud = déplacer. La position est sauvegardée automatiquement après 400 ms.');

    // ── Pied de page sur toutes les pages ─────────────────────────────────────
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(160, 160, 160);
      doc.line(margin, 287, pageW - margin, 287);
      doc.text('ArchiVision — Manuel Utilisateur v1.0', margin, 292);
      doc.text(`Page ${i} / ${pageCount}`, pageW - margin, 292, { align: 'right' });
    }

    doc.save('ArchiVision_Manuel_Utilisateur.pdf');
  }
}
