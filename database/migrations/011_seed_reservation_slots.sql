-- ============================================
-- Seed : types de créneaux, salles (si besoin), packs, contact réservation
-- Données alignées sur reservation_mess_officiers.json
-- Exécuter après 011_reservation_slots_and_packs.sql
-- ============================================

-- 1. Types de créneaux
INSERT INTO reservation_slot_types (slug, name, horaires, display_order) VALUES
  ('journee_pleine', 'Journée pleine', 'De 8H à 8H le lendemain', 1),
  ('demi_journee', 'Demi-journée', 'De 8H à 13H ou de 14H à 18H', 2)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  horaires = EXCLUDED.horaires,
  display_order = EXCLUDED.display_order;

-- 2. Salles (si pas déjà présentes)
INSERT INTO halls (name, description, capacity, status)
SELECT 'Salle Principale', 'Salle principale du Restaurant Central', 300, 'available'
WHERE NOT EXISTS (SELECT 1 FROM halls WHERE name = 'Salle Principale');

INSERT INTO halls (name, description, capacity, status)
SELECT 'Salle Annexe', 'Salle annexe du Restaurant Central', 150, 'available'
WHERE NOT EXISTS (SELECT 1 FROM halls WHERE name = 'Salle Annexe');

-- 3. Packs Journée pleine - Salle Principale (hall_id récupéré par nom)
INSERT INTO hall_packs (hall_id, slot_type_slug, name, description, cost_label, cost_amount, display_order)
SELECT h.id, 'journee_pleine', 'Pack Alpha', 'Salle vide : non équipée, non décorée, sécurité offerte', '300 000 FCFA', 300000, 1 FROM halls h WHERE h.name = 'Salle Principale' LIMIT 1
ON CONFLICT (hall_id, slot_type_slug, display_order) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, cost_label = EXCLUDED.cost_label, cost_amount = EXCLUDED.cost_amount;

INSERT INTO hall_packs (hall_id, slot_type_slug, name, description, cost_label, cost_amount, display_order)
SELECT h.id, 'journee_pleine', 'Pack Bravo', 'Salle + chaises + tables + couvert + sono + sécurité offerte', 'À négocier avec le prestataire agréé', NULL, 2 FROM halls h WHERE h.name = 'Salle Principale' LIMIT 1
ON CONFLICT (hall_id, slot_type_slug, display_order) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, cost_label = EXCLUDED.cost_label, cost_amount = EXCLUDED.cost_amount;

INSERT INTO hall_packs (hall_id, slot_type_slug, name, description, cost_label, cost_amount, display_order)
SELECT h.id, 'journee_pleine', 'Pack Charlie', 'Salle + chaises + tables + couvert + sono + traiteur + sécurité offerte', 'À négocier avec le prestataire agréé', NULL, 3 FROM halls h WHERE h.name = 'Salle Principale' LIMIT 1
ON CONFLICT (hall_id, slot_type_slug, display_order) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, cost_label = EXCLUDED.cost_label, cost_amount = EXCLUDED.cost_amount;

INSERT INTO hall_packs (hall_id, slot_type_slug, name, description, cost_label, cost_amount, display_order)
SELECT h.id, 'journee_pleine', 'Pack Delta', 'Salle + chaises + tables + couvert + sono + traiteur + décoration + sécurité', 'À négocier avec le prestataire agréé', NULL, 4 FROM halls h WHERE h.name = 'Salle Principale' LIMIT 1
ON CONFLICT (hall_id, slot_type_slug, display_order) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, cost_label = EXCLUDED.cost_label, cost_amount = EXCLUDED.cost_amount;

-- Packs Journée pleine - Salle Annexe
INSERT INTO hall_packs (hall_id, slot_type_slug, name, description, cost_label, cost_amount, display_order)
SELECT h.id, 'journee_pleine', 'Pack Alpha', 'Salle vide : non équipée, non décorée, sécurité offerte', '200 000 FCFA', 200000, 1 FROM halls h WHERE h.name = 'Salle Annexe' LIMIT 1
ON CONFLICT (hall_id, slot_type_slug, display_order) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, cost_label = EXCLUDED.cost_label, cost_amount = EXCLUDED.cost_amount;

INSERT INTO hall_packs (hall_id, slot_type_slug, name, description, cost_label, cost_amount, display_order)
SELECT h.id, 'journee_pleine', 'Pack Bravo', 'Salle + chaises + tables + couvert + sono + sécurité offerte', 'À négocier avec le prestataire agréé', NULL, 2 FROM halls h WHERE h.name = 'Salle Annexe' LIMIT 1
ON CONFLICT (hall_id, slot_type_slug, display_order) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, cost_label = EXCLUDED.cost_label, cost_amount = EXCLUDED.cost_amount;

INSERT INTO hall_packs (hall_id, slot_type_slug, name, description, cost_label, cost_amount, display_order)
SELECT h.id, 'journee_pleine', 'Pack Charlie', 'Salle + chaises + tables + couvert + sono + traiteur + sécurité offerte', 'À négocier avec le prestataire agréé', NULL, 3 FROM halls h WHERE h.name = 'Salle Annexe' LIMIT 1
ON CONFLICT (hall_id, slot_type_slug, display_order) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, cost_label = EXCLUDED.cost_label, cost_amount = EXCLUDED.cost_amount;

INSERT INTO hall_packs (hall_id, slot_type_slug, name, description, cost_label, cost_amount, display_order)
SELECT h.id, 'journee_pleine', 'Pack Delta', 'Salle + chaises + tables + couvert + sono + traiteur + décoration + sécurité', 'À négocier avec le prestataire agréé', NULL, 4 FROM halls h WHERE h.name = 'Salle Annexe' LIMIT 1
ON CONFLICT (hall_id, slot_type_slug, display_order) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, cost_label = EXCLUDED.cost_label, cost_amount = EXCLUDED.cost_amount;

-- 4. Offre Demi-journée - Salle Annexe uniquement (une ligne, pas de "pack" nommé)
INSERT INTO hall_packs (hall_id, slot_type_slug, name, description, cost_label, cost_amount, observations, display_order)
SELECT h.id, 'demi_journee', NULL, NULL, '100 000 FCFA', 100000, 'Tables + chaises + couverts offerts pour 50 personnes; Repas et boissons obligatoirement commandés au Mess', 1 FROM halls h WHERE h.name = 'Salle Annexe' LIMIT 1
ON CONFLICT (hall_id, slot_type_slug, display_order) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, cost_label = EXCLUDED.cost_label, cost_amount = EXCLUDED.cost_amount, observations = EXCLUDED.observations;

-- 5. Contact réservation (app_settings)
INSERT INTO app_settings (key, value) VALUES
  ('reservation_contact', '{"telephone_reservation":["222 22 22 22","+237 651 19 19 19"],"telephone_paiement":["+237 678 98 78 90","+237 698 78 09 87"],"email":"test@gmail.com"}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
