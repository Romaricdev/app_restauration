# Base de données — Restaurant Central

Ce dossier contient la **conception** et le **schéma SQL** de la base de données du projet, alignés sur les types, mocks et interfaces frontend existants.

## Fichiers

| Fichier | Description |
|---------|-------------|
| **SCHEMA_DESIGN.md** | Document de conception : entités, champs, correspondance frontend ↔ DB, contraintes, évolutions |
| **schema.sql** | Schéma PostgreSQL exécutable (enums, tables, FK, index, triggers) |
| **seed.sql** | Données initiales : catégories, addons, addon_categories, app_settings |
| **rls.sql** | Politiques RLS : anon SELECT (lecture) + INSERT/UPDATE/DELETE sur tables dashboard |
| **storage.sql** | Politiques RLS Storage : bucket `images` (upload/lecture anon pour formulaires) |
| **migrations/** | Migrations incrémentales (ex. `001_halls_images_array.sql`) |

## Utilisation

### Supabase

1. Créer un projet Supabase.
2. **SQL Editor** → New query.
3. Coller le contenu de `schema.sql` → Run.
4. Coller le contenu de `seed.sql` → Run.
5. Coller le contenu de `rls.sql` → Run (lecture + écriture anon pour le dashboard ; à restreindre avec auth plus tard).
6. **Storage** : Dashboard → Storage → New bucket → nom `images`, Public activé. Puis SQL Editor → coller `storage.sql` → Run (politiques RLS). Les images sont classées par sous-dossier : `products/`, `halls/`, `categories/`, `addons/` (pas de mélange).
7. **Migrations** : Exécuter les scripts dans `migrations/` si besoin :
   - `001_halls_images_array.sql` : `halls.images` TEXT[] (plusieurs images par salle).
   - `002_pos_orders_insert_rls.sql` : INSERT/DELETE sur `orders`, `order_items`, `order_item_addons` pour persistance POS (déjà inclus dans `rls.sql` si appliqué après mise à jour).
   - `005_create_profile_trigger.sql` : Trigger pour créer automatiquement un profil lors de l'inscription.
   - `006_create_admin_helper.sql` : Fonction helper pour créer un admin (vérifie que le compte Auth existe).
   - `007_admins_rls.sql` : Politiques RLS pour la table `admins` (OBLIGATOIRE pour que l'authentification fonctionne).
   - `011_reservation_slots_and_packs.sql` : Tables `reservation_slot_types` et `hall_packs` (types de créneaux + packs tarifaires par salle) + RLS.
   - `011_seed_reservation_slots.sql` : Données initiales réservation salles (créneaux journée pleine / demi-journée, packs, contact). Exécuter après la migration 011.
8. **Créer un administrateur** : Voir `scripts/create_admin.sql` pour les instructions complètes.

### PostgreSQL local

```bash
psql -U postgres -d mess_officiers -f database/schema.sql
psql -U postgres -d mess_officiers -f database/seed.sql
```

### Connexion depuis l’app Next.js

1. Copier `.env.example` en `.env.local`.
2. Remplir `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase Dashboard → Project Settings → API).
3. Lancer `npm install` puis `npm run dev`.
4. Exécuter `rls.sql` dans le SQL Editor si ce n’est pas déjà fait.
5. Tester : `GET /api/health/supabase` doit retourner `{ "ok": true }` si schéma + seed + RLS sont appliqués.
6. Générer les types : `npm run gen:types` (prérequis : `supabase login`, `.env.local` configuré). Écrit `src/lib/supabase/database.types.generated.ts`.

Clients : `@/lib/supabase` (client browser) et `createServerClient()` (server).

### Remarques

- Les **catégories** et **addons** du seed correspondent aux mocks (`menu.ts`, `addons.ts`).
- Les **menu_items** sont en commentaire dans `seed.sql` ; à décommenter si vous voulez pré-remplir le menu.
- **app_settings** reprend les constantes (`constants.ts`, `DELIVERY_CONFIG`, `TIME_SLOTS`, `RESTAURANT_INFO`).
- La table **admins** stocke les administrateurs plateforme (table **autonome**, sans lien avec `profiles`). Voir `SCHEMA_DESIGN.md` § 3.15.
- **Addons** : `addon_categories` a `included_free` (inclus gratuit optionnel) et `extra_price` (supplément payant). `order_item_addons` a `addon_type` (`included` | `extra`).

## Dépendances circulaires

- `restaurant_tables.current_order_id` → `orders.id` : FK ajoutée après création de `orders`.
- `halls.current_reservation_id` → `hall_reservations.id` : idem.

Ces contraintes sont gérées dans `schema.sql` via des `ALTER TABLE` après création des tables cibles.

## Étapes suivantes

1. ~~Intégrer Supabase dans l’app Next.js~~ ✅ (voir « Connexion depuis l’app Next.js »).
2. ~~Remplacer les mocks par des appels Supabase~~ ✅ (`lib/data`, hooks `useData`, pages connectées).
3. Gérer l’authentification (Supabase Auth) et lier `profiles.id` à `auth.users.id` si besoin.
