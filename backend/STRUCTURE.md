# Documentation du Backend — QuartierLink

Backend basé sur **Symfony 7** + **Doctrine ORM** + **Lexik JWT** + **PostgreSQL**.

Ce document explique le rôle de **chaque fichier** du dossier `backend/`.

---

## Table des matières

- [Racine `backend/`](#racine-backend)
- [`backend/bin/`](#backendbin)
- [`backend/public/`](#backendpublic)
- [`backend/config/`](#backendconfig)
- [`backend/migrations/`](#backendmigrations)
- [`backend/src/`](#backendsrc)
  - [`src/Entity/`](#srcentity--modèles-doctrine--tables-bdd)
  - [`src/Enum/`](#srcenum--énumérations-php)
  - [`src/Repository/`](#srcrepository--accès-aux-données)
  - [`src/Controller/`](#srccontroller--endpoints-rest)
- [Flux global](#-vue-densemble-du-flux)

---


## Racine `backend/`

| Fichier | Rôle |
|---|---|
| `composer.json` | Définit les dépendances PHP : Symfony 7, Doctrine ORM, **Lexik JWT** (auth par token), **NelmioCors** (CORS), PasswordHasher, etc. Configure l'autoload PSR-4 `App\ → src/`. |
| `composer.lock` | Versions exactes figées des dépendances installées. |
| `symfony.lock` | Recettes Symfony Flex déjà appliquées. |
| `.env` | Variables d'environnement : `APP_ENV`, `DATABASE_URL` (PostgreSQL local), chemins des clés JWT, passphrase. |
| `.env.dev` | Override du `APP_SECRET` pour le dev. |
| `.gitignore` / `.editorconfig` | Fichiers projet standards. |
| `compose.yaml` + `compose.override.yaml` | Configuration Docker pour lancer un **PostgreSQL 16** en local. |
| `schema.sql` | **Schéma SQL de référence** : crée toutes les tables (`users`, `quartiers`, `membership_requests`, `quartier_members`, `posts`, `messages`). Sert si on installe la base manuellement sans migrations. |
| `create_admin.php` | **Script CLI interactif** pour créer un compte `ADMIN_QUARTIER` (demande prénom/nom/email/mdp en console). Hashe le mot de passe via le service Symfony et l'enregistre directement en DB. |

---

## `backend/bin/`

| Fichier | Rôle |
|---|---|
| `console` | Point d'entrée de la **console Symfony** (`php bin/console …`) pour les commandes (migrations, cache, etc.). |

---

## `backend/public/`

| Fichier | Rôle |
|---|---|
| `index.php` | **Point d'entrée HTTP** unique : bootstrap le `Kernel` Symfony pour toutes les requêtes. |
| `uploads/` | Dossier où sont stockés les justificatifs (`uploads/proofs/`) uploadés par les utilisateurs. |

---

## `backend/config/`

### Racine

| Fichier | Rôle |
|---|---|
| `bundles.php` | Liste les **bundles activés** : FrameworkBundle, SecurityBundle, DoctrineBundle, MigrationsBundle, LexikJWT, NelmioCors. |
| `services.yaml` | Définit l'autowiring des services et expose `app.cli_password_hasher` (alias public du hasher pour le script CLI `create_admin.php`). |
| `routes.yaml` | Charge automatiquement toutes les routes via les **attributs `#[Route]`** des contrôleurs. |
| `preload.php` | Préchargement OPcache en production. |
| `reference.php` | Référence générée (configuration complète Symfony, lecture seule). |

### `config/packages/`

| Fichier | Rôle |
|---|---|
| `doctrine.yaml` | Connexion à PostgreSQL via `DATABASE_URL`, mapping des entités situées dans `src/Entity`. |
| `doctrine_migrations.yaml` | Indique que les migrations sont dans `/migrations`. |
| `security.yaml` | **Configuration de sécurité** : algorithme de hash (auto/bcrypt), provider basé sur `User.email`, firewall `^/api` **stateless en JWT**. `access_control` : `/api/auth` public, `/api/quartiers` GET public, `/api/super-admin` réservé à `ROLE_ADMIN_GENERAL`, le reste exige une authentification. |
| `lexik_jwt_authentication.yaml` | Configure les clés RSA et le TTL du token (1h). |
| `nelmio_cors.yaml` | Autorise les requêtes CORS depuis `http://localhost:3000` (frontend Next.js). |
| `framework.yaml` | Configuration principale Symfony (secret, sessions). |
| `cache.yaml`, `routing.yaml`, `validator.yaml`, `property_info.yaml` | Configurations par défaut Symfony. |

### `config/routes/`

| Fichier | Rôle |
|---|---|
| `framework.yaml` | Active les pages d'erreur en mode dev. |
| `security.yaml` | Route interne pour le logout. |

### `config/jwt/`

Contient les clés RSA (`private.pem` / `public.pem`) utilisées pour **signer et vérifier les JWT**.

---

## `backend/migrations/`

| Fichier | Rôle |
|---|---|
| `Version20260405180343.php` | Migration Doctrine : ajoute la colonne `status` à la table `quartiers` (workflow EN_ATTENTE / ACTIF / REJETE). |
| `sql/upgrade_users_table_postgresql.sql` | Script SQL **manuel** pour mettre à niveau une ancienne base : ajoute les colonnes `firstname`, `lastname`, `password`, etc. et migre les données depuis l'ancien schéma français (`nom`, `mot_de_passe`, `adresse`, `statut_verification`). |

---

## `backend/src/`

### `Kernel.php`

Le **noyau Symfony** : utilise `MicroKernelTrait` pour charger automatiquement bundles, routes et configuration.

---

### `src/Entity/` — Modèles Doctrine (= tables BDD)

| Fichier | Table | Rôle |
|---|---|---|
| `User.php` | `users` | Utilisateur : `firstName`, `lastName`, `email` (unique), `password` (hashé), `address`, `status` (enum vérification), `role` (`USER` / `ADMIN_QUARTIER` / `ADMIN_GENERAL`). Implémente `UserInterface` + `PasswordAuthenticatedUserInterface` pour Symfony Security. `getRoles()` mappe le rôle métier vers les `ROLE_*` Symfony. |
| `Quartier.php` | `quartiers` | Quartier : `name`, `description`, `address`, `adminId` (créateur), `status` (EN_ATTENTE / ACTIF / REJETE). |
| `Membership.php` | `quartier_members` | Lien Membre ↔ Quartier (`userId`, `quartierId`, `joinedAt`). |
| `JoinRequest.php` | `membership_requests` | Demande d'adhésion à un quartier (`userId`, `quartierId`, `status`). |
| `Post.php` | `posts` | Publication dans un quartier (`userId`, `quartierId`, `content`). |
| `Message.php` | `messages` | Message privé 1-à-1 (`senderId`, `receiverId`, `content`). |

---

### `src/Enum/` — Énumérations PHP

| Fichier | Valeurs |
|---|---|
| `VerificationStatus.php` | `NON_VERIFIE`, `EN_ATTENTE`, `VERIFIE` (statut de l'utilisateur). |
| `QuartierStatus.php` | `EN_ATTENTE`, `ACTIF`, `REJETE` (validation par super-admin). |
| `JoinStatus.php` | `EN_ATTENTE`, `ACCEPTEE`, `REFUSEE` (demande d'adhésion). |
| `AddressStatus.php` | `EN_ANALYSE`, `VALIDE`, `REFUSE` (statut d'une adresse — non utilisé actuellement). |

---

### `src/Repository/` — Accès aux données

| Fichier | Rôle |
|---|---|
| `UserRepository.php` | Repository de `User`, implémente `PasswordUpgraderInterface` (rehash auto si l'algo change). |
| `QuartierRepository.php` | Repository basique de `Quartier`. |
| `MembershipRepository.php` | Repository basique de `Membership`. |
| `JoinRequestRepository.php` | `findPendingByQuartierId()` → demandes `EN_ATTENTE` triées par date. |
| `PostRepository.php` | `findByQuartierIds()` (feed multi-quartiers) et `findByQuartierId()` (un seul), triés DESC. |
| `MessageRepository.php` | `findConversation()` (échange A↔B) et `findLastMessagesForUser()` (dernier message par interlocuteur, via une requête SQL native `DISTINCT ON`). |

---

### `src/Controller/` — Endpoints REST

Tous les endpoints retournent du **JSON**. Préfixe commun : `/api`.

#### `AuthController.php` — `/api/auth` (public)

| Route | Action |
|---|---|
| `POST /register` | Inscription : valide les champs, vérifie l'unicité de l'email, hashe le mot de passe, crée un `User` avec rôle `USER`. |
| `POST /login` | Connexion : vérifie email + mdp, génère un **JWT** via Lexik, renvoie token + infos utilisateur. |

#### `UserController.php` — `/api/user` (authentifié)

| Route | Action |
|---|---|
| `GET /me` | Profil de l'utilisateur courant + ses quartiers. |
| `POST /upload-proof` | Upload d'un justificatif d'adresse (JPG/PNG/PDF, max 5 Mo) → bascule le statut en `EN_ATTENTE`. |
| `PUT /profile` | Modifier prénom/nom/adresse. |
| `PUT /password` | Changer le mot de passe (vérifie l'ancien). |
| `GET /members` | Liste tous les voisins (membres des quartiers de l'utilisateur). |

#### `QuartierController.php` — `/api/quartiers`

| Route | Action |
|---|---|
| `GET /` (public) | Liste tous les quartiers **ACTIF**. |
| `GET /{id}` | Détail d'un quartier + nombre de membres. |
| `POST /` | Créer un quartier (statut initial `EN_ATTENTE`) ; le créateur devient automatiquement membre. |
| `POST /{id}/join` | Envoyer une demande d'adhésion (refusée si déjà membre ou déjà demandée). |

#### `PostController.php` — `/api/posts` (authentifié)

| Route | Action |
|---|---|
| `GET /` | **Fil d'actualité** : posts de tous les quartiers de l'utilisateur. |
| `GET /quartier/{id}` | Posts d'un quartier spécifique. |
| `POST /` | Publier un post (uniquement si membre du quartier). |
| `DELETE /{id}` | Supprimer son propre post. |

#### `MessageController.php` — `/api/messages` (authentifié)

| Route | Action |
|---|---|
| `GET /conversations` | Liste des conversations avec dernier message. |
| `GET /{userId}` | Historique complet d'une discussion. |
| `POST /` | Envoyer un message privé. |

#### `AdminController.php` — `/api/admin` (admin du quartier)

| Route | Action |
|---|---|
| `GET /quartier` | Quartier que l'admin gère. |
| `GET /join-requests` | Demandes d'adhésion en attente sur son quartier. |
| `PUT /join-requests/{id}/approve` | Accepter → crée le `Membership`. |
| `PUT /join-requests/{id}/reject` | Refuser. |
| `GET /members` | Liste des membres du quartier (avec rôle CREATEUR / MEMBRE). |
| `DELETE /members/{userId}` | Exclure un membre (sauf le créateur). |
| `GET /verifications` | Utilisateurs en attente de vérification d'adresse. |
| `PUT /verifications/{userId}/approve` ou `/reject` | Valider / refuser une vérification. |

#### `SuperAdminController.php` — `/api/super-admin` (réservé `ROLE_ADMIN_GENERAL`)

| Route | Action |
|---|---|
| `GET /proofs` + approve / reject | Gérer les justificatifs en attente. |
| `GET /quartiers` + approve / reject | **Valider ou rejeter la création** d'un quartier (passe le statut en ACTIF / REJETE). |
| `GET /users` | Liste de tous les utilisateurs du système. |

---

## 🗺️ Vue d'ensemble du flux

```
Requête HTTP
   → public/index.php
   → Kernel
   → security.yaml (JWT)
   → Controller (#[Route])
   → Repository
   → Entity (Doctrine)
   → PostgreSQL
   → JsonResponse renvoyée au frontend (Next.js sur :3000, CORS autorisé)
```

### 3 rôles métier

| Rôle | Accès |
|---|---|
| `USER` | `/api/user`, `/api/quartiers`, `/api/posts`, `/api/messages` |
| `ADMIN_QUARTIER` | + `/api/admin` pour son quartier |
| `ADMIN_GENERAL` | + `/api/super-admin` (validation globale) |

### Modèle de données (relations)

```
User 1───* Membership *───1 Quartier
User 1───* JoinRequest *───1 Quartier
User 1───* Post        *───1 Quartier
User 1───* Message *───1 User   (sender / receiver)
```
