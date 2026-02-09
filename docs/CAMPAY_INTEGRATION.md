# Intégration Campay — Paiement Mobile Money (MTN / Orange)

> **Projet :** Mess des Officiers  
> **Document :** Procédure d’implémentation Campay, cheminements et bonnes pratiques  
> **Dernière mise à jour :** Janvier 2026

---

## 1. Vue d’ensemble

Campay permet de collecter des paiements Mobile Money (MTN Money, Orange Money) depuis une application web. Le client reçoit une demande de paiement sur son téléphone, valide avec son code PIN, et l’application peut vérifier le statut de la transaction puis finaliser la commande.

Ce document décrit **comment** Campay a été intégré dans ce projet (procédure, flux, fichiers) et **les bonnes pratiques** pour une implémentation fiable et maintenable.

---

## 2. Prérequis et configuration

### 2.1 Compte Campay

1. Créer un compte sur la plateforme Campay :
   - **Sandbox / démo :** https://demo.campay.net  
   - **Production :** https://www.campay.net  

2. Enregistrer une **application** dans le tableau de bord.

3. Récupérer les **clés d’API** :
   - **Option recommandée :** Jeton permanent dans la section **« CLÉS DE L’APPLICATION »**.
   - **Option alternative :** Identifiants **App Username** et **App Password** pour obtenir un jeton temporaire (valide ~55 minutes).

### 2.2 Variables d’environnement

Fichier : **`.env.local`** (à créer à partir de `.env.example`).

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `CAMPAY_TOKEN` | Oui* | Jeton permanent (recommandé). |
| `CAMPAY_APP_USERNAME` | Oui** | Si pas de `CAMPAY_TOKEN`. |
| `CAMPAY_APP_PASSWORD` | Oui** | Si pas de `CAMPAY_TOKEN`. |
| `CAMPAY_ENVIRONMENT` | Non | `DEV` (démo) ou `PROD`. Défaut : `DEV`. |
| `CAMPAY_BASE_URL` | Non | Override de l’URL de l’API (optionnel). |

\* Si `CAMPAY_TOKEN` est défini, il est utilisé en priorité.  
\** Sinon, le serveur utilise `CAMPAY_APP_USERNAME` et `CAMPAY_APP_PASSWORD` pour obtenir un jeton temporaire via `POST /api/token/`.

**Exemple `.env.local` :**

```env
# Jeton permanent (recommandé)
CAMPAY_TOKEN=votre_jeton_permanent
CAMPAY_ENVIRONMENT=DEV
```

**Bonnes pratiques :**

- Ne jamais commiter `.env.local` (déjà dans `.gitignore`).
- En production, utiliser des secrets (variables d’environnement du hosting) et `CAMPAY_ENVIRONMENT=PROD`.
- Préférer le jeton permanent pour éviter les appels répétés à `/api/token/`.

---

## 3. Architecture de l’implémentation

L’intégration suit une séparation claire :

- **Client Campay (serveur uniquement)** : `src/lib/campay.ts` — appels HTTP vers l’API Campay, token, collect, statut.
- **Routes API Next.js** : pont entre le front et le client Campay, validation des entrées, gestion des erreurs.
- **Front (panier)** : `src/app/(public)/cart/page.tsx` — choix du mode de paiement, appel collect, polling du statut, création de commande et mise à jour du paiement.

Aucune clé Campay ni appel direct à Campay ne doit être fait côté navigateur : tout passe par le backend (Next.js API routes).

---

## 4. Procédure détaillée

### 4.1 Étape 1 — Client Campay (`src/lib/campay.ts`)

**Rôle :** Centraliser la logique d’authentification et les appels à l’API Campay. Ce module est utilisé **uniquement côté serveur** (routes API, jamais dans un composant React côté client).

#### 4.1.1 Choix de l’URL de base

- **Démo :** `https://demo.campay.net`  
- **Production :** `https://api.campay.net`  
- Si `CAMPAY_BASE_URL` est défini, il est utilisé (sans slash final).

#### 4.1.2 Authentification (token)

- Si `CAMPAY_TOKEN` est défini → utilisé tel quel.
- Sinon : appel `POST /api/token/` avec `username` / `password` (variables d’environnement).
- Le jeton temporaire est **mis en cache** en mémoire avec expiration à 55 minutes pour limiter les appels à `/api/token/`.

#### 4.1.3 Collect (demande de paiement)

- **Endpoint Campay :** `POST /api/collect/`
- **Corps attendu :** `amount` (entier), `currency` (ex. `XAF`), `from` (numéro avec indicatif pays, ex. `237xxxxxxxxx`), `description`, `external_reference`.
- **Normalisation côté client :**
  - Numéro : suppression des espaces et du `+`, ajout de l’indicatif `237` si absent.
  - Montant : arrondi à l’entier (Campay n’accepte pas les décimales pour le collect).
- **Réponse :** au minimum `reference` (référence de la transaction Campay). Cette référence sert ensuite à interroger le statut.
- **Gestion des erreurs :** la réponse est lue en `res.text()` puis parsée en JSON. En cas d’échec HTTP ou de réponse sans `reference`, une `Error` est levée avec un message exploitable (ex. ER101, ER201).

#### 4.1.4 Statut de la transaction

- **Endpoint Campay :** `GET /api/transaction/{reference}/`  
  **Important :** pour les transactions **collect** (paiement Mobile Money), l’endpoint est bien `/api/transaction/...` et **pas** `/api/utilities/transaction/...` (réservé aux services type airtime).
- **Réponse attendue :** `status` parmi `PENDING`, `SUCCESSFUL`, `FAILED` (et éventuellement `reference`, `amount`, `currency`, `operator`).
- **Résilience :** la réponse est lue en `res.text()` puis parsée en JSON pour éviter les plantages sur réponses non-JSON (ex. page d’erreur HTML). Le `status` renvoyé par le module est normalisé en `PENDING` | `SUCCESSFUL` | `FAILED`.

**Bonnes pratiques appliquées :**

- Ne jamais exposer le token au client.
- Un seul point d’entrée pour l’API Campay (un fichier `campay.ts`).
- Typage TypeScript (interfaces `CampayCollectInput`, `CampayCollectResult`, `CampayTransactionStatus`).
- Gestion explicite des erreurs et des réponses non-JSON.

---

### 4.2 Étape 2 — Route API Collect (`src/app/api/campay/collect/route.ts`)

**Rôle :** Recevoir les paramètres du panier (montant, téléphone, etc.) et appeler le client Campay pour lancer un collect.

- **Méthode :** `POST`
- **Corps JSON attendu :** `amount` (number), `phone` (string), optionnellement `description`, `external_reference`.
- **Validation :**
  - `amount` requis, nombre strictement positif (arrondi à l’entier avant envoi à Campay).
  - `phone` requis, non vide.
- **Mapping :** le champ `phone` du body est passé comme `from` au client Campay (avec normalisation indicatif 237 si besoin).
- **Réponse succès :** `200` + corps renvoyé par `campayCollect` (au minimum `reference`).
- **Réponse erreur :** `400` si paramètres invalides, `500` en cas d’erreur Campay, avec un corps `{ error: "message" }` pour affichage côté client.

**Bonnes pratiques :**

- Valider toutes les entrées avant d’appeler Campay.
- Ne pas exposer les détails techniques Campay dans les messages d’erreur utilisateur (garder un message générique ou le message Campay si approprié).
- Logger l’erreur côté serveur (`console.error`) pour le diagnostic.

---

### 4.3 Étape 3 — Route API Statut de transaction (`src/app/api/campay/transaction/[reference]/route.ts`)

**Rôle :** Exposer un endpoint GET pour que le front puisse interroger le statut d’une transaction à partir de la `reference` renvoyée par le collect.

- **Méthode :** `GET`
- **Paramètre de route :** `reference` (référence Campay).
- **Comportement :**
  - Si `reference` absente ou vide → `400`.
  - Sinon, appel à `campayGetTransactionStatus(reference)`.
  - En cas de succès → `200` + objet avec au moins `reference` et `status` (`PENDING` | `SUCCESSFUL` | `FAILED`).
  - En cas d’erreur Campay de type 404 / « not found » → on renvoie malgré tout `200` avec `{ reference, status: 'PENDING' }` pour que le front puisse continuer le polling au lieu de considérer la requête comme une erreur bloquante.
  - Autres erreurs → `500` avec `{ error: "message" }`.

**Bonnes pratiques :**

- Éviter de faire échouer tout le flux utilisateur à cause d’un 404 temporaire ou d’un message « not found » en renvoyant un statut PENDING.
- Garder une réponse JSON homogène (toujours un objet avec `status` ou `error`).

---

### 4.4 Étape 4 — Flux front (panier, `src/app/(public)/cart/page.tsx`)

**Rôle :** Proposer le paiement Mobile Money, lancer le collect, attendre la validation sur le téléphone via polling, puis créer la commande et marquer le paiement.

#### 4.4.1 Choix du mode de paiement

- Deux options : **À la livraison** (`on_delivery`) et **Mobile Money** (`mobile_money`).
- Le montant total, le téléphone et les infos client viennent du store (Zustand) et du formulaire de checkout.

#### 4.4.2 Flux « À la livraison »

- Un seul appel `POST /api/orders` avec le payload commande.
- Puis vidage du panier, affichage de la confirmation et redirection.

#### 4.4.3 Flux « Mobile Money » (Campay)

1. **Génération d’une référence externe**  
   `externalReference = crypto.randomUUID()`. Elle lie la future commande au paiement Campay et est utilisée comme identifiant de commande.

2. **Appel collect**  
   `POST /api/campay/collect` avec :
   - `amount` : total du panier  
   - `phone` : numéro du client (depuis le formulaire)  
   - `description` : ex. « Commande Mess des Officiers »  
   - `external_reference` : `externalReference` ci-dessus  

   En cas de réponse non OK, afficher l’erreur (ex. « Demande de paiement impossible ») et ne pas lancer le polling.

3. **Affichage « En attente »**  
   Dès que le collect réussit, on affiche le message du type « Acceptez la demande sur votre téléphone — MTN Money ou Orange Money » et un loader, et on désactive le bouton de validation.

4. **Polling du statut**  
   - Appel périodique `GET /api/campay/transaction/{reference}` (la `reference` vient de la réponse du collect).
   - Intervalle : 2 secondes (`CAMPAY_POLL_INTERVAL_MS`).
   - Timeout global : 5 minutes (`CAMPAY_TIMEOUT_MS`). Au-delà, on arrête le polling et on affiche un message d’expiration (ex. « Demande expirée. Réessayez ou payez à la livraison. »).
   - Si la réponse HTTP n’est pas OK → on refait un poll plus tard (pas d’affichage d’erreur immédiat).
   - Si `status === 'SUCCESSFUL'` :
     - Arrêt du polling et du loader.
     - Création de la commande : `POST /api/orders` avec `buildOrderPayload(externalReference)` (pour garder le même identifiant de commande).
     - Mise à jour du paiement : `PATCH /api/orders/{externalReference}/payment` avec `paymentMethod: 'mobile'` et `paidAt`.
     - Vidage du panier, affichage de la confirmation, redirection vers le menu.
   - Si `status === 'FAILED'` : arrêt du polling, message du type « Paiement refusé ou annulé. Réessayez ou payez à la livraison. »
   - Sinon (`PENDING` ou autre) : on reprogramme un poll après l’intervalle.

5. **Gestion des erreurs**  
   Toute erreur (collect ou après SUCCESSFUL) est affichée dans une zone dédiée (ex. encadré rouge) et le bouton de paiement est à nouveau disponible si besoin.

**Bonnes pratiques :**

- Une seule référence externe par tentative de paiement, réutilisée pour la commande et le PATCH payment.
- Timeout et intervalle de polling configurables (constantes en tête de fichier).
- Ne pas considérer une réponse 5xx du statut comme définitive : continuer le polling permet de récupérer après un incident temporaire (et la route renvoie 200 + PENDING en cas de 404 Campay).
- Messages utilisateur clairs (expiration, refus, erreur de création de commande).

---

## 5. Cheminement des données (résumé)

```
[Client] Panier → Choix « Mobile Money » → Clic « Valider »
    → POST /api/campay/collect { amount, phone, description, external_reference }
        → [Next.js] route.ts valide body
        → [lib/campay.ts] getToken() puis campayCollect()
        → Campay POST /api/collect/ → retourne { reference }
    ← 200 { reference }
[Client] Affiche « Acceptez sur votre téléphone », démarre polling
    → GET /api/campay/transaction/{reference}  (toutes les 2 s)
        → [Next.js] route [reference]
        → [lib/campay.ts] campayGetTransactionStatus(reference)
        → Campay GET /api/transaction/{reference}/
    ← 200 { reference, status: 'PENDING' | 'SUCCESSFUL' | 'FAILED' }
[Client] Si status === 'SUCCESSFUL'
    → POST /api/orders (payload avec external_reference)
    → PATCH /api/orders/{externalReference}/payment { paymentMethod: 'mobile', paidAt }
    → clearCart(), écran succès, redirection
```

---

## 6. Fichiers concernés (référence rapide)

| Fichier | Rôle |
|---------|------|
| `src/lib/campay.ts` | Client Campay : token, collect, statut transaction. Serveur uniquement. |
| `src/app/api/campay/collect/route.ts` | POST collect : validation body, appel campayCollect, retour reference. |
| `src/app/api/campay/transaction/[reference]/route.ts` | GET statut : appel campayGetTransactionStatus, gestion 404 → PENDING. |
| `src/app/(public)/cart/page.tsx` | UI panier, choix paiement, appel collect, polling, création commande + PATCH payment. |
| `.env.example` | Modèle des variables Campay. |
| `.env.local` | Variables réelles (non versionné). |

---

## 7. Bonnes pratiques pour une implémentation de qualité

### 7.1 Sécurité

- **Clés et token Campay uniquement côté serveur** : jamais dans le code client ni dans des variables `NEXT_PUBLIC_*` exposées au navigateur.
- **Validation des entrées** : montant, téléphone, référence validés dans les routes API avant tout appel Campay.
- **Ne pas exposer de détails internes** : en cas d’erreur, renvoyer un message utilisateur compréhensible et logger le détail côté serveur.

### 7.2 Robustesse

- **Lecture des réponses HTTP** : utiliser `res.text()` puis `JSON.parse` pour éviter les plantages si Campay renvoie du HTML ou un corps vide.
- **Endpoint de statut** : utiliser `/api/transaction/{reference}/` pour le collect (et non `/api/utilities/transaction/...`).
- **Erreurs 404 / not found sur le statut** : renvoyer 200 avec `status: 'PENDING'` pour permettre au front de continuer le polling.
- **Timeout et polling** : définir un timeout global (ex. 5 min) et un intervalle raisonnable (ex. 2 s) pour ne pas surcharger l’API ni bloquer l’UI indéfiniment.

### 7.3 Maintenabilité

- **Un seul module Campay** (`src/lib/campay.ts`) : tous les appels à l’API passent par ce fichier, ce qui simplifie les changements d’URL, d’auth ou de format.
- **Types TypeScript** : interfaces pour les entrées/sorties Campay et pour les réponses des routes.
- **Constantes nommées** : intervalles et timeouts en constantes en tête du fichier panier pour faciliter les réglages.
- **Documentation** : commentaires dans le code sur les endpoints (collect vs transaction vs utilities) et ce fichier pour le flux global.

### 7.4 Expérience utilisateur

- Messages clairs : « Acceptez la demande sur votre téléphone », « Demande expirée », « Paiement refusé ou annulé ».
- Loader pendant l’attente de validation.
- En cas d’échec ou d’expiration, permettre de réessayer ou de choisir « À la livraison » sans recharger toute la page.

### 7.5 Environnements

- **DEV** : `CAMPAY_ENVIRONMENT=DEV` (ou défaut), base URL démo.
- **PROD** : `CAMPAY_ENVIRONMENT=PROD`, base URL production, credentials en secrets.
- Possibilité d’override avec `CAMPAY_BASE_URL` pour des tests ou des proxies.

---

## 8. Codes d’erreur Campay (référence)

| Code | Signification |
|------|----------------|
| ER101 | Numéro de téléphone invalide (indicatif pays requis, ex. 237). |
| ER102 | Opérateur non pris en charge ou numéro invalide. |
| ER201 | Montant invalide (entier attendu, pas de décimales). |
| ER301 | Solde insuffisant (côté Campay / compte marchand). |

Ces messages peuvent apparaître dans les réponses d’erreur du collect ; le client Campay les remonte via les `Error` et les routes les renvoient dans le corps `{ error: "..." }` pour affichage côté client si pertinent.

---

## 9. Évolutions possibles

- **Webhooks Campay** : si Campay propose des webhooks pour les changements de statut, les consommer en plus du polling pour mettre à jour la commande plus rapidement et réduire la charge.
- **Idempotence** : s’assurer que `POST /api/orders` avec le même `external_reference` ne crée pas de doublon (ex. vérification côté API orders).
- **Logs structurés** : remplacer `console.error` par un logger avec niveau et contexte (reference, external_reference) pour le suivi en production.
- **Tests** : tests unitaires sur `campay.ts` (mock fetch) et tests d’intégration sur les routes avec des réponses Campay simulées.

---

*Ce document décrit l’implémentation Campay telle qu’elle existe dans le projet. En cas de changement d’API ou de flux, mettre à jour ce fichier en conséquence.*
