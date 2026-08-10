# Cahier de charge technique — ArchiVision

## 1. Objectif du document

Ce document formalise le cahier de charge technique de la version v1 d'ArchiVision, à partir de la vision produit fusionnée, de la documentation technique et du référentiel métier validés pour le projet. Il sert de base de référence pour la conception, le développement, les tests et la validation de la solution.

## 2. Objectif du produit

ArchiVision est une plateforme multi-organisations de modélisation d’architecture d’entreprise. Elle permet à une organisation de documenter son architecture métier, applicative et organisationnelle dans un référentiel unique, puis de générer automatiquement des vues synthétiques (organigramme, vue ArchiMate, Plan d’Occupation des Sols) à partir de données structurées.

Le produit ne doit pas être un outil de dessin libre. Son cœur est la qualité du référentiel et la génération automatique de vues cohérentes.

## 3. Périmètre fonctionnel v1

### 3.1 Inclusions

Le périmètre v1 couvre :

- l’inscription et la création d’une organisation ;
- l’authentification des utilisateurs avec JWT ;
- la gestion des membres et des rôles par organisation ;
- la gestion des services organisationnels et de leur hiérarchie ;
- la gestion des objectifs stratégiques ;
- la gestion des capacités métier ;
- la gestion des éléments ArchiMate et de leurs relations ;
- la gestion du portefeuille applicatif ;
- la gestion de l’urbanisation (zones, quartiers, îlots, affectations) ;
- la génération de vues SVG à partir du référentiel ;
- l’export du référentiel au format JSON ;
- un tableau de bord avec indicateurs clés.

### 3.2 Exclusions explicites

Le périmètre v1 exclut :

- l’éditeur graphique interactif ;
- le BPMN ;
- la collaboration temps réel ;
- la gouvernance avancée et workflow de validation ;
- le multi-tenant technique au sens de partage de données entre organisations sans isolation applicative ;
- l’intégration SSO/oidc ;
- les exports PDF/Word avancés ;
- les architectures distribuées et les composants worker/realtime.

## 4. Exigences fonctionnelles

### FR1 — Authentification et comptes utilisateurs

L’application doit permettre :

- l’inscription d’un utilisateur avec email, mot de passe et nom ;
- la création automatique d’une organisation au moment de l’inscription ;
- la connexion avec JWT ;
- l’accès au profil utilisateur connecté ;
- la mise à jour du profil utilisateur.

### FR2 — Gestion des organisations

L’application doit permettre :

- la consultation des informations d’une organisation ;
- la mise à jour des métadonnées de l’organisation ;
- la gestion des membres attachés à cette organisation.

### FR3 — Gestion des rôles et services

L’application doit permettre :

- la gestion des rôles suivants : Architecte, Dirigeant, Représentant, Collaborateur ;
- l’affectation d’un utilisateur à un service organisationnel ;
- la gestion d’une hiérarchie de services (Direction > Département > Service).

### FR4 — Stratégie et objectifs

L’application doit permettre :

- la création, consultation, modification et suppression d’objectifs ;
- le rattachement des objectifs à l’organisation courante.

### FR5 — Architecture métier

L’application doit permettre :

- la gestion des capacités métier ;
- la gestion des éléments ArchiMate selon 5 types autorisés : ACTEUR_METIER, ROLE_METIER, PROCESSUS_METIER, SERVICE_METIER, OBJET_METIER ;
- la gestion des relations ArchiMate selon 4 types autorisés : ASSIGNATION, COMPOSITION, REALISATION, ASSOCIATION ;
- la génération d’une vue ArchiMate au format SVG à partir du référentiel.

### FR6 — Portefeuille applicatif

L’application doit permettre :

- la création, consultation, modification et suppression d’applications ;
- la définition de la criticité d’une application : HAUTE, MOYENNE, BASSE ;
- la gestion de la relation entre applications et zones d’urbanisation.

### FR7 — Urbanisation

L’application doit permettre :

- la création de zones, quartiers et îlots ;
- la gestion d’une hiérarchie Zone > Quartier > Îlot ;
- l’affectation d’une application à un îlot ;
- la génération du Plan d’Occupation des Sols au format SVG.

### FR8 — Vues générées et exports

L’application doit permettre :

- l’affichage de vues générées à partir des données du référentiel ;
- l’export des vues sous forme SVG/PNG ;
- l’export du référentiel au format JSON.

### FR9 — Tableau de bord

Le tableau de bord doit afficher :

- le nombre d’éléments du référentiel ;
- le nombre d’applications ;
- le nombre de zones ;
- le nombre de membres ;
- une activité récente ou un état synthétique des données.

## 5. Exigences techniques

### 5.1 Architecture générale

L’application doit être développée selon une architecture monorepo avec :

- un frontend Angular pour l’interface utilisateur ;
- un backend NestJS pour la logique métier et l’API REST ;
- une base PostgreSQL avec Prisma comme ORM ;
- des modules métier découplés par domaine.

### 5.2 Sécurité

Les exigences de sécurité sont les suivantes :

- toutes les routes sensibles doivent être protégées par JWT ;
- l’identifiant d’organisation de l’utilisateur doit être porté par le JWT et non par un paramètre client modifiable ;
- les données d’une organisation ne doivent jamais être accessibles à une autre organisation ;
- les entrées doivent être validées côté backend avec des DTO et des règles de validation ;
- les erreurs doivent être normalisées et ne pas exposer de détails internes ;
- les en-têtes HTTP doivent être sécurisés via Helmet.

### 5.3 Performance et robustesse

- le temps de réponse attendu pour les écrans CRUD simples doit rester acceptable sur un environnement de démonstration ;
- la génération des vues SVG doit être déterministe et indépendante d’un rendu graphique tiers ;
- les opérations doivent être résistantes aux erreurs métier et retourner des messages explicites.

### 5.4 Maintenabilité

- le code doit respecter la séparation des responsabilités par domaine ;
- les modules doivent être testables unitairement et via des tests d’intégration ;
- la documentation technique doit rester synchronisée avec l’implémentation.

## 6. Stack technique retenue

| Domaine | Choix retenu | Notes |
|---|---|---|
| Frontend | Angular 17+ | Interface responsive et composants métier structurés |
| Backend | NestJS | API REST, modules par domaine |
| Langage | TypeScript | Strict mode recommandé |
| Base de données | PostgreSQL 15 | Source de vérité relationnelle |
| ORM | Prisma | Schéma versionné et migrations |
| Auth | JWT | Basé sur un utilisateur connecté et son organisation |
| Graphiques | Chart.js | Pour les indicateurs du tableau de bord |
| Conteneurisation | Docker + Docker Compose | Déploiement local et démonstration |
| Tests | Jest + Supertest | Tests unitaires et API |

## 7. Modèle de données principal

Le référentiel doit être la source unique de vérité. Les vues doivent être générées à partir de ce référentiel et non stockées séparément.

### Entités principales

- Organisation
- User
- Service
- Objectif
- CapaciteMetier
- ElementArchimate
- RelationArchimate
- Application
- ZoneUrbanisation
- ApplicationZone

### Règles de conception data

- chaque entité doit être rattachée à une organisation ;
- les relations doivent être explicitement modélisées en base ;
- il ne faut pas dupliquer une information dans plusieurs tables ;
- les vues doivent être dérivées des objets métier et non saisies manuellement.

## 8. Spécification API

### 8.1 Conventions

- les ressources doivent utiliser des noms au pluriel ;
- les routes doivent respecter les verbes HTTP standards ;
- les réponses JSON doivent exposer les identifiants de référence et non des doublons d’objets ;
- les actions non CRUD doivent rester exceptionnelles et être nommées explicitement.

### 8.2 Principaux modules API

- Auth : `/auth/login`, `/auth/register`, `/auth/me`
- Organisations : `/organisations`
- Membres : `/organisations/:id/membres`
- Services : `/services`
- Objectifs : `/objectifs`
- Capacités métier : `/capacites-metier`
- Éléments ArchiMate : `/elements-archimate`
- Relations ArchiMate : `/relations-archimate`
- Applications : `/applications`
- Zones d’urbanisation : `/zones-urbanisation`
- Vues générées : `/elements-archimate/generate-vue`, `/zones-urbanisation/generate-vue`

## 9. Exigences UX/UI

L’interface doit respecter les règles suivantes :

- une navigation claire via une sidebar ;
- un design sobre basé sur une charte bleu/blanc/noir ;
- une expérience responsive sur desktop et tablette ;
- des écrans de gestion structurés avec formulaires dédiés ;
- un affichage des vues générées en lecture seule, sans édition manuelle.

## 10. Critères de validation

La solution sera considérée comme livrée lorsque :

- l’application démarre correctement en environnement local ;
- l’authentification et la création d’organisation fonctionnent ;
- les modules principaux du référentiel sont CRUD et testés ;
- les vues générées s’affichent correctement ;
- l’isolation par organisation est respectée ;
- les tests unitaires et d’intégration passent ;
- la documentation technique et le README sont à jour.

## 11. Livrables attendus

- application backend fonctionnelle ;
- interface frontend minimale mais exploitable ;
- base de données versionnée ;
- seed de données initiales ;
- tests automatisés ;
- documentation technique et procédure de lancement.

## 12. Délais et priorités

Priorité 1 : fiabiliser le socle backend et l’isolation par organisation.

Priorité 2 : livrer les modules métier essentiels et les vues générées.

Priorité 3 : finaliser le frontend, le tableau de bord et les éléments de qualité.

## 13. Hors périmètre de cette version

- éditeur BPMN ;
- collaboration temps réel ;
- workflows complexes ;
- analyses de gap avancées ;
- exports Word/PDF métier avancés ;
- déploiement cloud complexe ou orchestration Kubernetes.
