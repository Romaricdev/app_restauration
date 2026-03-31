# Proposition de schéma de base de données — Restaurant Central

> Conçu à partir des **types**, **données mock**, **formulaires** et **stores** existants du frontend.

---

## 1. Vue d’ensemble

### Objectifs
- Refléter les entités et relations déjà utilisées côté frontend
- Supporter le **site public** (menu, panier, checkout, réservations)
- Supporter le **dashboard** (CRUD produits, catégories, menus, tables, salles, commandes, réservations)
- Supporter le **POS** (commandes sur place / à emporter / livraison, addons, cuisine, paiements, factures)
- Supporter les **réservations** (tables et salles)
- Prévoir **authentification** (utilisateurs, rôles) et **paramètres** (frais livraison, etc.)

### Stack cible
- **PostgreSQL** (compatible Supabase)
- UUID pour les identifiants des commandes, réservations, lignes de commande
- SERIAL / identity pour catégories, produits, tables, salles, menus, addons (cohérent avec les mocks)

---

## 2. Correspondance frontend ↔ base de données

| Entité frontend | Table(s) DB | Remarques |
|-----------------|-------------|-----------|
| `Category` | `categories` | id → text (slug) ou uuid selon usage |
| `MenuItem` | `menu_items` | `categoryId` → `category_id` |
| `Addon` | `addons` + `addon_categories` | M2M addon ↔ catégorie |
| `Menu` + `MenuProduct` | `menus` + `menu_products` | |
| `RestaurantTable` | `restaurant_tables` | `currentOrderId` → `current_order_id` |
| `Hall` | `halls` | `amenities` → array ou table dédiée |
| `Order` / POS | `orders` + `order_items` + `order_item_addons` | Statuts + champs paiement/facture |
| `TableReservation` | `table_reservations` | |
| `HallReservation` | `hall_reservations` | |
| `User` | `profiles` | Utilisateurs (auth) |
| Admin | `admins` | Admins plateforme (table autonome, sans lien avec `profiles`) |
| Config (frais, etc.) | `app_settings` | Clé / valeur |

---

## 3. Entités et champs (alignés frontend)

### 3.1 `categories`
- `id` (text, PK) — ex. `entrees`, `plats`
- `name` (text)
- `description` (text, nullable)
- `icon` (text, nullable) — ex. `Salad`, `Flame`
- `display_order` (int)

→ Form : `CategoryFormModal` (name, description, icon, order).

### 3.2 `menu_items`
- `id` (uuid ou serial, PK)
- `category_id` (FK → categories)
- `name`, `description`, `price` (numeric)
- `image` (text, nullable)
- `available` (boolean), `popular` (boolean, nullable)
- `preparation_time` (int, nullable) — minutes

→ Form : `ProductFormModal`.

### 3.3 `addons`
- `id` (text ou uuid, PK)
- `name`, `price` (numeric)
- `available` (boolean)

### 3.4 `addon_categories` (M2M)
- `addon_id`, `category_id` — addon disponible pour une catégorie
- `included_free` (boolean, défaut false) — addon proposé en **inclus gratuit** (optionnel) : le client peut choisir de le mettre ou non.
- `extra_price` (numeric, nullable) — prix du **supplément** quand le client en rajoute ; `NULL` = utiliser `addons.price`.

→ Remplace `Addon.categoryIds: string[]`. Même addon peut être à la fois inclus gratuit (choix oui/non) et supplément payant (quantité additionnelle).

### 3.5 `menus`
- `id` (uuid ou serial, PK)
- `name`, `description` (nullable)
- `type` (enum: `predefined` | `daily`)
- `active` (boolean)
- `created_at`, `updated_at` (timestamptz)

### 3.6 `menu_products`
- `menu_id`, `product_id` (FK → menu_items)
- PK (`menu_id`, `product_id`)

→ Form : `MenuFormModal`. Aucune quantité en ligne / sur place.

### 3.7 `restaurant_tables`
- `id` (serial, PK)
- `number` (int, unique), `capacity` (int)
- `status` (enum: `available` | `occupied` | `reserved`)
- `current_order_id` (uuid, nullable, FK → orders)
- `qr_slug` (text, unique, nullable) — pour `/table/[id]` (id = number ou slug)

→ Form : `TableFormModal`.

### 3.8 `halls`
- `id` (serial, PK)
- `name`, `description` (nullable), `capacity` (int)
- `amenities` (text[]) — ex. `['Sonorisation','Projecteur']`
- `image` (text, nullable)
- `status` (enum: `available` | `occupied` | `maintenance`)
- `current_reservation_id` (uuid, nullable)

→ Form : `HallFormModal`.

### 3.9 `orders`
Champs couvrant **Order** (dashboard) + **PosOrder** / **PaidOrder** :

- `id` (uuid, PK)
- `type` (enum: `dine-in` | `takeaway` | `delivery`)
- `status` (enum: `pending` | `confirmed` | `preparing` | `ready` | `delivered` | `cancelled`)
- `kitchen_status` (enum: `pending` | `preparing` | `ready` | `served`, nullable) — POS/cuisine
- `table_id` (FK → restaurant_tables, nullable)
- `table_number` (int, nullable) — dénormalisé pour affichage
- `customer_name`, `customer_phone` (text)
- `customer_email` (text, nullable)
- `customer_address` (text, nullable) — livraison
- `subtotal`, `total` (numeric)
- `delivery_fee` (numeric, nullable)
- `service_fee` (numeric, nullable) — si on persiste la part fixe/calculée
- `payment_method` (enum: `cash` | `card` | `mobile`, nullable)
- `created_at`, `updated_at` (timestamptz)
- `validated_at` (timestamptz, nullable) — passage en cuisine
- `paid_at` (timestamptz, nullable)
- `invoice_number` (text, unique, nullable) — ex. `FAC-20260123-0001`
- `amount_received`, `change` (numeric, nullable) — espèce
- `source` (enum: `pos` | `online`, default `pos`) — origine commande
- `notes` (text, nullable)

### 3.10 `order_items`
- `id` (uuid, PK)
- `order_id` (FK → orders)
- `menu_item_id` (FK → menu_items)
- `name`, `price` (numeric), `quantity` (int)
- `notes` (text, nullable)
- `image` (text, nullable)

### 3.11 `order_item_addons`
- `id` (uuid, PK)
- `order_item_id` (FK → order_items)
- `addon_id` (FK → addons)
- `addon_type` (enum: `included` | `extra`) — **included** = inclus gratuit (optionnel), **extra** = supplément payant.
- `name`, `price` (numeric), `quantity` (int) — dénormalisés pour historique
- UNIQUE (`order_item_id`, `addon_id`, `addon_type`) — on peut avoir une ligne « inclus » et une « extra » pour le même addon.

Pour **included** : `price` = 0, `quantity` = 1. Pour **extra** : `price` = `extra_price` ou `addons.price`, `quantity` ≥ 1.

### 3.12 `table_reservations`
- `id` (uuid, PK)
- `customer_name`, `customer_phone` (text)
- `customer_email` (text, nullable)
- `date` (date), `time` (time)
- `party_size` (int)
- `table_number` (int, nullable) — affectation optionnelle
- `notes` (text, nullable)
- `status` (enum: `pending` | `confirmed` | `cancelled`)
- `created_at` (timestamptz)

→ Form : `ReservationForm` (fullName → customer_name, etc.).

### 3.13 `hall_reservations`
- `id` (uuid, PK)
- `hall_id` (FK → halls)
- `customer_name`, `customer_phone` (text)
- `customer_email`, `organization` (text, nullable)
- `start_date`, `end_date` (date)
- `event_type` (text, nullable)
- `expected_guests` (int, nullable)
- `notes` (text, nullable)
- `status` (enum: `pending` | `confirmed` | `cancelled`)
- `created_at` (timestamptz)

→ Form : `HallReservationForm`.

### 3.14 `profiles` (utilisateurs / auth)
- `id` (uuid, PK, aligné Supabase Auth si utilisé)
- `name`, `email` (unique)
- `role` (enum: `admin` | `manager` | `staff` | `customer`)
- `avatar_url` (text, nullable)
- `created_at`, `updated_at` (timestamptz)

### 3.15 `admins` (administrateurs plateforme — table autonome)
Table **séparée** de `profiles` : tous les champs sont dans `admins`, aucun lien avec les utilisateurs.

- `id` (uuid, PK)
- `name` (text) — nom de l’admin
- `email` (text, unique) — email de connexion
- `avatar_url` (text, nullable)
- `is_super_admin` (boolean, défaut false) — accès total vs permissions ciblées
- `permissions` (jsonb, défaut `[]`) — droits optionnels, ex. `["orders", "menus", "settings"]`
- `last_login_at` (timestamptz, nullable)
- `created_at`, `updated_at` (timestamptz)

Authentification des admins : à gérer à part (Supabase Auth dédié, table `auth_user_id` optionnelle, ou auth custom). Aucune FK vers `profiles`.

### 3.16 `app_settings`
- `key` (text, PK)
- `value` (jsonb ou text)

Exemples : `delivery_fee` (1500), `service_fee_rate` (0.1), `service_fee_min` (500), `default_delivery_fee` (1000).

---

## 4. Contraintes et index recommandés

- `orders.invoice_number` : UNIQUE, uniquement si non NULL
- `restaurant_tables.number` : UNIQUE
- Index sur `orders(created_at)`, `orders(status)`, `orders(table_id)`
- Index partiel sur `admins(is_super_admin)` pour les super-admins
- Index sur `table_reservations(date, time)`, `hall_reservations(hall_id, start_date, end_date)`
- Index sur `order_items(order_id)`, `order_item_addons(order_item_id)`

---

## 5. Règles métier à implémenter en base ou en API

1. **Numéro de facture** : séquence par jour, ex. `FAC-YYYYMMDD-0001` (trigger ou API).
2. **Statut table** : mise à jour de `restaurant_tables.status` et `current_order_id` lors de création/annulation de commande sur place.
3. **Statut salle** : idem pour `halls` et `hall_reservations` (confirmé = occupé sur la plage de dates).
4. **Paiement** : remplir `paid_at`, `payment_method`, `invoice_number`, `amount_received`, `change` lors du paiement POS.
5. **Addons inclus / supplément** : respecter `addon_categories.included_free` et `extra_price`. Enregistrer chaque choix en `order_item_addons` avec `addon_type` = `included` (gratuit, optionnel) ou `extra` (payant).

---

## 6. Évolutions possibles

- **QR codes** : stocker `qr_code_url` ou `qr_slug` dans `restaurant_tables` pour `/table/[id]`.
- **Paiements en ligne** : table `payments` (order_id, provider, external_id, amount, status).
- **Historique cuisine** : conserver `kitchen_status` et timestamps dans `orders` ; vues ou table dédiée si besoin d’audit détaillé.
- **Notifications** : table `notifications` (user_id, type, payload, read_at).

---

## 7. Fichiers du dossier `database/`

- `SCHEMA_DESIGN.md` — ce document
- `schema.sql` — schéma PostgreSQL exécutable (tables, enums, FK, index, triggers)
- `seed.sql` — données initiales : catégories, addons, addon_categories, app_settings ; menu_items en commentaire
- `README.md` — mode d’emploi (Supabase, PostgreSQL local)

Vous pouvez exécuter `schema.sql` puis `seed.sql` dans Supabase (SQL Editor) ou via migrations.
