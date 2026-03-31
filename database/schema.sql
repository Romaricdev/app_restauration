-- ============================================
-- Restaurant Central — Schéma PostgreSQL
-- Compatible Supabase / PostgreSQL 15+
-- ============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE order_type AS ENUM ('dine-in', 'takeaway', 'delivery');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled');
CREATE TYPE kitchen_order_status AS ENUM ('pending', 'preparing', 'ready', 'served');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'mobile');
CREATE TYPE order_source AS ENUM ('pos', 'online');
CREATE TYPE table_status AS ENUM ('available', 'occupied', 'reserved');
CREATE TYPE hall_status AS ENUM ('available', 'occupied', 'maintenance');
CREATE TYPE menu_type AS ENUM ('predefined', 'daily');
CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'cancelled');
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'staff', 'customer');
CREATE TYPE addon_type AS ENUM ('included', 'extra');

-- ============================================
-- CATEGORIES
-- ============================================

CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- MENU ITEMS (Produits)
-- ============================================

CREATE TABLE menu_items (
  id SERIAL PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  image TEXT,
  available BOOLEAN NOT NULL DEFAULT true,
  popular BOOLEAN DEFAULT false,
  preparation_time INTEGER CHECK (preparation_time IS NULL OR preparation_time > 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_menu_items_available ON menu_items(available) WHERE available = true;

-- ============================================
-- ADDONS & ADDON_CATEGORIES (M2M)
-- ============================================

CREATE TABLE addons (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE addon_categories (
  addon_id TEXT NOT NULL REFERENCES addons(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  included_free BOOLEAN NOT NULL DEFAULT false,
  extra_price NUMERIC(12, 2) CHECK (extra_price IS NULL OR extra_price >= 0),
  PRIMARY KEY (addon_id, category_id)
);

COMMENT ON COLUMN addon_categories.included_free IS 'Addon proposé en inclus gratuit (optionnel) à la commande. Le client peut choisir de le mettre ou non.';
COMMENT ON COLUMN addon_categories.extra_price IS 'Prix du supplément quand le client en rajoute. NULL = utiliser addons.price.';

CREATE INDEX idx_addon_categories_category ON addon_categories(category_id);

-- ============================================
-- MENUS & MENU_PRODUCTS
-- ============================================

CREATE TABLE menus (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type menu_type NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE menu_products (
  menu_id INTEGER NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  PRIMARY KEY (menu_id, product_id)
);

CREATE INDEX idx_menu_products_product ON menu_products(product_id);

-- ============================================
-- RESTAURANT TABLES
-- ============================================

CREATE TABLE restaurant_tables (
  id SERIAL PRIMARY KEY,
  number INTEGER NOT NULL UNIQUE CHECK (number > 0),
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  status table_status NOT NULL DEFAULT 'available',
  current_order_id UUID,
  qr_slug TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- FK circular: orders -> tables, tables -> current_order_id -> orders
-- On crée la contrainte après la table orders.

-- ============================================
-- HALLS
-- ============================================

CREATE TABLE halls (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  amenities TEXT[] DEFAULT '{}',
  image TEXT,
  status hall_status NOT NULL DEFAULT 'available',
  current_reservation_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- FK current_reservation_id ajoutée après hall_reservations.

-- ============================================
-- ORDERS
-- ============================================

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type order_type NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  kitchen_status kitchen_order_status,
  table_id INTEGER REFERENCES restaurant_tables(id) ON DELETE SET NULL,
  table_number INTEGER,
  party_size INTEGER,
  served_at TIMESTAMPTZ,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_address TEXT,
  subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
  delivery_fee NUMERIC(12, 2) DEFAULT 0 CHECK (delivery_fee >= 0),
  service_fee NUMERIC(12, 2) DEFAULT 0 CHECK (service_fee >= 0),
  total NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
  payment_method payment_method,
  validated_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  invoice_number TEXT UNIQUE,
  amount_received NUMERIC(12, 2),
  change_amount NUMERIC(12, 2),
  source order_source NOT NULL DEFAULT 'pos',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_table_id ON orders(table_id) WHERE table_id IS NOT NULL;
CREATE INDEX idx_orders_paid_at ON orders(paid_at) WHERE paid_at IS NOT NULL;
CREATE UNIQUE INDEX idx_orders_invoice_unique ON orders(invoice_number) WHERE invoice_number IS NOT NULL;

-- FK tables -> current_order_id
ALTER TABLE restaurant_tables
  ADD CONSTRAINT fk_tables_current_order
  FOREIGN KEY (current_order_id) REFERENCES orders(id) ON DELETE SET NULL;

-- ============================================
-- ORDER ITEMS & ADDONS
-- ============================================

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  notes TEXT,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE order_item_addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  addon_id TEXT NOT NULL REFERENCES addons(id) ON DELETE RESTRICT,
  addon_type addon_type NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (order_item_id, addon_id, addon_type)
);

COMMENT ON COLUMN order_item_addons.addon_type IS 'included = inclus gratuit (optionnel), extra = supplément payant.';

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_item_addons_item ON order_item_addons(order_item_id);

-- ============================================
-- TABLE RESERVATIONS
-- ============================================

CREATE TABLE table_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  party_size INTEGER NOT NULL CHECK (party_size > 0),
  table_number INTEGER,
  notes TEXT,
  status reservation_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_table_reservations_date_time ON table_reservations(date, time);
CREATE INDEX idx_table_reservations_status ON table_reservations(status);

-- ============================================
-- HALL RESERVATIONS
-- ============================================

CREATE TABLE hall_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hall_id INTEGER NOT NULL REFERENCES halls(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  organization TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  event_type TEXT,
  expected_guests INTEGER CHECK (expected_guests IS NULL OR expected_guests > 0),
  notes TEXT,
  status reservation_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_hall_res_dates CHECK (end_date >= start_date)
);

CREATE INDEX idx_hall_reservations_hall_dates ON hall_reservations(hall_id, start_date, end_date);
CREATE INDEX idx_hall_reservations_status ON hall_reservations(status);

-- FK halls -> current_reservation_id
ALTER TABLE halls
  ADD CONSTRAINT fk_halls_current_reservation
  FOREIGN KEY (current_reservation_id) REFERENCES hall_reservations(id) ON DELETE SET NULL;

-- ============================================
-- RESERVATION SALLES — Types de créneaux + Packs
-- ============================================

CREATE TABLE reservation_slot_types (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  horaires TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE hall_packs (
  id SERIAL PRIMARY KEY,
  hall_id INTEGER NOT NULL REFERENCES halls(id) ON DELETE CASCADE,
  slot_type_slug TEXT NOT NULL,
  name TEXT,
  description TEXT,
  cost_label TEXT NOT NULL,
  cost_amount NUMERIC(12, 2),
  observations TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (hall_id, slot_type_slug, display_order)
);

CREATE INDEX idx_reservation_slot_types_slug ON reservation_slot_types(slug);
CREATE INDEX idx_hall_packs_hall_slot ON hall_packs(hall_id, slot_type_slug);

-- ============================================
-- USERS / PROFILES (auth)
-- ============================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'customer',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ADMINS (administrateurs plateforme — table autonome)
-- ============================================

CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  is_super_admin BOOLEAN NOT NULL DEFAULT false,
  permissions JSONB DEFAULT '[]',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_admins_super ON admins(is_super_admin) WHERE is_super_admin = true;

-- ============================================
-- APP SETTINGS
-- ============================================

CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

-- ============================================
-- TRIGGERS updated_at
-- ============================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_categories_updated_at
  BEFORE UPDATE ON categories FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER tr_menu_items_updated_at
  BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER tr_addons_updated_at
  BEFORE UPDATE ON addons FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER tr_menus_updated_at
  BEFORE UPDATE ON menus FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER tr_restaurant_tables_updated_at
  BEFORE UPDATE ON restaurant_tables FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER tr_halls_updated_at
  BEFORE UPDATE ON halls FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER tr_orders_updated_at
  BEFORE UPDATE ON orders FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER tr_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER tr_admins_updated_at
  BEFORE UPDATE ON admins FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

