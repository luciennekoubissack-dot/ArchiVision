# Document d'exigences — Frontend ArchiVision (Angular)

## Introduction

Ce document définit les exigences du frontend Angular d'ArchiVision. Il
s'appuie sur l'état réel du backend (voir `README.md`), sur `docs/stack.md`
et `docs/referentiel.md`, et sur **`docs/cahier.md`** — la vision produit
fusionnée (2026-08-03) qui reconcilie le Cahier des Charges Technique
initial (scope restreint, mono-tenant) avec les nouvelles instructions du
porteur de projet (multi-tenant, rôles, services d'entreprise, objectifs).
**`docs/cahier.md` est désormais la référence produit qui prévaut** en cas
de contradiction avec le Cahier des Charges Technique v2 ou le Product
Backlog d'origine (tous deux antérieurs à la décision multi-tenant).

Contraintes techniques toujours en vigueur (`docs/stack.md`, confirmées
inchangées par `docs/cahier.md` section 6) :

- **Pas d'éditeur graphique interactif.** Toutes les vues (ArchiMate, POS,
  organigramme) sont du SVG généré côté serveur, affiché en lecture seule.
- **Pas de NgRx.** Services Angular + signals ou RxJS basique.
- Angular 17+, TypeScript strict, standalone components.

**Ce qui a changé depuis la version précédente de ce document** (voir
`docs/cahier.md` pour la justification complète) :

| Avant (mono-tenant) | Maintenant |
|---|---|
| Un seul utilisateur, pas d'inscription | Inscription = création d'une organisation + 4 rôles (Architecte, Dirigeant, Représentant, Collaborateur) |
| Sélecteur d'organisation manuel côté client | Organisation implicite, portée par le JWT (isolation multi-tenant) |
| CRUD Organisations (liste ouverte) | Une organisation par utilisateur ; pas de liste d'organisations tierces |
| Pas de structure organisationnelle | Services d'entreprise hiérarchiques + organigramme généré |
| Pas de couche stratégique | Objectifs (version allégée) |
| Dashboard non spécifié | Tableau de bord avec KPIs réels et graphiques (`ng2-charts`) |

**Dépendance backend non résolue (nouvelle) :** tout ce qui touche au
multi-tenant (Exigences 1, 3, 4, 5), aux Services (Exigence 6) et aux
Objectifs (Exigence 7) suppose des changements backend qui n'existent pas
encore au moment de la rédaction — nouveau champ `organisationId`/`role`
sur `User`, nouvelles tables `Service` et `Objectif`, guard d'isolation
tenant, endpoint `POST /auth/register`. Ces exigences décrivent le contrat
cible ; leur développement frontend est séquencé après le travail backend
correspondant (voir `docs/cahier.md` section 7 pour le point de sécurité
critique sur l'isolation des données).

**Dépendance backend résolue (2026-08-03) :** génération de vues. Contrat
réel, utilisé par les Exigences 13 et 14 :

```
GET /elements-archimate/generate-vue?organisationId=<uuid>
→ 200 { svg: string, elementCount: number, relationCount: number }

GET /zones-urbanisation/generate-vue?organisationId=<uuid>
→ 200 { svg: string, zoneCount: number, applicationCount: number }
```

Réponse en JSON : le frontend injecte `svg` dans le DOM via
`DomSanitizer.bypassSecurityTrustHtml` (source de confiance : notre propre
backend). Les compteurs permettent de détecter l'état vide sans parser le
SVG.

## Exigences

### Exigence 1 — Authentification et inscription

**User Story:** En tant que visiteur, je veux créer un compte pour mon
organisation, et en tant qu'utilisateur enregistré, je veux me connecter,
afin d'accéder au référentiel de mon organisation.

#### Critères d'acceptation

1. QUAND un visiteur non authentifié accède à une route protégée ALORS le
   système DOIT le rediriger vers `/login`.
2. QUAND un visiteur soumet le formulaire d'inscription (nom de
   l'organisation, secteur, taille, pays, logo optionnel, email/mot de
   passe/nom du premier utilisateur) ALORS le système DOIT appeler
   `POST /auth/register`, qui crée l'organisation et son premier
   utilisateur (rôle avec pleins pouvoirs) en une seule opération, puis
   connecte automatiquement l'utilisateur.
3. QUAND l'utilisateur soumet le formulaire de connexion avec des
   identifiants valides ALORS le système DOIT appeler `POST /auth/login`,
   stocker l'`accessToken` reçu, et rediriger vers le tableau de bord.
4. SI l'API retourne 401 sur la connexion ALORS le système DOIT afficher le
   message d'erreur sans détail technique, sans vider les champs saisis.
5. SI l'API retourne 400 (validation) sur la connexion ou l'inscription
   ALORS le système DOIT afficher une erreur par champ concerné, en
   complément d'une validation réactive côté client.
6. SI l'API retourne 409 sur l'inscription (email déjà utilisé) ALORS le
   système DOIT l'indiquer clairement sans révéler si c'est l'email ou
   autre chose qui bloque côté organisation.
7. QUAND une requête authentifiée reçoit une réponse 401 (token expiré ou
   invalide) ALORS le système DOIT déconnecter l'utilisateur et rediriger
   vers `/login`.
8. QUAND l'utilisateur clique sur « Se déconnecter » ALORS le système DOIT
   purger le token stocké et rediriger vers `/login`.
9. QUAND l'utilisateur est authentifié ET navigue vers `/login` ou
   `/register` ALORS le système DOIT le rediriger vers le tableau de bord.
10. Le système NE DOIT PAS permettre à un utilisateur déjà membre d'une
    organisation de créer une seconde organisation depuis le même compte —
    l'inscription est réservée aux nouveaux comptes (un `User` appartient à
    exactement une `Organisation`).

---

### Exigence 2 — Navigation et layout de base

**User Story:** En tant qu'utilisateur connecté, je veux une navigation
latérale claire entre les modules, afin de me repérer dans l'application.

#### Critères d'acceptation

1. QUAND l'utilisateur est authentifié ALORS le système DOIT afficher un
   layout avec sidebar (charte bleu/blanc/noir, logo fourni), en-tête et
   zone de contenu, sur toutes les pages protégées.
2. La sidebar DOIT donner accès aux modules : Tableau de bord, Organisation
   (infos, membres, services, organigramme), Stratégie (objectifs),
   Architecture métier (capacités, éléments, relations), Portefeuille
   applicatif, Urbanisation, Vues générées, Paramètres.
3. L'en-tête DOIT afficher l'identité de l'utilisateur connecté (`nom`,
   rôle) et un accès à la déconnexion.
4. QUAND une route inconnue est demandée ALORS le système DOIT afficher une
   page 404 avec un lien de retour au tableau de bord.
5. Le layout DOIT être responsive (desktop, tablette, mobile — sidebar
   repliable sous un certain seuil de largeur), conformément à la demande
   explicite de design responsive.

---

### Exigence 3 — Contexte multi-tenant (organisation implicite)

**User Story:** En tant qu'utilisateur, je veux que toutes mes actions
s'appliquent automatiquement à mon organisation, sans avoir à la
sélectionner ni pouvoir en consulter une autre par erreur.

#### Contexte technique

Contrairement à la version mono-tenant précédente, l'`organisationId` n'est
**plus un paramètre choisi côté client** : il est résolu côté backend à
partir du JWT de l'utilisateur connecté (voir `docs/cahier.md` section 7 —
c'est une exigence de sécurité, pas une préférence d'implémentation). Le
frontend n'a donc plus besoin d'envoyer `organisationId` dans ses requêtes
vers `/capacites-metier`, `/elements-archimate`, etc. — le backend l'ignore
ou le rejette s'il est fourni, et utilise systématiquement celui du token.

#### Critères d'acceptation

1. Le système NE DOIT PAS proposer de sélecteur d'organisation dans
   l'interface — il n'y a qu'une organisation par session utilisateur.
2. QUAND l'utilisateur est connecté ALORS toutes les requêtes vers le
   référentiel DOIVENT omettre `organisationId` (résolu côté serveur), sauf
   compatibilité ascendante explicitement documentée si le backend la
   conserve en transition.
3. SI le backend retourne 403 sur une ressource hors du périmètre de
   l'organisation de l'utilisateur (tentative d'accès à une ressource
   d'une autre organisation) ALORS le système DOIT afficher un message
   d'accès refusé, jamais les données elles-mêmes.

---

### Exigence 4 — Organisation courante

**User Story:** En tant qu'Architecte ou Dirigeant, je veux consulter et
modifier les informations de mon organisation, afin de tenir son profil à
jour.

#### Critères d'acceptation

1. QUAND l'utilisateur accède à la section Organisation ALORS le système
   DOIT afficher les informations de son organisation via
   `GET /organisations/me` (ou équivalent résolu par le token) : nom,
   description, secteur, taille, pays, logo.
2. QUAND un utilisateur avec le rôle Architecte ou Dirigeant modifie ces
   informations ALORS le système DOIT appeler `PATCH` sur cette ressource.
3. SI l'utilisateur n'a pas le rôle requis (Représentant, Collaborateur)
   ALORS le formulaire DOIT être en lecture seule, pas juste caché — pour
   que l'utilisateur comprenne pourquoi il ne peut pas modifier.
4. Le système NE DOIT PAS proposer la suppression de l'organisation depuis
   cette interface v1 (action destructrice à trop fort impact, hors
   périmètre).

---

### Exigence 5 — Membres et rôles

**User Story:** En tant qu'Architecte, je veux gérer les comptes des
membres de mon organisation et leur rôle, afin de refléter qui peut faire
quoi.

#### Critères d'acceptation

1. QUAND un Architecte accède à la section Membres ALORS le système DOIT
   lister les utilisateurs de son organisation (nom, email, rôle, service
   d'appartenance le cas échéant).
2. QUAND un Architecte crée un membre (email, nom, mot de passe temporaire,
   rôle parmi `ARCHITECTE`/`DIRIGEANT`/`REPRESENTANT`/`COLLABORATEUR`,
   service optionnel) ALORS le système DOIT créer le compte rattaché à la
   même organisation.
3. QUAND un Architecte modifie le rôle ou le service d'un membre ALORS le
   système DOIT appliquer le changement immédiatement.
4. QUAND un Architecte supprime un membre ALORS le système DOIT demander
   confirmation avant l'action, et empêcher la suppression du dernier
   Architecte de l'organisation (pour ne jamais laisser une organisation
   sans administrateur).
5. Les rôles autres qu'Architecte NE DOIVENT PAS avoir accès à cette
   section (masquée dans la sidebar, route protégée côté frontend en plus
   du contrôle serveur).

---

### Exigence 6 — Services d'entreprise et organigramme

**User Story:** En tant qu'Architecte, je veux structurer mon organisation
en services hiérarchiques (ex. Direction Informatique > Service Support) et
y rattacher des membres, afin d'obtenir automatiquement l'organigramme.

#### Critères d'acceptation

1. QUAND l'utilisateur accède à la section Services ALORS le système DOIT
   afficher la hiérarchie des services sous forme arborescente.
2. QUAND l'utilisateur crée un service (`nom`, `description` optionnelle,
   `parentId` optionnel) ALORS le système DOIT l'ajouter à l'arborescence
   de son organisation.
3. QUAND l'utilisateur modifie ou supprime un service ALORS le système
   DOIT appeler les endpoints correspondants, avec confirmation avant
   suppression, et avertissement explicite si le service a des membres
   rattachés ou des sous-services (suppression en cascade).
4. QUAND l'utilisateur consulte l'organigramme (sous-onglet de cette
   section, ou dans Vues générées) ALORS le système DOIT afficher un SVG
   généré côté serveur représentant la hiérarchie des services et les
   membres qui y sont rattachés — jamais un éditeur manuel.
5. SI l'organisation n'a aucun service défini ALORS le système DOIT
   afficher un état vide invitant à en créer un.

---

### Exigence 7 — Objectifs stratégiques

**User Story:** En tant que Dirigeant ou Architecte, je veux définir les
objectifs de mon organisation, afin de documenter sa stratégie.

#### Critères d'acceptation

1. QUAND l'utilisateur accède à la section Stratégie ALORS le système DOIT
   lister les objectifs de son organisation (`nom`, `description`).
2. QUAND un Dirigeant ou Architecte crée, modifie ou supprime un objectif
   ALORS le système DOIT appeler les endpoints correspondants, avec
   confirmation avant suppression.
3. Les rôles Représentant et Collaborateur DOIVENT avoir un accès en
   lecture seule à cette section.

---

### Exigence 8 — CRUD Capacités métier

**User Story:** En tant qu'utilisateur, je veux gérer les capacités métier
de mon organisation, afin de structurer ce qu'elle sait faire.

#### Critères d'acceptation

1. QUAND l'utilisateur accède à la section Capacités métier ALORS le
   système DOIT lister les capacités de son organisation via
   `GET /capacites-metier` (organisation résolue par le token, voir
   Exigence 3).
2. QUAND l'utilisateur crée une capacité (`nom`, `description` optionnelle)
   ALORS le système DOIT appeler `POST /capacites-metier`.
3. QUAND l'utilisateur modifie ou supprime une capacité ALORS le système
   DOIT appeler respectivement `PATCH /capacites-metier/:id` et
   `DELETE /capacites-metier/:id`, avec confirmation avant suppression.
4. QUAND une capacité a des éléments ArchiMate rattachés ALORS le système
   DOIT l'indiquer (compteur) avant toute suppression.

---

### Exigence 9 — CRUD Éléments ArchiMate

**User Story:** En tant qu'utilisateur, je veux créer et gérer les éléments
ArchiMate de la couche Métier, afin de modéliser les acteurs, rôles,
processus, services et objets métier de l'organisation.

#### Critères d'acceptation

1. QUAND l'utilisateur accède à la section Éléments ALORS le système DOIT
   lister les éléments de son organisation, avec un filtre par `type`
   (`ACTEUR_METIER`, `ROLE_METIER`, `PROCESSUS_METIER`, `SERVICE_METIER`,
   `OBJET_METIER`).
2. QUAND l'utilisateur crée un élément ALORS le formulaire DOIT proposer le
   `type` sous forme de liste fermée, un rattachement optionnel à une
   capacité métier existante (`capaciteMetierId`).
3. QUAND l'utilisateur modifie ou supprime un élément ALORS le système DOIT
   appeler les endpoints correspondants, avec confirmation avant
   suppression.
4. SI un élément a des relations qui le référencent ET que l'utilisateur
   demande sa suppression ALORS le système DOIT avertir que ces relations
   seront également supprimées (`onDelete: Cascade`).
5. QUAND l'utilisateur détache un élément de sa capacité ALORS le système
   DOIT envoyer `capaciteMetierId: null`.
6. Le type `SERVICE_METIER` de cette exigence représente un **service
   métier au sens ArchiMate** (ce que l'organisation délivre à un acteur) —
   à ne pas confondre avec un **service d'entreprise / département**
   (Exigence 6), qui est une entité distincte.

---

### Exigence 10 — CRUD Relations ArchiMate

**User Story:** En tant qu'utilisateur, je veux relier deux éléments
ArchiMate entre eux, afin de représenter les liens du référentiel métier.

#### Critères d'acceptation

1. QUAND l'utilisateur accède à la section Relations ALORS le système DOIT
   lister les relations de son organisation, affichant le nom des éléments
   source et cible (pas seulement leurs `id`).
2. QUAND l'utilisateur crée une relation ALORS le formulaire DOIT proposer
   la sélection de la source et de la cible parmi les éléments existants,
   et le `type` sous forme de liste fermée (`ASSIGNATION`, `COMPOSITION`,
   `REALISATION`, `ASSOCIATION`).
3. SI l'utilisateur sélectionne le même élément comme source et cible ALORS
   le système DOIT empêcher la soumission avec un message d'erreur clair.
4. QUAND l'utilisateur supprime une relation ALORS le système DOIT appeler
   l'endpoint correspondant avec confirmation préalable.
5. Le système NE DOIT PAS proposer de modification d'une relation
   existante — seules la création et la suppression sont possibles.

---

### Exigence 11 — CRUD Applications (portefeuille applicatif)

**User Story:** En tant qu'utilisateur, je veux gérer le portefeuille
applicatif de mon organisation, afin de connaître les applications
existantes et leur criticité.

#### Critères d'acceptation

1. QUAND l'utilisateur accède à la section Applications ALORS le système
   DOIT lister les applications avec la criticité affichée de façon
   visuellement distincte (code couleur HAUTE/MOYENNE/BASSE).
2. QUAND l'utilisateur crée une application ALORS le formulaire DOIT exiger
   `nom` et `criticite`, `description` restant optionnelle.
3. QUAND l'utilisateur modifie ou supprime une application ALORS le
   système DOIT appeler les endpoints correspondants avec confirmation
   avant suppression.
4. QUAND une application est affectée à une ou plusieurs zones (Exigence
   12) ALORS sa fiche DOIT lister ces affectations.

---

### Exigence 12 — CRUD Zones d'urbanisation et affectation d'applications

**User Story:** En tant qu'utilisateur, je veux organiser les zones,
quartiers et îlots du plan d'occupation des sols, et y affecter des
applications, afin de cartographier le portefeuille applicatif.

#### Critères d'acceptation

1. QUAND l'utilisateur accède à la section Zones ALORS le système DOIT
   afficher la hiérarchie Zone > Quartier > Îlot sous forme arborescente.
2. QUAND l'utilisateur crée une zone ALORS le formulaire DOIT exiger `nom`
   et `type`, et un `parentId` optionnel cohérent avec la hiérarchie — le
   système DOIT empêcher côté client une hiérarchie invalide.
3. QUAND l'utilisateur affecte une application ALORS le système DOIT
   appeler `POST /zones-urbanisation/affecter` et ne proposer que des
   îlots comme cible (contrainte imposée aussi côté backend, voir
   `UrbanisationService.affecter`).
4. SI l'API retourne 400 (zone non-îlot) ou 409 (déjà affectée) ALORS le
   système DOIT afficher un message explicite adapté à chaque cas.
5. QUAND l'utilisateur désaffecte une application ALORS le système DOIT
   appeler l'endpoint correspondant avec confirmation.
6. QUAND l'utilisateur supprime une zone avec des enfants ALORS le système
   DOIT avertir explicitement de la suppression en cascade.

---

### Exigence 13 — Visualisation ArchiMate (lecture seule)

**User Story:** En tant qu'utilisateur, je veux visualiser un diagramme
ArchiMate généré à partir des éléments et relations de mon organisation,
afin d'avoir une vue d'ensemble sans construire le diagramme à la main.

#### Critères d'acceptation

1. QUAND l'utilisateur accède à la Vue ArchiMate ALORS le système DOIT
   appeler `GET /elements-archimate/generate-vue` et afficher le SVG reçu
   dans un composant dédié (implémenté : voir `ArchimateComponent`).
2. Le composant d'affichage DOIT permettre le zoom et le déplacement (pan),
   sans édition possible.
3. SI `elementCount` vaut 0 ALORS le système DOIT afficher l'état vide
   renvoyé par le backend (déjà géré nativement par le SVG généré).
4. SI la requête échoue (erreur 500) ALORS le système DOIT afficher un
   message d'erreur sans bloquer la navigation.
5. QUAND l'utilisateur demande l'export ALORS le système DOIT proposer SVG
   (téléchargement direct du contenu déjà reçu) et PNG (conversion
   côté client via `<canvas>`, sans dépendance serveur supplémentaire) ;
   l'export PDF est une piste d'enrichissement, pas un engagement v1 (pas
   de librairie de rendu PDF ajoutée sans justification).
6. Le temps entre la demande et l'affichage DOIT rester perceptiblement
   instantané pour un jeu de données de la taille de K&B Groupe SARL
   (contrainte déjà satisfaite par la simplicité du rendu SVG).

---

### Exigence 14 — Visualisation urbanisation / POS (lecture seule)

**User Story:** En tant qu'utilisateur, je veux visualiser le plan
d'occupation des sols de mon organisation, afin de voir en un coup d'œil
les zones, quartiers, îlots et les applications qui y sont affectées.

#### Critères d'acceptation

1. QUAND l'utilisateur accède à la Vue urbanisation ALORS le système DOIT
   appeler `GET /zones-urbanisation/generate-vue` et afficher le SVG reçu.
2. Le composant d'affichage DOIT permettre le zoom et le déplacement (pan),
   sans édition possible.
3. SI `zoneCount` vaut 0 ALORS le système DOIT afficher l'état vide,
   renvoyant vers la section Zones (Exigence 12).
4. QUAND l'utilisateur demande l'export ALORS le système DOIT proposer les
   mêmes formats que l'Exigence 13 (SVG direct, PNG côté client).

---

### Exigence 15 — Tableau de bord

**User Story:** En tant qu'utilisateur, je veux un tableau de bord avec des
indicateurs réels sur mon organisation, afin de suivre son activité sans
naviguer dans chaque module.

#### Critères d'acceptation

1. QUAND l'utilisateur accède au tableau de bord ALORS le système DOIT
   afficher des indicateurs réels (nombre d'éléments ArchiMate, de
   relations, d'applications, de zones, de membres) — jamais de données
   inventées ou statiques.
2. Les indicateurs DOIVENT être présentés avec au moins un graphique
   (ex. répartition des éléments par type, criticité des applications) via
   `ng2-charts`.
3. QUAND aucune donnée n'existe encore pour une métrique ALORS le système
   DOIT afficher un état vide plutôt qu'un graphique vide ou une erreur.
4. Le contenu du tableau de bord PEUT différer selon le rôle (ex. un
   Dirigeant voit une synthèse, un Collaborateur voit un sous-ensemble) —
   non bloquant pour une première version qui affiche la même vue à tous
   les rôles.

---

### Exigence 16 — Export du référentiel

**User Story:** En tant qu'Architecte, je veux exporter les données de mon
organisation, afin de les archiver ou de les partager hors de
l'application.

#### Critères d'acceptation

1. QUAND l'utilisateur demande l'export du référentiel ALORS le système
   DOIT proposer un téléchargement JSON contenant les capacités, éléments,
   relations, applications et zones de son organisation.
2. Cet export NE DOIT PAS être confondu avec l'export d'une vue (Exigences
   13/14, qui exportent une image, pas les données brutes).
3. Le système NE DOIT PAS implémenter d'import ou de formats
   d'interopérabilité lourds (ArchiMate Exchange Format, BPMN XML) en v1 —
   hors périmètre sans éditeur graphique en face pour les exploiter.

---

### Exigence 17 — Gestion des erreurs API et retours utilisateur

**User Story:** En tant qu'utilisateur, je veux être informé clairement du
résultat de mes actions, afin de comprendre ce qui s'est passé sans avoir à
lire la console développeur.

#### Critères d'acceptation

1. QUAND une action de création, modification ou suppression réussit ALORS
   le système DOIT afficher une confirmation visuelle brève, sans bloquer
   l'interface.
2. QUAND une requête API échoue avec un code 4xx portant un `message`
   exploitable ALORS le système DOIT afficher ce message tel quel.
3. QUAND une requête API échoue avec un code 500 ALORS le système DOIT
   afficher un message générique sans exposer la réponse brute.
4. QUAND une requête réseau échoue avant d'atteindre l'API ALORS le système
   DOIT le distinguer d'une erreur applicative.
5. Toute action destructrice DOIT systématiquement passer par une
   confirmation explicite avant l'appel API.

---

### Exigence 18 — Exigences non fonctionnelles (architecture frontend)

**User Story:** En tant qu'équipe projet, je veux que le frontend respecte
les contraintes techniques du projet, afin de ne pas introduire de dette ou
de complexité inutile.

#### Critères d'acceptation

1. Le système NE DOIT PAS introduire NgRx — l'état applicatif DOIT être
   porté par des services Angular utilisant `signals` ou du RxJS basique.
2. Le système DOIT centraliser les appels HTTP dans une couche de services
   Angular dédiée (un service par domaine).
3. Le système DOIT joindre le token JWT à chaque requête via un
   intercepteur HTTP Angular unique.
4. Le système NE DOIT PAS introduire de bibliothèque d'éditeur graphique
   (MaxGraph, JointJS, bpmn-js ou équivalent).
5. Le système DOIT cibler Angular 17+ en standalone components.
6. La seule bibliothèque graphique ajoutée est `ng2-charts` (Exigence 15) —
   toute autre dépendance nouvelle doit être justifiée avant ajout.

---

### Exigence 19 — Performance, compatibilité et ergonomie

**User Story:** En tant qu'utilisateur découvrant l'outil, je veux une
application rapide, utilisable sur mon navigateur habituel et
compréhensible sans formation, afin de l'adopter sans friction.

#### Critères d'acceptation

1. QUAND l'utilisateur demande l'affichage d'une vue générée (Exigences 13
   ou 14) ALORS le temps total DOIT rester perceptiblement instantané pour
   un jeu de données de la taille de K&B Groupe SARL.
2. Le système DOIT fonctionner correctement sur les deux dernières versions
   majeures de Chrome, Firefox et Edge.
3. Les formulaires de saisie DOIVENT être utilisables sans formation
   préalable : libellés explicites en français, aide contextuelle sur les
   champs non triviaux, messages d'erreur actionnables.
4. Aucune exigence WCAG/RGAA formelle n'est fixée en v1 ; les bonnes
   pratiques de base (contraste suffisant, labels associés à leurs champs)
   restent attendues par défaut.
5. Le design DOIT respecter la charte bleu/blanc/noir et intégrer le logo
   fourni, avec un rendu responsive (desktop/tablette/mobile).

---

## Traçabilité

| Exigence | Dépendance backend | Statut |
|---|---|---|
| 1 — Authentification et inscription | `POST /auth/register`, `User.organisationId`/`role` | **Backend à construire** |
| 2 — Navigation et layout | — | À faire |
| 3 — Contexte multi-tenant | Guard d'isolation par JWT | **Backend à construire (sécurité critique)** |
| 4 — Organisation courante | `GET/PATCH /organisations/me` | **Backend à construire** |
| 5 — Membres et rôles | CRUD `User` scopé organisation | **Backend à construire** |
| 6 — Services et organigramme | Table `Service`, `ServiceViewService` | **Backend à construire** |
| 7 — Objectifs | Table `Objectif`, CRUD | **Backend à construire** |
| 8 — CRUD Capacités métier | Existant | Backend prêt, frontend à faire |
| 9 — CRUD Éléments ArchiMate | Existant | Backend prêt, frontend à faire |
| 10 — CRUD Relations ArchiMate | Existant | Backend prêt, frontend à faire |
| 11 — CRUD Applications | Existant | Backend prêt, frontend à faire |
| 12 — CRUD Zones + affectation | Existant (validation ÎLOT ajoutée) | Backend prêt, frontend à faire |
| 13 — Visualisation ArchiMate | `ArchimateViewService` | **Backend prêt, frontend fait** (`ArchimateComponent`) |
| 14 — Visualisation urbanisation | `UrbanisationViewService` | Backend prêt, frontend à faire |
| 15 — Tableau de bord | Agrégation de compteurs existants | Frontend à refaire (actuel = données inventées) |
| 16 — Export du référentiel | Nouvel endpoint export JSON | **Backend à construire** |
| 17 — Gestion des erreurs | `HttpExceptionFilter` (existant) | À faire |
| 18 — Non-fonctionnel frontend | — | Partiel (voir analyse du frontend existant) |
| 19 — Performance/compatibilité/ergonomie | — | À faire |

**Hors périmètre de ce document** (voir `docs/cahier.md` sections 1, 5, 8) :
BPMN, éditeur graphique interactif, collaboration temps réel, collaboration
inter-organisations, workflow de validation formel, IA, audit de sécurité
formel (OWASP/WCAG/chiffrement AES-256 — sujets backend/infra de toute
façon).
