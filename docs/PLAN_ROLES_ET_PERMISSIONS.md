# Plan : Gestion des rôles et droits d'accès au dashboard

> **Objectif :** Restreindre la visibilité et les actions du dashboard selon le rôle (et éventuellement les permissions) de l'utilisateur.  
> **À valider avant toute implémentation.**

---

## 1. Contexte actuel

- **Auth :** Supabase Auth + table `admins` (email) ; si l'utilisateur est dans `admins`, il a le rôle `admin` et accède à tout le dashboard.
- **profiles :** table avec `role` (enum : admin, manager, staff, customer) ; utilisée après signup (customer par défaut).
- **Dashboard :** `useRequireAdmin()` — seul `user.role === 'admin'` peut accéder ; pas de distinction de modules.
- **Sidebar :** liste fixe de liens (Dashboard, POS, Tables, Salles, Réservations, Commandes, Menus, Produits, Catégories, Addons, Paramètres, Aide).

La table `admins` dispose déjà de `is_super_admin` et `permissions` (JSONB) dans le schéma, ce qui permet d’affiner les droits sans changer le modèle de données.

---

## 2. Proposition de rôles et droits

### 2.1 Rôles côté dashboard

| Rôle            | Description                                      | Usage prévu |
|-----------------|--------------------------------------------------|-------------|
| **Super Admin** | Accès total + gestion des comptes admin/paramètres critiques | Direction / IT |
| **Admin**       | Accès à tous les modules opérationnels, pas de gestion des admins | Responsable restaurant |
| **Manager**     | Vue d’ensemble, commandes, réservations, POS, tables, salles, menus/produits/catégories/addons en lecture/édition ; pas Paramètres ni gestion des rôles | Chef de service / Responsable salle |
| **Staff**       | POS, commandes (consultation + mise à jour statut), réservations (consultation), tables ; pas de modification du catalogue ni paramètres | Serveur / Caisse |

Les utilisateurs avec rôle **Customer** (ou non présents dans `admins` / sans rôle dashboard) n’ont pas accès au dashboard.

### 2.2 Modules du dashboard (périmètre des droits)

| Module              | Route                    | Super Admin | Admin | Manager | Staff |
|---------------------|--------------------------|-------------|-------|---------|-------|
| Vue d’ensemble      | `/dashboard`             | ✅          | ✅    | ✅      | ❌    |
| POS                 | `/dashboard/pos`         | ✅          | ✅    | ✅      | ✅    |
| Tables              | `/dashboard/tables`      | ✅          | ✅    | ✅      | ✅ (lecture + statut) |
| Salles              | `/dashboard/halls`      | ✅          | ✅    | ✅      | ❌    |
| Réservation salles  | `/dashboard/reservation-halls` | ✅   | ✅    | ✅      | ❌    |
| Réservations        | `/dashboard/reservations`| ✅          | ✅    | ✅      | ✅ (lecture) |
| Commandes           | `/dashboard/orders`      | ✅          | ✅    | ✅      | ✅    |
| Menus               | `/dashboard/menus`       | ✅          | ✅    | ✅      | ❌    |
| Produits            | `/dashboard/products`    | ✅          | ✅    | ✅      | ❌    |
| Catégories          | `/dashboard/categories`  | ✅          | ✅    | ✅      | ❌    |
| Addons              | `/dashboard/addons`      | ✅          | ✅    | ✅      | ❌    |
| Paramètres          | `/dashboard/settings`    | ✅          | ❌    | ❌      | ❌    |
| Aide                | `/dashboard/help`       | ✅          | ✅    | ✅      | ✅    |

- **Super Admin** : tout + gestion des admins (à prévoir dans Paramètres ou une section dédiée).
- **Admin** : tout sauf Paramètres (ou Paramètres limités : pas de gestion des admins).
- **Manager** : tout sauf Paramètres ; édition catalogue (menus, produits, catégories, addons, salles, réservation salles).
- **Staff** : POS, commandes, réservations (lecture), tables ; pas de modification du catalogue ni paramètres.

Actions spécifiques (ex. « Modifier statut commande », « Créer réservation ») peuvent être dérivées du même droit d’accès au module (voir § 4.2).

---

## 3. Stockage des rôles et permissions

### 3.1 Option retenue (recommandée) : table `admins` uniquement

- **Qui accède au dashboard :** uniquement les utilisateurs présents dans la table `admins` (comme aujourd’hui).
- **Rôle affiché / utilisé dans l’app :**
  - Soit déduit de `is_super_admin` + `permissions` :
    - `is_super_admin = true` → **Super Admin** (tout autorisé).
    - `is_super_admin = false` et `permissions` = liste de modules → **Admin** ou **Manager** ou **Staff** selon la liste (voir § 3.2).
  - Soit ajouter une colonne `role` dans `admins` : `super_admin | admin | manager | staff` et garder `permissions` en complément (optionnel pour surcharge fine).

Recommandation : **ajouter `role` dans `admins`** (enum ou texte : `super_admin`, `admin`, `manager`, `staff`) et conserver `permissions` (JSONB) pour des cas particuliers ou évolutions. Par défaut, les droits sont dérivés du rôle ; si `permissions` est renseigné, on peut restreindre encore (optionnel en phase 1).

### 3.2 Mapping rôle → droits (côté app)

- Fichier **`src/lib/permissions.ts`** (ou `src/config/permissions.ts`) :
  - Définir les **modules** (identifiants stables) : `dashboard`, `pos`, `tables`, `halls`, `reservation-halls`, `reservations`, `orders`, `menus`, `products`, `categories`, `addons`, `settings`, `help`.
  - Exporter une **matrice** ou une fonction **`getPermissionsForRole(role)`** qui retourne la liste des modules accessibles (et éventuellement des actions par module).
  - Exporter **`canAccessModule(userRole, module)`** et, si besoin, **`canAccessRoute(pathname)`** (en dérivant le module de la route).

Exemple (conceptuel) :

```ts
// getPermissionsForRole('staff') => ['pos', 'orders', 'reservations', 'tables', 'help']
// canAccessModule(user, 'settings') => false pour staff
```

- Pour un utilisateur dans `admins` :
  - Si `is_super_admin` → tout autorisé.
  - Sinon, utiliser `role` (ou, à défaut, déduire d’une liste `permissions` prédéfinie) et appliquer `getPermissionsForRole(role)`.

### 3.3 Évolution base de données (à valider)

- **Migration :** ajout d’une colonne `role` dans `admins` (type TEXT ou enum) : `super_admin`, `admin`, `manager`, `staff`.
  - Valeur par défaut : `admin` (comportement actuel = tout sauf gestion des admins si on code comme ça).
  - Les comptes existants restent avec `admin` ou on les met en `super_admin` selon choix métier.
- **`is_super_admin`** : conservé ; si `true`, l’utilisateur a tous les droits quel que soit `role`.
- **`permissions`** : conservé pour surcharge optionnelle (ex. retirer un module à un admin).

---

## 4. Implémentation proposée (à valider)

### 4.1 Constantes et configuration des droits

1. **Fichier `src/lib/permissions.ts` (ou `src/config/permissions.ts`)**
   - Liste des **modules** : `dashboard`, `pos`, `tables`, `halls`, `reservation-halls`, `reservations`, `orders`, `menus`, `products`, `categories`, `addons`, `settings`, `help`.
   - **Map rôle → modules autorisés** (alignée sur le tableau § 2.2).
   - **Fonctions :**
     - `getModulesForRole(role): string[]`
     - `canAccessModule(role, module): boolean`
     - `canAccessPath(role, pathname): boolean` (mapping route → module).
   - Prise en charge de **Super Admin** : si `isSuperAdmin` (ou `role === 'super_admin'`), toujours `true` pour tout module / toute route.

2. **Types**
   - Dans `src/types/index.ts` (ou un fichier dédié) : étendre ou ajouter un type **`DashboardRole`** = `'super_admin' | 'admin' | 'manager' | 'staff'` pour usage côté front et cohérence avec la DB.

### 4.2 Auth store et utilisateur “dashboard”

1. **Table `admins`**
   - Lors du chargement de l’utilisateur (après vérification `admins` par email), lire aussi **`role`** et **`is_super_admin`** (et éventuellement `permissions`).
   - Exposer dans l’état auth : `user.role` (dashboard), `user.isSuperAdmin` (ou équivalent).

2. **Type `User` (dashboard)**
   - S’assurer que le type utilisé pour le dashboard inclut au moins : `role` (DashboardRole) et, si besoin, `isSuperAdmin` (boolean) ou dériver “super admin” de `role === 'super_admin'`.

3. **Compatibilité**
   - Les utilisateurs dont le rôle n’est pas encore renseigné en base peuvent être traités comme `admin` (comportement actuel) pour une transition en douceur.

### 4.3 Layout et accès global au dashboard

1. **`useRequireAdmin` (ou nouveau hook `useRequireDashboard`)**
   - Conserver la règle : **seuls les utilisateurs présents dans `admins`** peuvent accéder au dashboard (redirection sinon).
   - À l’intérieur du dashboard, ne plus se contenter de `user.role === 'admin'` : considérer tout rôle dashboard (`super_admin`, `admin`, `manager`, `staff`) comme autorisé à entrer, puis restreindre par route/module.

2. **Layout dashboard (`src/app/dashboard/layout.tsx`)**
   - Après vérification “utilisateur dans admins” (ou équivalent), utiliser **`canAccessPath(user.role, pathname)`** (ou équivalent) pour la route courante.
   - Si l’utilisateur n’a pas le droit sur la route courante : redirection vers `/dashboard` (ou vers la première page à laquelle il a accès), ou affichage d’une page “Accès refusé” avec lien vers `/dashboard`.

3. **Sidebar**
   - **`src/components/layout/dashboard/sidebar.tsx`**
   - Pour chaque entrée de menu, appeler **`canAccessModule(user.role, module)`** (ou `canAccessPath` par href).
   - N’afficher que les liens pour lesquels l’utilisateur a le droit.
   - Optionnel : afficher le rôle ou “Super Admin” dans la topbar pour clarté.

### 4.4 Protection par page (optionnel mais recommandé)

- Pour chaque page sous `/dashboard/*`, soit :
  - **Centralisé :** dans le layout, une seule vérification `canAccessPath(role, pathname)` (déjà décrit ci-dessus), pas de garde supplémentaire par page ; ou
  - **Par page :** au montage, un hook du type **`useRequireModule('orders')`** qui redirige si `!canAccessModule(user.role, 'orders')`.
- Recommandation : **layout central** + éventuellement un hook réutilisable pour les pages sensibles (ex. Paramètres, gestion des admins).

### 4.5 Actions dans les pages (boutons / formulaires)

- Pour les actions sensibles (ex. “Modifier statut commande”, “Supprimer produit”, “Modifier paramètres”) :
  - Dériver du même droit que le module (ex. accès `orders` → autoriser mise à jour statut ; accès `settings` → autoriser modification paramètres).
  - Si besoin d’une granularité plus fine plus tard : ajouter des “actions” dans `permissions.ts` (ex. `orders.updateStatus`, `products.delete`) et vérifier côté UI (bouton désactivé ou masqué) et côté API.
- Phase 1 : **pas d’action cachée par rôle** dans les API (les routes API restent protégées “authentifié + admin” comme aujourd’hui si c’est le cas). On peut ajouter plus tard des vérifications serveur par rôle/permission pour les mutations sensibles.

### 4.6 API (optionnel en phase 1)

- Les routes API sous `/api/*` qui sont réservées au dashboard peuvent, dans un second temps, vérifier le rôle (ou les permissions) en plus du fait que l’utilisateur est authentifié et dans `admins`.
- Phase 1 : on peut garder la protection actuelle (ex. “admin” = tout) et n’introduire les vérifications par rôle/permission que lorsque les besoins sont précis (ex. seul super_admin peut appeler “DELETE /api/admins/:id”).

### 4.7 Paramètres et gestion des admins (Super Admin)

- Page **Paramètres** : affichée uniquement si `canAccessModule(role, 'settings')` (donc Super Admin uniquement dans le tableau § 2.2, ou Admin si vous élargissez “Paramètres” à Admin avec sous-sections).
- Une sous-section **“Utilisateurs” ou “Comptes admin”** (liste/création/édition des lignes `admins`) : réservée aux **Super Admin** (vérification `role === 'super_admin'` ou `is_super_admin`).
- Si la colonne `role` n’existe pas encore en base, la migration (§ 3.3) devra être exécutée avant d’afficher le sélecteur de rôle dans l’écran de gestion des admins.

---

## 5. Ordre des tâches suggéré

1. **Valider** ce document (rôles, matrice des droits, option de stockage).
2. **Migration DB** : ajout de `role` dans `admins` (défaut `admin`), et stratégie pour `is_super_admin`.
3. **Config droits** : créer `src/lib/permissions.ts` (ou `src/config/permissions.ts`) avec modules, `getModulesForRole`, `canAccessModule`, `canAccessPath`.
4. **Auth** : adapter la lecture de l’utilisateur (admins) pour exposer `role` et `is_super_admin` ; adapter les types (DashboardRole, User).
5. **Layout** : vérification `canAccessPath` dans le layout dashboard ; redirection si accès refusé.
6. **Sidebar** : filtrer les liens selon `canAccessModule` (ou `canAccessPath`).
7. **Tests manuels** : comptes avec chaque rôle (super_admin, admin, manager, staff) et vérification des liens visibles et des redirections.
8. **(Optionnel)** Garde par page avec `useRequireModule` ; désactivation/masquage de boutons selon rôle ; puis renforcement des API si besoin.

---

## 6. Résumé des livrables attendus après validation

| Livrable | Description |
|----------|-------------|
| **Rôles et matrice** | Super Admin, Admin, Manager, Staff + tableau des modules (validé ci-dessus). |
| **Stockage** | Colonne `role` dans `admins` ; `is_super_admin` et `permissions` conservés. |
| **Config droits** | Fichier permissions avec modules et fonctions `canAccessModule` / `canAccessPath`. |
| **Auth** | User dashboard avec `role` et `isSuperAdmin` ; chargement depuis `admins`. |
| **Layout** | Vérification d’accès à la route courante ; redirection si interdit. |
| **Sidebar** | Affichage uniquement des liens autorisés pour le rôle. |
| **Paramètres** | Accès restreint (Super Admin ou selon matrice) ; gestion des admins réservée au Super Admin. |

---

*Une fois cette proposition validée (rôles, matrice, option de stockage et ordre des tâches), l’implémentation pourra suivre ce plan étape par étape.*
