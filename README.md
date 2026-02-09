# Mess des Officiers - Système de Gestion de Restaurant

![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-06B6D4?logo=tailwindcss)

## 📋 Description

Système complet de gestion de restaurant comprenant :
- **Site web public** : Menu, réservation, commande en ligne
- **Système QR Code** : Commande sur place via scan de table
- **Dashboard administrateur** : Gestion, analytics, opérations

## 🚀 Stack Technique

- **Framework** : Next.js 16 (App Router)
- **Language** : TypeScript (strict mode)
- **Styling** : Tailwind CSS 4 + PostCSS
- **State** : Zustand
- **UI Components** : Radix UI (primitives accessibles)
- **Icons** : Lucide React
- **Charts** : Recharts (à implémenter)
- **Tables** : TanStack Table (à implémenter)
- **Utilities** : clsx, tailwind-merge, class-variance-authority, date-fns

## 📁 Structure du Projet

\`\`\`
src/
├── app/
│   ├── (public)/          # Site web public
│   │   ├── layout.tsx
│   │   └── menu/
│   ├── (table)/           # Parcours QR Code
│   │   ├── layout.tsx
│   │   └── table/[id]/
│   ├── dashboard/         # Dashboard admin
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
│
├── components/
│   ├── ui/                # Composants de base (Button, Card, Badge, etc.)
│   ├── layout/            # Header, Sidebar, Footer
│   ├── charts/            # Graphiques (à implémenter)
│   ├── tables/            # Tables de données (à implémenter)
│   └── forms/             # Formulaires (à implémenter)
│
├── design-system/
│   ├── site.json          # Design system site public
│   └── dashboard.json     # Design system dashboard
│
├── lib/
│   ├── utils.ts           # Fonctions utilitaires
│   ├── constants.ts       # Constantes de l'application
│   └── mock-data/         # Données mockées
│
├── hooks/                 # Hooks personnalisés
├── store/                 # Stores Zustand
└── types/                 # Types TypeScript
\`\`\`

## 🎨 Design Systems

### Site Public
- **Couleur primaire** : `#F4A024` (orange/or)
- **Couleur accent** : `#4B4F1E` (olive)
- **Typographie** : Poppins (titres), Inter (corps)

### Dashboard Admin
- **Couleur primaire** : `#2563EB` (bleu)
- **Background** : `#F9FAFB`
- **Typographie** : Inter

## 🛠️ Installation

\`\`\`bash
# Cloner le projet
git clone [url-du-repo]
cd mindef_app

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
\`\`\`

Le projet sera disponible sur [http://localhost:3000](http://localhost:3000)

## 📱 Pages Disponibles

| Route | Description |
|-------|-------------|
| \`/\` | Page d'accueil avec navigation |
| \`/menu\` | Menu du restaurant avec catégories |
| \`/dashboard\` | Dashboard administrateur |
| \`/table/[id]\` | Page d'accueil commande sur table |

## 🔜 Prochaines Étapes (UI)

1. Implémenter les graphiques Recharts sur le dashboard
2. Créer les tables avec TanStack Table
3. Compléter les pages du site public (réservation, à propos, contact)
4. Ajouter le menu du parcours QR Code
5. Créer les formulaires (produits, catégories, etc.)
6. Responsive mobile pour toutes les pages

## ⚠️ Mode UI-First

Ce projet suit une approche **UI-First** :
- ✅ Interface utilisateur complète
- ✅ Données mockées statiques
- ❌ Pas de backend réel
- ❌ Pas d'authentification
- ❌ Pas de base de données

L'intégration backend (Supabase, Auth, Paiements) sera effectuée une fois l'UI validée.

## 📝 Scripts

\`\`\`bash
npm run dev      # Serveur de développement
npm run build    # Build de production
npm run start    # Démarrer en production
npm run lint     # Vérifier le code
\`\`\`

## 📚 Documentation

- **[Intégration Campay (Mobile Money)](docs/CAMPAY_INTEGRATION.md)** — Procédure d’implémentation, flux de paiement MTN/Orange, configuration et bonnes pratiques.

## 📄 License

ISC

---

Développé avec ❤️ pour le Mess des Officiers
