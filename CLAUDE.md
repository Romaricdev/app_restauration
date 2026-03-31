# CLAUDE.md - Base de Connaissances du Projet

> **Projet:** Restaurant Central - Système de Gestion de Restaurant
> **Version:** 1.0.0
> **Dernière mise à jour:** Janvier 2026

---

## 1. Vue d'Ensemble du Projet

### Description

Application web complète de gestion de restaurant pour le **Restaurant Central**. Le système comprend :

- Un **site public** pour les clients (menu, panier, réservations)
- Un **dashboard administratif** pour la gestion (commandes, produits, tables, etc.)
- Un **système de commande via QR Code** pour les tables du restaurant

### Statut Actuel

| Aspect | Statut |
|--------|--------|
| Interface utilisateur | ✅ Complète |
| Design system | ✅ Complet |
| State management | ✅ Implémenté |
| Données mock | ✅ Complètes |
| Backend/API | ❌ Non implémenté |
| Authentification réelle | ❌ Non implémentée |
| Tests | ❌ Non implémentés |

---

## 2. Stack Technique

### Framework & Langage

```
Next.js         16.1.3    Framework React avec App Router
React           19.2.3    Librairie UI
TypeScript      5.9.3     Langage (mode strict activé)
```

### State Management

```
Zustand         5.0.10    Gestion d'état légère
```

### Styling & UI

```
Tailwind CSS    4.1.18    Framework CSS utility-first
Radix UI        (multi)   Composants accessibles headless
Framer Motion   12.27.0   Animations
Lucide React    0.562.0   Icônes SVG
CVA             0.7.1     Gestion des variantes de composants
```

### Utilitaires

```
date-fns        4.1.0     Manipulation de dates
clsx            2.1.1     Classes CSS conditionnelles
tailwind-merge  3.4.0     Fusion de classes Tailwind
```

### Librairies installées mais non encore utilisées

```
Recharts        3.6.0     Graphiques (prévu pour dashboard)
TanStack Table  8.21.3    Tables de données avancées
```

---

## 3. Structure du Projet

```
src/
├── app/                              # Routes Next.js (App Router)
│   ├── (auth)/                       # Groupe routes authentification
│   │   ├── login/page.tsx            # Page connexion
│   │   └── register/page.tsx         # Page inscription
│   │
│   ├── (public)/                     # Groupe routes site public
│   │   ├── home/page.tsx             # Page d'accueil
│   │   ├── menu/page.tsx             # Page menu complet
│   │   ├── cart/page.tsx             # Page panier
│   │   ├── reservation/page.tsx      # Page réservations
│   │   └── layout.tsx                # Layout public (header/footer)
│   │
│   ├── (table)/                      # Groupe routes QR Code
│   │   ├── table/[id]/page.tsx       # Page commande par table
│   │   └── layout.tsx                # Layout tables
│   │
│   ├── dashboard/                    # Routes administration
│   │   ├── page.tsx                  # Vue d'ensemble
│   │   ├── orders/page.tsx           # Gestion commandes
│   │   ├── products/page.tsx         # Gestion produits
│   │   ├── categories/page.tsx       # Gestion catégories
│   │   ├── menus/page.tsx            # Gestion menus
│   │   ├── tables/page.tsx           # Gestion tables
│   │   ├── halls/page.tsx            # Gestion salles
│   │   ├── reservations/page.tsx     # Gestion réservations
│   │   └── layout.tsx                # Layout dashboard
│   │
│   ├── page.tsx                      # Redirection vers /home
│   ├── layout.tsx                    # Layout racine
│   └── globals.css                   # Styles globaux + thème
│
├── components/                       # Composants React
│   ├── ui/                           # Composants UI de base
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── input.tsx
│   │   └── separator.tsx
│   │
│   ├── layout/                       # Composants de layout
│   │   ├── dashboard/
│   │   │   ├── sidebar.tsx           # Sidebar admin
│   │   │   └── topbar.tsx            # Barre supérieure admin
│   │   ├── public/
│   │   │   ├── PublicHeader.tsx      # Header site public
│   │   │   ├── PublicFooter.tsx      # Footer site public
│   │   │   ├── MobileMenu.tsx        # Menu mobile
│   │   │   └── WhatsAppButton.tsx    # Bouton WhatsApp flottant
│   │   └── site/
│   │       ├── header.tsx
│   │       └── footer.tsx
│   │
│   ├── auth/                         # Composants authentification
│   │   ├── AuthCard.tsx              # Carte wrapper auth
│   │   ├── LoginForm.tsx             # Formulaire connexion
│   │   ├── RegisterForm.tsx          # Formulaire inscription
│   │   └── ReCaptcha.tsx             # Placeholder reCAPTCHA
│   │
│   ├── reservation/                  # Composants réservation
│   │   ├── ReservationTypeSelector.tsx
│   │   ├── ReservationForm.tsx       # Form réservation table
│   │   ├── HallReservationForm.tsx   # Form réservation salle
│   │   ├── HallSelection.tsx         # Sélection de salle
│   │   ├── ReservationSummary.tsx    # Résumé réservation
│   │   └── ReservationSuccess.tsx    # Page succès
│   │
│   ├── modals/                       # Modales
│   │   ├── BaseModal.tsx             # Modal de base (Radix)
│   │   ├── OrderDetailsModal.tsx     # Détails commande
│   │   ├── TableDetailsModal.tsx     # Détails table
│   │   ├── HallDetailsModal.tsx      # Détails salle
│   │   ├── MenuDetailsModal.tsx      # Détails menu
│   │   └── ReservationDetailsModal.tsx
│   │
│   └── animations/                   # Composants animation
│       ├── FadeIn.tsx                # Animation fade in
│       ├── Stagger.tsx               # Animation staggered
│       └── PageTransition.tsx        # Transition de page
│
├── store/                            # Stores Zustand
│   ├── cart-store.ts                 # État du panier
│   └── ui-store.ts                   # État UI (sidebar, modals, toasts)
│
├── lib/                              # Utilitaires
│   ├── utils.ts                      # Fonctions helpers
│   ├── constants.ts                  # Constantes application
│   └── mock-data/                    # Données de test
│       ├── index.ts                  # Export centralisé
│       ├── menu.ts                   # Menu items + catégories
│       ├── orders.ts                 # Commandes exemple
│       ├── reservations.ts           # Réservations tables
│       ├── hall-reservations.ts      # Réservations salles
│       ├── tables.ts                 # Tables restaurant
│       ├── halls.ts                  # Salles de fête
│       ├── menus.ts                  # Configurations menus
│       └── dashboard.ts              # Données analytics
│
├── types/                            # Définitions TypeScript
│   └── index.ts                      # Tous les types/interfaces
│
└── hooks/                            # Hooks personnalisés (vide)
```

---

## 4. Pages Implémentées

### 4.1 Site Public (`/`)

#### Page d'Accueil (`/home`)
- **Fichier:** `src/app/(public)/home/page.tsx`
- **Statut:** ✅ Complète
- **Fonctionnalités:**
  - Hero section avec effet parallaxe
  - Présentation des catégories de menu
  - Plats populaires en vedette
  - Informations restaurant (horaires, adresse)
  - Animations Framer Motion (FadeIn, Stagger)

#### Page Menu (`/menu`)
- **Fichier:** `src/app/(public)/menu/page.tsx`
- **Statut:** ✅ Complète
- **Fonctionnalités:**
  - Affichage complet du menu (20 plats)
  - Filtrage par catégorie (sticky)
  - 6 catégories : Entrées, Plats, Grillades, Poissons, Desserts, Boissons
  - Cartes produit avec image, prix, disponibilité
  - Bouton "Ajouter au panier" fonctionnel
  - Feedback visuel après ajout
  - Grille responsive (1→2→3→4 colonnes)

#### Page Panier (`/cart`)
- **Fichier:** `src/app/(public)/cart/page.tsx`
- **Statut:** ✅ Complète (UI)
- **Fonctionnalités:**
  - Liste des articles du panier (connecté à Zustand)
  - Modification des quantités (+/-)
  - Suppression d'articles
  - Calcul automatique du total
  - Bouton de validation (non connecté à un backend)

#### Page Réservation (`/reservation`)
- **Fichier:** `src/app/(public)/reservation/page.tsx`
- **Statut:** ✅ Complète (UI)
- **Fonctionnalités:**
  - Sélecteur de type (Table ou Salle)
  - **Réservation Table:**
    - Nom, téléphone, email
    - Sélection date/heure (créneaux prédéfinis)
    - Nombre de personnes
    - Notes optionnelles
  - **Réservation Salle:**
    - Sélection de salle avec preview
    - Type d'événement
    - Dates début/fin
    - Nombre d'invités estimé
  - Page de confirmation après soumission

---

### 4.2 Authentification (`/login`, `/register`)

#### Page Connexion (`/login`)
- **Fichier:** `src/app/(auth)/login/page.tsx`
- **Statut:** ✅ UI Complète | ❌ Backend non connecté
- **Fonctionnalités:**
  - Formulaire email/mot de passe
  - Checkbox "Se souvenir de moi"
  - Lien vers inscription
  - Validation côté client basique

#### Page Inscription (`/register`)
- **Fichier:** `src/app/(auth)/register/page.tsx`
- **Statut:** ✅ UI Complète | ❌ Backend non connecté
- **Fonctionnalités:**
  - Champs: nom, email, mot de passe, confirmation
  - Placeholder reCAPTCHA
  - Acceptation des conditions
  - Lien vers connexion

---

### 4.3 Dashboard Admin (`/dashboard`)

#### Vue d'ensemble (`/dashboard`)
- **Fichier:** `src/app/dashboard/page.tsx`
- **Statut:** ✅ UI Complète | ⚠️ Graphiques placeholder
- **Fonctionnalités:**
  - 4 cartes KPI : Revenus, Commandes, Panier moyen, Clients actifs
  - Indicateurs de tendance (↑/↓ avec pourcentage)
  - Placeholder pour graphique revenus (Recharts à implémenter)
  - Liste des plats les plus vendus
  - Placeholder pour commandes récentes

#### Gestion Commandes (`/dashboard/orders`)
- **Fichier:** `src/app/dashboard/orders/page.tsx`
- **Statut:** ✅ UI Complète | ❌ Actions non fonctionnelles
- **Fonctionnalités:**
  - Cartes commandes avec:
    - Image du premier article
    - Badge statut (6 états possibles)
    - Icône type (sur place, à emporter, livraison)
    - Infos client
    - Prix total
  - Modal détails commande
  - Boutons d'action (TODO: mise à jour statut)
  - Layout responsive

#### Gestion Produits (`/dashboard/products`)
- **Fichier:** `src/app/dashboard/products/page.tsx`
- **Statut:** ✅ Structure | ❌ CRUD non implémenté
- **Fonctionnalités:**
  - Liste des produits en tableau
  - Boutons: Modifier, Supprimer, Toggle disponibilité
  - Bouton "Ajouter produit"
  - TODO: Modales et actions

#### Gestion Catégories (`/dashboard/categories`)
- **Fichier:** `src/app/dashboard/categories/page.tsx`
- **Statut:** ✅ Structure | ❌ CRUD non implémenté
- **Fonctionnalités:**
  - Liste des catégories
  - Boutons: Modifier, Activer/Désactiver, Supprimer
  - Bouton "Ajouter catégorie"
  - TODO: Modales et actions

#### Gestion Menus (`/dashboard/menus`)
- **Fichier:** `src/app/dashboard/menus/page.tsx`
- **Statut:** ✅ Structure | ❌ CRUD non implémenté
- **Fonctionnalités:**
  - Affichage des menus configurés
  - Boutons: Dupliquer, Modifier, Supprimer
  - Bouton "Créer menu"
  - TODO: Composition de menu

#### Gestion Tables (`/dashboard/tables`)
- **Fichier:** `src/app/dashboard/tables/page.tsx`
- **Statut:** ✅ Structure | ❌ Actions non implémentées
- **Fonctionnalités:**
  - Liste des 12 tables du restaurant
  - Numéro, capacité, statut (libre/occupé/réservé)
  - Bouton génération QR Code (TODO)
  - Boutons: Modifier, Supprimer
  - Bouton "Ajouter table"

#### Gestion Salles (`/dashboard/halls`)
- **Fichier:** `src/app/dashboard/halls/page.tsx`
- **Statut:** ✅ Structure | ❌ CRUD non implémenté
- **Fonctionnalités:**
  - Liste des 3 salles de fête
  - Capacité, équipements, statut
  - Boutons: Modifier, Supprimer
  - Bouton "Ajouter salle"

#### Gestion Réservations (`/dashboard/reservations`)
- **Fichier:** `src/app/dashboard/reservations/page.tsx`
- **Statut:** ✅ UI Complète | ❌ Actions non implémentées
- **Fonctionnalités:**
  - Vue consolidée tables + salles
  - Détails réservation (client, date, taille)
  - Boutons: Confirmer, Annuler (TODO)
  - Filtrage par statut

---

### 4.4 Commande QR Code (`/table/[id]`)

- **Fichier:** `src/app/(table)/table/[id]/page.tsx`
- **Statut:** ⚠️ Structure de base uniquement
- **Fonctionnalités prévues:**
  - Menu adapté pour commande sur table
  - Connexion au panier avec numéro de table
  - Appel serveur

---

## 5. Composants UI Implémentés

### Composants de Base (`/components/ui/`)

| Composant | Fichier | Description |
|-----------|---------|-------------|
| Button | `button.tsx` | Bouton avec variantes (primary, secondary, ghost, outline) et tailles |
| Card | `card.tsx` | Carte conteneur avec CardHeader, CardTitle, CardContent, CardFooter |
| Badge | `badge.tsx` | Badge/tag avec couleurs sémantiques |
| Input | `input.tsx` | Champ de saisie stylisé |
| Separator | `separator.tsx` | Séparateur horizontal/vertical |

### Composants Animation (`/components/animations/`)

| Composant | Description |
|-----------|-------------|
| FadeIn | Animation d'apparition avec délai configurable |
| Stagger | Animation séquentielle pour listes |
| PageTransition | Transition entre pages |

### Composants Modales (`/components/modals/`)

| Modal | Utilisation |
|-------|-------------|
| BaseModal | Modal de base réutilisable (Radix Dialog) |
| OrderDetailsModal | Affiche détails d'une commande |
| TableDetailsModal | Affiche détails d'une table |
| HallDetailsModal | Affiche détails d'une salle |
| MenuDetailsModal | Affiche composition d'un menu |
| ReservationDetailsModal | Affiche détails réservation |

---

## 6. State Management (Zustand)

### Cart Store (`/store/cart-store.ts`)

```typescript
interface CartState {
  items: CartItem[]
  tableNumber: number | null

  // Actions
  addItem: (item: MenuItem, quantity?: number) => void
  removeItem: (cartItemId: string) => void
  updateQuantity: (cartItemId: string, quantity: number) => void
  clearCart: () => void
  setTableNumber: (tableNumber: number | null) => void

  // Computed
  getItemCount: () => number
  getSubtotal: () => number
  getTotal: () => number
}
```

**Fonctionnalités:**
- Ajout automatique de quantité si article existant
- Suppression automatique si quantité ≤ 0
- Génération d'ID unique pour chaque item
- Calcul automatique sous-total et total

### UI Store (`/store/ui-store.ts`)

```typescript
interface UIState {
  // Sidebar
  sidebarOpen: boolean
  toggleSidebar: () => void

  // Mobile menu
  mobileMenuOpen: boolean
  toggleMobileMenu: () => void

  // Modal
  activeModal: string | null
  openModal: (modalId: string) => void
  closeModal: () => void

  // Toasts
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}
```

**Fonctionnalités:**
- Gestion sidebar collapsible
- Menu mobile toggle
- Système de modal unique
- Notifications toast avec auto-dismiss (5s)

---

## 7. Types TypeScript (`/types/index.ts`)

### Types Principaux

```typescript
// Produits & Menu
interface MenuItem { id, name, description, price, image?, categoryId, available, popular?, preparationTime? }
interface Category { id, name, description?, icon?, order }
interface Menu { id, name, description?, type, products, active, createdAt, updatedAt }

// Commandes
type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
type OrderType = 'dine-in' | 'takeaway' | 'delivery'
type PaymentMethod = 'cash' | 'card' | 'mobile'
interface Order { id, items, status, type, tableNumber?, customerName?, total, createdAt, ... }

// Réservations
interface TableReservation { id, type: 'table', customerName, date, time, partySize, status, ... }
interface HallReservation { id, type: 'hall', hallId, hallName, startDate, endDate, eventType?, ... }
type Reservation = TableReservation | HallReservation

// Infrastructure
interface RestaurantTable { id, number, capacity, status, currentOrderId? }
interface Hall { id, name, capacity, amenities?, status }
interface User { id, name, email, role, avatar?, createdAt }

// Dashboard
interface DashboardStats { totalRevenue, totalOrders, averageOrderValue, activeCustomers }
```

---

## 8. Données Mock

### Fichiers de données (`/lib/mock-data/`)

| Fichier | Contenu | Quantité |
|---------|---------|----------|
| `menu.ts` | Plats + catégories | 20 plats, 6 catégories |
| `orders.ts` | Commandes exemple | 8 commandes |
| `reservations.ts` | Réservations tables | 5 réservations |
| `hall-reservations.ts` | Réservations salles | 4 réservations |
| `tables.ts` | Tables restaurant | 12 tables |
| `halls.ts` | Salles de fête | 3 salles |
| `menus.ts` | Configs de menu | 2 menus (prédéfini, quotidien) |
| `dashboard.ts` | Données analytics | Stats KPI, revenus par jour |

### Catégories de Menu

```typescript
['Entrées', 'Plats principaux', 'Grillades', 'Poissons', 'Desserts', 'Boissons']
```

### Statuts de Commande

```typescript
pending    → 'En attente'     (warning/jaune)
confirmed  → 'Confirmée'      (info/bleu)
preparing  → 'En préparation' (info/bleu)
ready      → 'Prête'          (success/vert)
delivered  → 'Livrée'         (success/vert)
cancelled  → 'Annulée'        (error/rouge)
```

---

## 9. Design System

### Palette de Couleurs

#### Site Public
```css
--primary: #F4A024        /* Orange/Or - Couleur principale */
--accent: #4B4F1E         /* Olive - Accent secondaire */
--background: #FFFFFF     /* Fond clair */
```

#### Dashboard Admin
```css
--primary: #F4A024        /* Orange */
--success: #16A34A        /* Vert */
--warning: #F59E0B        /* Ambre */
--error: #DC2626          /* Rouge */
--info: #0EA5E9           /* Bleu ciel */
--background: #F9FAFB     /* Gris très clair */
```

### Typographie

```
Titres (H1-H3): Poppins (site public)
Corps de texte: Inter
Dashboard: Inter exclusivement
```

### Breakpoints Responsive

```css
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

---

## 10. Constantes de l'Application

**Fichier:** `src/lib/constants.ts`

```typescript
// Informations Restaurant
APP_NAME = 'Restaurant Central'
RESTAURANT_INFO = {
  name: 'Restaurant Central',
  address: 'Quartier Général, Yaoundé',
  phone: '+237 6XX XXX XXX',
  email: 'contact@messofficiers.cm',
  openingHours: {
    weekdays: '11h30 - 22h00',
    weekends: '12h00 - 23h00',
  },
}

// Créneaux de réservation
TIME_SLOTS = ['11:30', '12:00', '12:30', '13:00', '13:30', '14:00',
              '19:00', '19:30', '20:00', '20:30', '21:00', '21:30']
```

---

## 11. Configuration

### next.config.ts
- Images optimisées
- Domaines autorisés: Unsplash, Pexels, Pixabay

### tsconfig.json
- Mode strict activé
- Path alias: `@/*` → `./src/*`

### tailwind.config.ts
- Palette couleurs étendue
- Variables CSS personnalisées

---

## 12. Commandes de Développement

```bash
# Développement
npm run dev          # Lance le serveur de dev (localhost:3000)

# Production
npm run build        # Build de production
npm run start        # Lance le serveur de production

# Qualité
npm run lint         # Exécute ESLint
```

---

## 13. TODO - Fonctionnalités à Implémenter

### Priorité Haute

- [ ] Intégration backend/API (Supabase, Firebase, ou custom)
- [ ] Authentification réelle avec sessions
- [ ] CRUD complet pour toutes les entités dashboard
- [ ] Mise à jour statut commandes
- [ ] Confirmation/annulation réservations

### Priorité Moyenne

- [ ] Graphiques Recharts dans le dashboard
- [ ] Tables TanStack pour affichage données
- [ ] Génération QR codes pour tables
- [ ] Recherche globale
- [ ] Filtres avancés

### Priorité Basse

- [ ] Tests unitaires (Jest/Vitest)
- [ ] Tests E2E (Playwright/Cypress)
- [ ] Intégration paiement
- [ ] Notifications email
- [ ] PWA / Mode offline

---

## 14. TODOs dans le Code

```
src/app/dashboard/tables/page.tsx:96     → TODO: Open modal or redirect to QR Code page
src/app/dashboard/tables/page.tsx:101    → TODO: Open edit modal
src/app/dashboard/tables/page.tsx:111    → TODO: Open add modal
src/app/dashboard/menus/page.tsx:128     → TODO: Open edit modal
src/app/dashboard/menus/page.tsx:133     → TODO: Duplicate menu
src/app/dashboard/menus/page.tsx:138     → TODO: Open creation modal
src/app/dashboard/categories/page.tsx    → TODO: Edit, toggle, add modals
src/app/dashboard/halls/page.tsx         → TODO: Edit, add modals
src/app/dashboard/orders/page.tsx:175    → TODO: Update order status
src/app/dashboard/products/page.tsx      → TODO: Edit, toggle, add modals
src/app/dashboard/reservations/page.tsx  → TODO: Confirm/cancel reservation
src/app/dashboard/page.tsx:103-116       → Recharts placeholder
src/app/dashboard/page.tsx:180-184       → TanStack Table placeholder
```

---

## 15. Fichiers Clés à Connaître

| Besoin | Fichier |
|--------|---------|
| Types globaux | `src/types/index.ts` |
| Constantes app | `src/lib/constants.ts` |
| Helpers/utils | `src/lib/utils.ts` |
| État panier | `src/store/cart-store.ts` |
| État UI | `src/store/ui-store.ts` |
| Styles globaux | `src/app/globals.css` |
| Données mock | `src/lib/mock-data/index.ts` |

---

*Ce document sert de référence pour le développement du projet. À mettre à jour au fur et à mesure de l'avancement.*
