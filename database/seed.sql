-- ============================================
-- Restaurant Central — Données initiales
-- Exécuter après schema.sql
-- ============================================

-- ============================================
-- CATEGORIES (aligné mock menu.ts)
-- ============================================

INSERT INTO categories (id, name, description, icon, display_order) VALUES
  ('entrees', 'Entrées', 'Commencez votre repas', 'Salad', 1),
  ('plats', 'Plats principaux', 'Nos spécialités', 'UtensilsCrossed', 2),
  ('grillades', 'Grillades', 'Viandes grillées', 'Flame', 3),
  ('poissons', 'Poissons', 'Fraîcheur de la mer', 'Fish', 4),
  ('desserts', 'Desserts', 'Douceurs sucrées', 'Cake', 5),
  ('boissons', 'Boissons', 'Rafraîchissements', 'Wine', 6)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- APP SETTINGS (aligné constants.ts + cart-store)
-- ============================================

INSERT INTO app_settings (key, value) VALUES
  ('delivery_fee', to_jsonb(1500::int)),
  ('service_fee_rate', to_jsonb(0.1::numeric)),
  ('service_fee_min', to_jsonb(500::int)),
  ('time_slots', '["11:30","12:00","12:30","13:00","13:30","14:00","19:00","19:30","20:00","20:30","21:00","21:30"]'::jsonb),
  ('restaurant_name', to_jsonb('Restaurant Central'::text)),
  ('restaurant_address', to_jsonb('Quartier Général, Yaoundé'::text)),
  ('restaurant_phone', to_jsonb('+237 6XX XXX XXX'::text)),
  ('restaurant_email', to_jsonb('contact@messofficiers.cm'::text))
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ============================================
-- ADDONS (aligné mock addons.ts)
-- ============================================

INSERT INTO addons (id, name, price, available) VALUES
  ('addon-mayo', 'Mayonnaise', 200, true),
  ('addon-ketchup', 'Ketchup', 150, true),
  ('addon-moutarde', 'Moutarde', 150, true),
  ('addon-piment', 'Piment', 100, true),
  ('addon-frites', 'Supplément frites', 500, true),
  ('addon-riz', 'Supplément riz', 500, true),
  ('addon-citron', 'Citron', 100, true),
  ('addon-tartare', 'Sauce tartare', 300, true),
  ('addon-glacons', 'Glaçons', 0, true),
  ('addon-sucre', 'Sucre', 0, true),
  ('addon-chantilly', 'Chantilly', 300, true),
  ('addon-chocolat', 'Sauce chocolat', 250, true),
  ('addon-fruits', 'Fruits frais', 400, true),
  ('addon-glace', 'Boule de glace', 500, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- ADDON_CATEGORIES (M2M, included_free, extra_price)
-- included_free = proposé en inclus gratuit (client oui/non)
-- extra_price = prix du supplément (NULL = addons.price)
-- ============================================

INSERT INTO addon_categories (addon_id, category_id, included_free, extra_price) VALUES
  ('addon-mayo', 'grillades', true, NULL), ('addon-mayo', 'plats', true, NULL),
  ('addon-ketchup', 'grillades', true, NULL), ('addon-ketchup', 'plats', true, NULL),
  ('addon-moutarde', 'grillades', true, NULL), ('addon-moutarde', 'plats', true, NULL),
  ('addon-piment', 'grillades', true, NULL), ('addon-piment', 'plats', true, NULL), ('addon-piment', 'poissons', true, NULL),
  ('addon-frites', 'grillades', false, NULL), ('addon-frites', 'plats', false, NULL),
  ('addon-riz', 'grillades', false, NULL), ('addon-riz', 'plats', false, NULL), ('addon-riz', 'poissons', false, NULL),
  ('addon-citron', 'poissons', true, NULL), ('addon-citron', 'boissons', true, NULL),
  ('addon-tartare', 'poissons', false, NULL),
  ('addon-glacons', 'boissons', true, NULL), ('addon-sucre', 'boissons', true, NULL),
  ('addon-chantilly', 'desserts', false, NULL), ('addon-chocolat', 'desserts', false, NULL),
  ('addon-fruits', 'desserts', false, NULL), ('addon-glace', 'desserts', false, NULL)
ON CONFLICT (addon_id, category_id) DO UPDATE SET
  included_free = EXCLUDED.included_free,
  extra_price = EXCLUDED.extra_price;

-- ============================================
-- MENU ITEMS (optionnel — extrait mock menu.ts)
-- Décommenter et adapter si vous souhaitez pré-remplir le menu.
-- ============================================


INSERT INTO menu_items (category_id, name, description, price, available, popular, preparation_time) VALUES
  ('entrees', 'Salade du Chef', 'Laitue fraîche, tomates cerises, avocat, poulet grillé et sauce maison', 4500, true, true, 10),
  ('entrees', 'Soupe de poisson', 'Soupe traditionnelle aux fruits de mer et épices locales', 3500, true, false, 15),
  ('entrees', 'Accras de morue', 'Beignets de morue croustillants servis avec sauce piquante', 3000, true, false, 12),
  ('plats', 'Poulet DG', 'Poulet sauté aux plantains, légumes et sauce tomate épicée', 7500, true, true, 25),
  ('plats', 'Ndolé', 'Feuilles amères aux crevettes et viande, accompagné de plantains', 8000, true, false, 30),
  ('plats', 'Riz sauté aux crevettes', 'Riz parfumé sauté avec crevettes géantes et légumes frais', 7000, true, false, 20),
  ('grillades', 'Brochettes mixtes', 'Assortiment de brochettes bœuf, poulet et porc, sauce arachide', 9000, true, true, 20),
  ('grillades', 'Côtelettes d''agneau', 'Côtelettes grillées aux herbes, purée de pommes de terre', 12000, true, false, 25),
  ('grillades', 'Entrecôte grillée', 'Entrecôte de bœuf 300g, frites maison et salade', 15000, true, false, 20),
  ('poissons', 'Tilapia braisé', 'Tilapia entier braisé, bananes plantains et sauce tomate', 8500, true, true, 30),
  ('poissons', 'Gambas à l''ail', 'Gambas géantes sautées à l''ail et persil, riz basmati', 14000, true, false, 18),
  ('poissons', 'Filet de capitaine', 'Filet de capitaine grillé, légumes vapeur et sauce citron', 11000, false, false, 22),
  ('desserts', 'Fondant au chocolat', 'Gâteau au chocolat coulant, glace vanille', 3500, true, true, 12),
  ('desserts', 'Salade de fruits frais', 'Assortiment de fruits tropicaux de saison', 2500, true, false, 5),
  ('desserts', 'Crème brûlée', 'Crème onctueuse à la vanille, caramélisée', 3000, true, false, 8),
  ('boissons', 'Jus de fruits frais', 'Orange, ananas, mangue ou passion', 1500, true, false, 5),
  ('boissons', 'Bissap', 'Boisson traditionnelle à l''hibiscus, servie fraîche', 1000, true, true, 2),
  ('boissons', 'Bière locale', 'Castel, 33 Export ou Beaufort (33cl)', 1500, true, false, 1),
  ('boissons', 'Vin rouge (verre)', 'Sélection du sommelier', 3500, true, false, 1),
  ('boissons', 'Eau minérale', 'Tangui ou Source (50cl)', 800, true, false, 1);

