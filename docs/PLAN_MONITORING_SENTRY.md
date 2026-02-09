# Plan concret : Monitoring (Sentry) — À valider avant implémentation

> **Contexte :** Phase 5 – Infrastructure (ANALYSE_PROJET_V2.md, lignes 787-790)  
> **Objectif :** Intégrer Sentry (erreurs + performance) pour un déploiement production-ready.

---

## 1. Périmètre

| Livrable | Contenu |
|----------|---------|
| **Intégrer Sentry** | SDK Sentry pour Next.js (App Router), config client + serveur, variables d’environnement. |
| **Alertes erreurs** | Capture des erreurs (front + API), envoi depuis l’ErrorBoundary, configuration d’alertes dans Sentry (optionnel : email/Slack). |
| **Performance tracking** | Transactions (pages, API routes), spans, optionnel : Core Web Vitals. |

**Hors périmètre (explicite)** : Pas de PII dans les événements, pas de session replay dans ce plan (à décider séparément).

---

## 2. Prérequis

- Compte [Sentry](https://sentry.io) (gratuit ou équipe).
- Projet Sentry créé pour une app **Next.js**.
- Récupération des clés :
  - **DSN** (Data Source Name) pour le SDK.
  - **Auth Token** (optionnel) pour upload de source maps en CI.

---

## 3. Étapes techniques (ordre recommandé)

### Étape 1 — Dépendances et configuration de base

1. **Installer le SDK Sentry Next.js**
   - Commande : `npm install @sentry/nextjs`
   - Version : alignée sur la doc officielle Sentry pour Next.js (compatibilité Next 16).

2. **Fichiers de configuration Sentry (à la racine du projet)**
   - `sentry.client.config.ts` — initialisation côté client (browser).
   - `sentry.server.config.ts` — initialisation côté serveur (Node).
   - `sentry.edge.config.ts` — initialisation Edge (si usage de middleware/edge).
   - Contenu type : `Sentry.init({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN, environment, tracesSampleRate, ... })`.

3. **Wrapper Next.js**
   - Dans `next.config.ts` : utiliser `withSentryConfig(nextConfig, sentryOptions)` (depuis `@sentry/nextjs`).
   - Options utiles : `silent: true` en dev, `org`, `project`, `authToken` pour source maps (via env).

4. **Variables d’environnement**
   - `.env.example` et doc :
     - `NEXT_PUBLIC_SENTRY_DSN` (obligatoire pour envoyer les événements).
     - `SENTRY_AUTH_TOKEN` (optionnel, pour upload de source maps en CI).
     - `SENTRY_ORG` / `SENTRY_PROJECT` (optionnel, si non fournis dans la config).
   - En local : ne pas envoyer en dev ou utiliser un DSN de test / sample rate à 0 selon préférence.

**Livrable Étape 1 :** Build OK avec Sentry chargé ; aucun envoi si `NEXT_PUBLIC_SENTRY_DSN` absent ou désactivé en dev.

---

### Étape 2 — Capture des erreurs

1. **ErrorBoundary → Sentry**
   - Fichier : `src/components/ErrorBoundary.tsx`.
   - Dans `componentDidCatch` : appeler `Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } })`.
   - Faire l’envoi en production (ou staging) uniquement (vérifier `NODE_ENV` ou `NEXT_PUBLIC_SENTRY_ENVIRONMENT`).

2. **Erreurs API (Next.js)**
   - Les erreurs non gérées dans les Route Handlers peuvent être capturées via un wrapper ou un `instrumentServerWithSentry` / équivalent selon la doc Sentry Next.js.
   - Option simple : dans les blocs `catch` des routes API critiques (`/api/orders`, `/api/campay/*`, etc.), appeler `Sentry.captureException(err)` avant de renvoyer 500.

3. **Erreurs globales client**
   - Déjà couvert par le SDK une fois `sentry.client.config.ts` chargé (window.onerror, unhandledrejection).
   - Vérifier dans la doc Sentry Next.js que l’injection du script client est bien activée (généralement automatique avec `withSentryConfig`).

**Livrable Étape 2 :** Toute erreur capturée par l’ErrorBoundary et les erreurs API ciblées sont visibles dans le projet Sentry.

---

### Étape 3 — Alertes erreurs (côté Sentry)

1. **Règles d’alerte dans Sentry (UI)**
   - Créer une alerte « Errors » : déclencher quand un nouveau type d’erreur apparaît ou quand le volume dépasse un seuil (ex. > N événements en 1 h).
   - Canaux : email par défaut ; optionnel : Slack (intégration Sentry).

2. **Environnements**
   - Définir `environment` dans `Sentry.init` (`development`, `staging`, `production`) à partir de `NEXT_PUBLIC_VERCEL_ENV` ou `NODE_ENV`.
   - Filtrer les alertes par environnement (ex. alerter seulement sur `production`).

**Livrable Étape 3 :** Au moins une alerte Sentry configurée (email) pour les erreurs en production.

---

### Étape 4 — Performance tracking

1. **Transactions et traces**
   - Activer les performances dans `Sentry.init` : `tracesSampleRate` (ex. 0.1 en prod, 1.0 en staging).
   - Vérifier que le SDK Next.js enregistre automatiquement les transactions pour les pages et (selon doc) les API routes.

2. **Spans personnalisés (optionnel)**
   - Pour les opérations coûteuses (ex. appel Campay, création commande), ajouter des spans manuels avec `Sentry.startSpan()` ou équivalent (API selon version du SDK).

3. **Core Web Vitals (optionnel)**
   - Si le SDK Sentry Next.js le propose, activer la collecte des Web Vitals (LCP, FID, CLS) et les lier aux transactions.

**Livrable Étape 4 :** Dans Sentry, on voit des transactions « page » et éventuellement « API » avec durée et échantillonnage configuré.

---

## 4. Fichiers impactés (résumé)

| Fichier | Action |
|---------|--------|
| `package.json` | Ajouter `@sentry/nextjs`. |
| `next.config.ts` | Wrapper avec `withSentryConfig`. |
| `sentry.client.config.ts` | Nouveau — init client. |
| `sentry.server.config.ts` | Nouveau — init serveur. |
| `sentry.edge.config.ts` | Nouveau — init edge (si besoin). |
| `.env.example` | Ajouter `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, etc. |
| `src/components/ErrorBoundary.tsx` | Appel à `Sentry.captureException` dans `componentDidCatch`. |
| `src/app/api/**/*.ts` | Optionnel : `Sentry.captureException` dans les `catch` des routes critiques. |

---

## 5. Critères d’acceptation

1. **Build** : `npm run build` réussit avec Sentry activé (DSN défini) et sans régression.
2. **Désactivable** : Si `NEXT_PUBLIC_SENTRY_DSN` est vide ou absent, l’app ne tente pas d’envoyer d’événements (comportement documenté).
3. **Erreurs** : Une erreur levée dans un composant enfant de l’ErrorBoundary apparaît dans Sentry (après déploiement ou test avec DSN).
4. **Performance** : Les transactions « page load » (et optionnellement API) apparaissent dans l’onglet Performance de Sentry avec un `tracesSampleRate` > 0.
5. **Alertes** : Au moins une alerte Sentry configurée pour les erreurs (ex. email sur nouvel issue en production).

---

## 6. Risques et précautions

- **PII** : Ne pas attacher de données client (email, téléphone, etc.) aux événements Sentry ; utiliser les options de filtrage / `beforeSend` si besoin.
- **Quotas** : En plan gratuit, limiter `tracesSampleRate` (ex. 0.1) pour ne pas dépasser le quota.
- **Source maps** : En production, configurer l’upload (CI + `SENTRY_AUTH_TOKEN`) pour avoir des stack traces lisibles ; sinon désactiver l’upload et accepter des traces minifiées.

---

## 7. Ordre de validation proposé

1. Valider ce plan (périmètre, étapes, fichiers).
2. Créer le projet et le DSN sur Sentry.
3. Implémenter l’étape 1 (config + build), puis valider.
4. Implémenter l’étape 2 (erreurs), tester en staging/prod, valider.
5. Configurer les alertes (étape 3) dans l’UI Sentry.
6. Activer le performance tracking (étape 4), ajuster `tracesSampleRate` si besoin.

---

*Une fois ce plan validé, l’implémentation pourra suivre ces étapes dans l’ordre.*
