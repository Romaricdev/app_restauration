'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import {
  LayoutDashboard,
  Monitor,
  UtensilsCrossed,
  Building2,
  Receipt,
  Calendar,
  ShoppingBag,
  ChefHat,
  Package,
  Grid3X3,
  Layers,
  Settings,
  HelpCircle,
  ArrowRight,
  ListOrdered,
  CreditCard,
  Truck,
  Wifi,
  BookOpen,
} from 'lucide-react'
import Link from 'next/link'

const navSections = [
  { id: 'intro', label: 'Introduction', icon: BookOpen },
  { id: 'dashboard-overview', label: 'Vue d\'ensemble du Dashboard', icon: LayoutDashboard },
  { id: 'dashboard-pages', label: 'Pages du Dashboard', icon: ListOrdered },
  { id: 'pos-overview', label: 'Vue d\'ensemble du POS', icon: Monitor },
  { id: 'pos-workflows', label: 'Workflows POS', icon: ArrowRight },
  { id: 'pos-interfaces', label: 'Interfaces et actions POS', icon: CreditCard },
  { id: 'pos-delivery', label: 'Livraison au client et factures', icon: Truck },
  { id: 'pos-offline', label: 'Mode hors ligne', icon: Wifi },
] as const

export default function DashboardHelpPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-dashboard-text-primary flex items-center gap-3">
          <HelpCircle className="w-8 h-8 text-dashboard-primary" />
          Aide utilisateur
        </h1>
        <p className="mt-2 text-dashboard-text-secondary">
          Guide complet pour utiliser le dashboard et le POS du Restaurant Central. Toutes les interfaces, actions et workflows sont expliqués de A à Z.
        </p>
      </div>

      {/* Table des matières */}
      <Card className="mb-10 border-dashboard-border">
        <CardHeader>
          <CardTitle className="text-lg">Sommaire</CardTitle>
        </CardHeader>
        <CardContent>
          <nav className="grid sm:grid-cols-2 gap-2">
            {navSections.map(({ id, label, icon: Icon }) => (
              <a
                key={id}
                href={`#${id}`}
                className="flex items-center gap-2 py-2 px-3 rounded-lg text-dashboard-text-secondary hover:bg-dashboard-surface-muted hover:text-dashboard-primary transition-colors"
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{label}</span>
              </a>
            ))}
          </nav>
        </CardContent>
      </Card>

      {/* Contenu */}
      <div className="space-y-10">
        {/* Introduction */}
        <section id="intro" className="scroll-mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Introduction
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-dashboard-text-secondary text-sm leading-relaxed">
              <p>
                Cette aide décrit l&apos;utilisation du <strong className="text-dashboard-text-primary">dashboard administrateur</strong> et du <strong className="text-dashboard-text-primary">POS (Point de Vente)</strong>. En la suivant, vous saurez : gérer les commandes, les produits, les menus, les tables et salles ; prendre des commandes sur place ou à emporter ; encaisser et imprimer les factures ; et utiliser l&apos;application en mode hors ligne.
              </p>
              <p>
                <strong>Dashboard</strong> : accessible via le menu latéral. Il sert à configurer l&apos;établissement (paramètres, produits, menus, tables, salles, réservations) et à consulter les commandes. Utilisez-le en priorité pour la configuration du restaurant (catalogue, horaires, réservations) et pour le suivi global des commandes.
              </p>
              <p>
                <strong>POS</strong> : accessible via le lien « POS » dans le menu. C&apos;est l&apos;écran de caisse pour prendre les commandes, suivre la cuisine et encaisser le client (livraison au client = remise du bon + paiement + facture). Le POS est conçu pour un usage au quotidien en salle ou en caisse : prise de commande, suivi des statuts cuisine, paiement et impression des factures.
              </p>
              <p className="text-dashboard-text-muted italic">
                Conseil : gardez un onglet ouvert sur le Dashboard pour les réglages et la consultation, et un autre sur le POS pour le service. Les données (tables, commandes, produits) sont partagées entre les deux.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Vue d'ensemble Dashboard */}
        <section id="dashboard-overview" className="scroll-mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5" />
                Vue d&apos;ensemble du Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-dashboard-text-secondary text-sm leading-relaxed">
              <p>
                Le dashboard affiche une <strong>vue d&apos;ensemble</strong> (KPIs : revenus, nombre de commandes, panier moyen, clients) et des graphiques. Les indicateurs sont calculés sur la période affichée ; les tendances (hausse ou baisse) permettent de comparer avec la période précédente. Les commandes récentes sont listées avec un clic pour ouvrir le détail (articles, client, statut, paiement).
              </p>
              <p>
                Le <strong>menu latéral</strong> permet d&apos;accéder à : Dashboard, POS, Tables, Salles, Réservation salles, Réservations, Commandes, Menus, Produits, Catégories, Addons, Paramètres, et cette Aide. Sur mobile, le menu peut être replié ; utilisez l&apos;icône en haut à gauche pour l&apos;ouvrir.
              </p>
              <p>
                <strong>Bon à savoir</strong> : les données du dashboard (commandes, revenus) proviennent de la base de données. Les commandes prises et payées depuis le POS y apparaissent après synchronisation. En cas de coupure réseau, les opérations POS sont mises en file et synchronisées au retour de la connexion.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Pages du Dashboard */}
        <section id="dashboard-pages" className="scroll-mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListOrdered className="w-5 h-5" />
                Pages du Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-sm">
              <HelpSection
                icon={UtensilsCrossed}
                title="Tables"
                href="/dashboard/tables"
                content="Liste des tables du restaurant (numéro, capacité, statut : libre / occupée / réservée). Actions : générer le QR code pour la commande à table (le client scanne pour commander depuis sa table), modifier ou supprimer une table, ajouter une table. Le statut se met à jour automatiquement depuis le POS quand une commande est ouverte (occupée) ou libérée (libre). Le nombre de personnes à la table, saisi à l'ouverture au POS, est affiché pour les tables occupées. Conseil : imprimez les QR codes et placez-les sur les tables pour permettre la commande directe par les clients."
              />
              <HelpSection
                icon={Building2}
                title="Salles"
                href="/dashboard/halls"
                content="Gestion des salles pour événements (nom, capacité, équipements, image, statut). Actions : modifier, supprimer, ajouter une salle. Les salles sont utilisées pour les réservations de salles sur le site public : les clients choisissent une salle, un créneau et un pack. Les équipements (sono, projecteur, etc.) et la capacité sont affichés sur la page réservation. Le statut (disponible / occupée / maintenance) permet de masquer temporairement une salle des réservations."
              />
              <HelpSection
                icon={Receipt}
                title="Réservation salles"
                href="/dashboard/reservation-halls"
                content="Configuration des réservations de salles en trois blocs : (1) Types de créneaux (ex. Journée pleine, Demi-journée) avec nom et horaires de début/fin ; (2) Packs par salle et créneau (nom, description, libellé tarif, observations) — chaque pack définit une offre (ex. Pack Bravo : salle + chaises + sono) ; (3) Contact réservation (téléphones réservation, téléphones paiement, email) affiché sur la page réservation salles du site public. Toute modification est immédiatement visible côté site."
              />
              <HelpSection
                icon={Calendar}
                title="Réservations"
                href="/dashboard/reservations"
                content="Vue consolidée des réservations tables et salles. Affichage des détails : client, date, créneau, nombre de personnes (tables) ou invités (salles), statut (en attente, confirmée, annulée). Actions : confirmer ou annuler une réservation. Le filtrage par statut permet de traiter rapidement les demandes en attente. Les réservations tables peuvent être liées à une table précise ; au POS, l'onglet Réservations affiche les créneaux du jour pour démarrer une commande sur la table réservée."
              />
              <HelpSection
                icon={ShoppingBag}
                title="Commandes"
                href="/dashboard/orders"
                content="Liste de toutes les commandes avec statut (En attente, Confirmée, En préparation, Prête, Livrée, Annulée) et type (Sur place, À emporter, Livraison). Clic sur une commande pour voir le détail : articles, quantités, addons, client, total, mode de paiement. Action possible : mettre à jour le statut manuellement. Cette vue est utile pour le suivi global ; pour le suivi en temps réel et le paiement, privilégiez le POS (Commandes en cours)."
              />
              <HelpSection
                icon={ChefHat}
                title="Menus"
                href="/dashboard/menus"
                content="Gestion des menus (ex. Prédéfini, Quotidien). Chaque menu associe une liste de produits et peut être actif ou non. Actions : créer un menu, modifier, dupliquer (pour créer une variante rapidement), supprimer. Seuls les menus actifs et contenant des produits sont utilisés : le POS affiche les produits du « menu du jour » configuré dans Paramètres. Un produit peut appartenir à plusieurs menus. Pensez à activer le bon menu du jour en début de service."
              />
              <HelpSection
                icon={Package}
                title="Produits"
                href="/dashboard/products"
                content="Catalogue des produits : nom, catégorie, prix, image, description, disponibilité (activé/désactivé). Actions : ajouter un produit, modifier, supprimer, activer/désactiver la disponibilité. Les produits désactivés n'apparaissent plus dans le POS ni sur le site. Les produits sont regroupés par catégorie et peuvent avoir des addons (options). Le temps de préparation optionnel peut être utilisé pour l'affichage ou les statistiques."
              />
              <HelpSection
                icon={Grid3X3}
                title="Catégories"
                href="/dashboard/categories"
                content="Catégories de produits (ex. Entrées, Plats, Desserts, Boissons). Actions : ajouter une catégorie, modifier, activer/désactiver, supprimer. L'ordre d'affichage peut être défini pour contrôler l'ordre des onglets dans le POS et sur le menu public. Les catégories désactivées masquent leurs produits du POS et du site. Une catégorie ne peut être supprimée que si aucun produit ne lui est associé."
              />
              <HelpSection
                icon={Layers}
                title="Addons"
                href="/dashboard/addons"
                content="Options additionnelles pour les produits (ex. Supplément fromage, Taille XL). Chaque addon a un prix et peut être « inclus » (gratuit pour certaines catégories) ou « extra » (payant). Les addons sont rattachés aux catégories de produits ; dans le POS, lors de l'ajout d'un produit, une fenêtre s'ouvre pour choisir les options avant d'ajouter au panier. Utile pour les personnalisations (sans glace, sauce à part, etc.)."
              />
              <HelpSection
                icon={Settings}
                title="Paramètres"
                href="/dashboard/settings"
                content="Paramètres généraux : nom du restaurant, adresse, téléphone, email, horaires d'ouverture, frais de livraison par défaut, taux de service, créneaux de réservation (tables). Le menu du jour (quel menu afficher dans le POS) est aussi configuré ici. Ces valeurs sont utilisées sur le site public (footer, page contact, réservations) et dans le POS (frais de livraison pour à emporter/livraison). Modifiez les frais de livraison selon la zone ou la période si besoin."
              />
            </CardContent>
          </Card>
        </section>

        {/* Vue d'ensemble POS */}
        <section id="pos-overview" className="scroll-mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                Vue d&apos;ensemble du POS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-dashboard-text-secondary text-sm leading-relaxed">
              <p>
                Le POS est composé de <strong>trois zones</strong> :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Panneau gauche</strong> : onglets Tables, En ligne, Réservations. <em>Tables</em> : plan des tables (couleur selon statut : libre, occupée, réservée, en cours si vous avez cette table ouverte). Clic sur une table ouvre la configuration (nombre de personnes optionnel, Démarrer la commande ou Libérer la table). Bouton « Commande à emporter » pour une commande sans table. <em>En ligne</em> : commandes reçues en ligne ou par téléphone, avec détail et mise à jour du statut. <em>Réservations</em> : réservations du jour par créneau pour lier une réservation à une table et démarrer une commande.</li>
                <li><strong>Panneau central</strong> : produits du menu du jour, filtrables par catégorie (onglets en haut). Visible une fois qu&apos;une commande est en cours (table sélectionnée ou à emporter). Clic sur un produit l&apos;ajoute à la commande ; si le produit a des addons, une fenêtre s&apos;ouvre pour choisir les options avant d&apos;ajouter.</li>
                <li><strong>Panneau droit</strong> : commande en cours — liste des articles avec quantités (+ / −), suppression possible, sous-total, éventuellement frais de livraison (à emporter), total. Boutons : Annuler (abandon), Attente (mise en pause, la commande reste en mémoire), Valider (envoi en cuisine). En mode « Compléter » (ajout à une commande existante), le bouton affiche « Mettre à jour ».</li>
              </ul>
              <p>
                En <strong>mobile</strong>, des onglets en haut permettent de basculer entre Tables, Produits et Commande ; le panneau actif occupe l&apos;écran. Pensez à basculer sur « Produits » pour ajouter des articles puis sur « Commande » pour valider.
              </p>
              <p>
                <strong>En-tête du POS</strong> : heure et date, bouton <strong>Commandes en cours</strong> (ouvre la liste des commandes en cuisine avec filtres par statut), bouton <strong>Factures</strong> (commandes payées du jour), indicateur de synchronisation (nombre d&apos;opérations en attente et état en ligne / hors ligne), déconnexion.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Workflows POS */}
        <section id="pos-workflows" className="scroll-mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="w-5 h-5" />
                Workflows POS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-sm">
              <div>
                <h4 className="font-semibold text-dashboard-text-primary mb-2">Commande sur place (table)</h4>
                <ol className="list-decimal pl-6 space-y-1 text-dashboard-text-secondary">
                  <li>Ouvrir l&apos;onglet <strong>Tables</strong> dans le panneau gauche.</li>
                  <li>Cliquer sur une table (libre, occupée ou réservée). Une fenêtre s&apos;ouvre : nombre de couverts (obligatoire pour une table libre, optionnel pour une table déjà occupée — vous pouvez laisser vide pour « ajouter une commande » sans changer le nombre de personnes), bouton <strong>Démarrer la commande</strong> ou <strong>Libérer la table</strong>.</li>
                  <li>Choisir « Démarrer la commande ». La table passe en occupée (et le nombre de personnes est enregistré si saisi). Le panneau Produits et le panneau Commande s&apos;affichent.</li>
                  <li>Cliquer sur les produits pour les ajouter. Si des addons existent, une fenêtre propose les options (inclus ou payant) avant d&apos;ajouter.</li>
                  <li>Dans le panneau Commande : ajuster les quantités (+ / −), supprimer un article, optionnellement mettre la commande en <strong>Attente</strong> (pause) ou <strong>Annuler</strong>.</li>
                  <li>Cliquer sur <strong>Valider</strong>. La commande part en cuisine (elle apparaît dans « Commandes en cours »).</li>
                  <li>Pour ajouter des articles à une commande déjà en cuisine : « Commandes en cours » → choisir la commande → <strong>Compléter</strong> → ajouter les lignes dans le panneau Produits → <strong>Mettre à jour</strong>. <strong>Important</strong> : la validation des ajouts ne change pas le statut cuisine (En attente, En préparation, etc.) — le statut reste inchangé et ne se modifie que manuellement.</li>
                  <li>Quand le client a fini : « Commandes en cours » → sélectionner la commande → <strong>Compléter</strong> (si ajouts) puis <strong>Payer</strong>, ou directement <strong>Payer</strong>. Saisir les infos de facturation (nom et téléphone ; l&apos;email n&apos;est pas demandé). Choisir le mode de paiement (Espèces / Carte / Mobile), valider. La table est libérée automatiquement après paiement.</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold text-dashboard-text-primary mb-2">Commande à emporter</h4>
                <ol className="list-decimal pl-6 space-y-1 text-dashboard-text-secondary">
                  <li>Dans le panneau gauche (onglet Tables), cliquer sur <strong>Commande à emporter</strong>.</li>
                  <li>Une nouvelle commande sans table s&apos;ouvre. Saisir le nom et le téléphone du client si besoin. Panneau Produits et Commande actifs.</li>
                  <li>Ajouter les produits (avec addons si proposés). Dans le panneau Commande, vous pouvez activer <strong>Frais de livraison</strong> (montant défini dans Paramètres) si la commande est livrée.</li>
                  <li><strong>Valider</strong> → commande envoyée en cuisine. Puis dans « Commandes en cours » : faire évoluer le statut manuellement (En attente → En préparation → Prêt) et enfin <strong>Payer</strong> pour encaisser et imprimer la facture (nom + téléphone pour la facture).</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold text-dashboard-text-primary mb-2">Commandes en ligne / téléphone</h4>
                <ol className="list-decimal pl-6 space-y-1 text-dashboard-text-secondary">
                  <li>Ouvrir l&apos;onglet <strong>En ligne</strong> dans le panneau gauche. Les commandes en attente ou en cours s&apos;affichent avec un badge (nombre).</li>
                  <li>Pour chaque commande : consulter le détail (articles, client, adresse si livraison), puis mettre à jour le statut manuellement (En attente → Confirmée → En préparation → Prête → Livrée). Ces statuts informent le client et la cuisine. Aucune action automatique ne change le statut.</li>
                  <li>Quand la commande est prête et remise au client, passer le statut à Livrée. Le paiement est géré en dehors du POS (déjà réglé en ligne ou à la remise).</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold text-dashboard-text-primary mb-2">Réservations (tables)</h4>
                <ol className="list-decimal pl-6 space-y-1 text-dashboard-text-secondary">
                  <li>Onglet <strong>Réservations</strong> : affichage des réservations du jour par créneau avec client et nombre de personnes.</li>
                  <li>Cliquer sur une réservation ou une table associée pour ouvrir la configuration de table et démarrer une commande pour ce créneau (même workflow que « Commande sur place »). La table peut déjà être marquée réservée depuis le dashboard.</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Interfaces et actions POS */}
        <section id="pos-interfaces" className="scroll-mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Interfaces et actions POS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-dashboard-text-secondary text-sm leading-relaxed">
              <p><strong>Configuration de table (modal)</strong> : après un clic sur une table, vous pouvez saisir le nombre de personnes (obligatoire pour une table libre si vous enregistrez des couverts ; optionnel pour une table déjà occupée — vous pouvez laisser vide pour simplement ajouter une commande sans modifier le nombre affiché). Boutons : <strong>Démarrer la commande</strong> (ouvre le panneau Produits et Commande) ou <strong>Libérer la table</strong> (remet la table en libre et réinitialise le nombre de personnes). Si la table est réservée, la réservation du créneau peut être indiquée. Le nombre de personnes actuellement à la table (saisi à l&apos;ouverture) s&apos;affiche pour les tables occupées.</p>
              <p><strong>Panneau Produits</strong> : filtres par catégorie en haut ; clic sur un produit = ajout d&apos;une quantité 1 à la commande. Si le produit a des addons, une fenêtre s&apos;ouvre pour choisir les options (inclus ou payant) avant d&apos;ajouter. Les produits désactivés dans le catalogue n&apos;apparaissent pas.</p>
              <p><strong>Panneau Commande</strong> : chaque ligne = produit + addons éventuels, avec boutons − / quantité / + et suppression. Sous-total, éventuellement frais de livraison (à emporter / livraison), total. Boutons : Annuler (abandon de la commande et libération de la table si table), Attente (mise en pause, la commande reste en mémoire), Valider (envoi en cuisine) ou Mettre à jour (en mode Compléter, envoi des nouveaux articles sans changer le statut cuisine).</p>
              <p><strong>Commandes en cours (modal)</strong> : liste des commandes en cuisine avec statuts <em>En attente</em>, <em>En préparation</em>, <em>Prêt</em>, <em>Remise</em>. Filtres par statut. Pour chaque commande : mise à jour <strong>manuelle</strong> du statut cuisine (boutons pour passer au statut suivant) ; « Remise » (marquer comme remise au client) ; <strong>Compléter</strong> (ajouter des lignes puis Mettre à jour — le statut ne change pas automatiquement) ; <strong>Payer</strong> (ouvre la modal de paiement puis la facture). Timer affiché pour les commandes en attente ou en préparation.</p>
              <p><strong>Modal Informations de facturation</strong> : si les infos client ne sont pas renseignées (nom ou téléphone manquants ou placeholders), cette modal s&apos;affiche avant le paiement. Saisir le <strong>nom</strong> et le <strong>téléphone</strong> (obligatoires). L&apos;email n&apos;est pas demandé pour la facturation POS.</p>
              <p><strong>Modal Paiement</strong> : choix du mode (Espèces, Carte, Mobile). En espèces : saisie du montant reçu et calcul automatique de la monnaie à rendre. Bouton « Valider le paiement » enregistre le paiement, génère la facture (aperçu thermal) et libère la table pour les commandes sur place. La facture peut être imprimée ou consultée depuis l&apos;onglet Factures.</p>
            </CardContent>
          </Card>
        </section>

        {/* Livraison au client et factures */}
        <section id="pos-delivery" className="scroll-mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Livraison au client et factures
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-dashboard-text-secondary text-sm leading-relaxed">
              <p>
                <strong>Livraison au client</strong> = remise du bon de commande / de la facture au client après paiement. Workflow typique : commande validée → cuisine prépare (vous faites évoluer le statut manuellement : En attente → En préparation → Prêt → Remise) → clic <strong>Payer</strong> sur la commande → saisie des infos de facturation (nom + téléphone) si besoin → choix du mode de paiement (Espèces / Carte / Mobile) → validation → la facture s&apos;affiche (aperçu thermal) et peut être imprimée ou consultée plus tard depuis Factures.
              </p>
              <p>
                <strong>Facture préalable (avant paiement)</strong> : depuis « Commandes en cours », vous pouvez générer un aperçu de facture (préalable) pour le montrer au client ou l&apos;imprimer. Le paiement définitif se fait ensuite via <strong>Payer</strong>.
              </p>
              <p>
                Bouton <strong>Factures</strong> dans l&apos;en-tête du POS : ouvre la liste des commandes payées du jour (avec numéro de facture, montant, mode de paiement, client). Clic sur une facture pour voir le détail (articles, totaux, infos client) et réimprimer ou télécharger l&apos;aperçu thermal. En mode hors ligne, les factures récemment payées restent visibles depuis le cache local ; après reconnexion, les numéros de facture définitifs sont synchronisés.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Mode hors ligne */}
        <section id="pos-offline" className="scroll-mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="w-5 h-5" />
                Mode hors ligne
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-dashboard-text-secondary text-sm leading-relaxed">
              <p>
                Si la connexion est coupée, le POS continue de fonctionner : vous pouvez prendre des commandes, les valider en cuisine, ajouter des articles (Compléter) et enregistrer les paiements. Les opérations (création de commande, mise à jour des articles, changement de statut, paiement, mise à jour des tables) sont mises en <strong>file de synchronisation</strong> (IndexedDB) et envoyées automatiquement dans l&apos;ordre lorsque la connexion revient. Un indicateur dans l&apos;en-tête affiche le nombre d&apos;opérations en attente et l&apos;état (en ligne / hors ligne).
              </p>
              <p>
                Les factures payées en hors ligne sont conservées en cache et restent visibles dans l&apos;onglet Factures. Après reconnexion, les paiements sont synchronisés avec le serveur et les numéros de facture définitifs peuvent être attribués. Les mises à jour de statut des tables (occupée / libre) effectuées hors ligne sont également rejouées au retour de la connexion.
              </p>
              <p>
                <strong>Conseil</strong> : en cas de coupure prolongée, vérifiez après reconnexion que l&apos;indicateur de file d&apos;attente revient à 0 et que les commandes et factures apparaissent correctement dans le dashboard. En cas de conflit (par exemple même table modifiée depuis un autre poste), les dernières opérations rejouées peuvent écraser les données distantes ; privilégiez un seul poste POS par zone si possible en cas de réseau instable.
              </p>
            </CardContent>
          </Card>
        </section>
      </div>

      <div className="mt-10 pt-6 border-t border-dashboard-border text-center text-sm text-dashboard-text-muted">
        <p>Restaurant Central — Dashboard & POS. Pour toute question, contactez l&apos;administrateur.</p>
      </div>
    </div>
  )
}

function HelpSection({
  icon: Icon,
  title,
  href,
  content,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  href: string
  content: string
}) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-dashboard-surface-muted flex items-center justify-center">
        <Icon className="w-4 h-4 text-dashboard-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-dashboard-text-primary flex items-center gap-2">
          <Link href={href} className="hover:text-dashboard-primary transition-colors">
            {title}
          </Link>
        </h4>
        <p className="mt-1 text-dashboard-text-secondary leading-relaxed">{content}</p>
      </div>
    </div>
  )
}
