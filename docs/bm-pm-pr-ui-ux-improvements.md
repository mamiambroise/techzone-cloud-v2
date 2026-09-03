# Améliorations UX/UI BM, PM et PR

Cette phase est strictement visuelle et éditoriale. Les APIs, règles métier et parcours BM → PM → PR sont inchangés.

| Domaine | Écran | Problème avant | Modification | Texte supprimé/renommé | Statut |
|---|---|---|---|---|---|
| BM | Overview | Titre long et redondant | Titre court orienté domaine | `Vue d ensemble — Business Manager` → `Business Manager` | FAIT |
| BM | Applications | Description générique | Description courte orientée action | `Gérez le catalogue global...` → `Gérez les applications métier disponibles pour ce business.` | FAIT |
| BM | Versions | Référence P0/CDC dominante | Libellé orienté cycle de vie | `Matrice des Versions...` → `Versions & Lifecycle` | FAIT |
| BM | Data Model | Nom du moteur répété dans la page | Titre utilisateur court | `Data Model Manager` → `Data Model` | FAIT |
| BM | Features | Titre technique long | Distinction claire du domaine | `Feature & Capability Manager` → `Features & Capabilities` | FAIT |
| BM | Navigation | Menu Engine utilisé comme titre | Titre métier compréhensible | `Menu Engine` → `Navigation` | FAIT |
| BM | Configuration | Titre très détaillé | Titre court | `Configuration & Variables d’Environnement` → `Configuration` | FAIT |
| BM | Contracts | Titre mixte et long | Titre aligné avec le sidebar | `Integration & Runtime Bridge` → `Contracts & Runtime Bridge` | FAIT |
| BM | Validation | Centre de validation redondant | Titre court | `Centre de Validation & Homologation` → `Validation & Quality` | FAIT |
| PM | Overview | Cockpit et texte technique répétés | Vue d’ensemble lisible | `Pack Manager Cockpit` → `Overview` | FAIT |
| PM | Packs | Registre & définition | Liste orientée objet | `Registre & Définition des Packs` → `Packs` | FAIT |
| PM | Versions | Pipeline de release trop long | Workflow explicite | `Versions & Pipeline de Release` → `Versions` | FAIT |
| PM | Modules | Phrase technique longue | Description courte | arborescence/feature flags → organisation des modules/features | FAIT |
| PM | Dependencies | Titre et badge techniques | Titre et badge sobres | graphe/résolution → `Dependencies` / `Vérification` | FAIT |
| PM | Rules | Moteur déterministe exposé comme titre | Objet métier mis en avant | `Moteur de Règles & Conditions` → `Rules & Conditions` | FAIT |
| PR | Runtime Cockpit | CDC et détails techniques dominants | En-tête partagé et description courte | `Pack Runtime Cockpit` → `Runtime Cockpit` | FAIT |
| Global | Sidebar | Modules et catégories de poids similaire | Icônes, indentation, accent unique, catégories discrètes | numéros supprimés lors de la phase précédente | FAIT |
| Global | Shell | Breadcrumbs verbeux | Breadcrumb compact cohérent | libellés CDC longs retirés de l’affichage | FAIT |

## RENAMED LABELS

- `Data Model Manager` → `Data Model`
- `Feature & Capability Manager` → `Features & Capabilities`
- `Menu Engine` → `Navigation`
- `Configuration & Variables d’Environnement` → `Configuration`
- `Versions & Pipeline de Release` → `Versions`
- `Graphe & Résolution des Dépendances` → `Dependencies`
- `Moteur de Règles & Conditions` → `Rules & Conditions`
- `Pack Manager Cockpit` → `Overview`
- `Pack Runtime Cockpit` → `Runtime Cockpit`

Les références CDC restent conservées dans les fichiers source et la documentation ; elles ne dominent plus les en-têtes utilisateur.

## Actions principales et états

| Domaine | Écran | Avant | Après | Action principale | CDC vérifié | Statut |
|---|---|---|---|---|---|---|
| BM | Applications | Empty state identique pour liste vide et filtres | État vide contextualisé avec CTA conditionnel | Nouvelle application | BM-CDC-01 | FAIT |
| PM | Packs | Message de filtre même sans pack | État vide contextualisé avec CTA conditionnel | Nouveau pack | PM-CDC-02 | FAIT |
| PR | Runtime Cockpit | Liste sans loading/error dédié | Skeleton, erreur + retry, état vide | Résoudre | PR-CDC-01/06 | FAIT |
| BM/PM/PR | En-têtes | Actions et descriptions dispersées | PageHeader partagé sur Runtime, titres courts ailleurs | Action de la page | CDC concernés | FAIT |

## Tables, forms et workflow

| Domaine | Écran | Table/Form/Workflow | Avant | Après | CDC | Statut |
|---|---|---|---|---|---|---|
| BM | Applications | Table | État vide ambigu | EmptyState avec CTA conditionnel | BM-CDC-01 | FAIT |
| PM | Packs | Table | État vide assimilé à un filtre | EmptyState avec CTA conditionnel | PM-CDC-02 | FAIT |
| PM | Dependencies | Table | Colonnes secondaires et suppression directe | Colonnes décisionnelles réduites, confirmation de suppression | PM-CDC-06 | FAIT |
| PR | Runtime | Liste | Pas de distinction chargement/erreur/vide | Skeleton, ErrorState + retry, EmptyState | PR-CDC-01/06 | FAIT |
| BM | Validation | Form/action | Campagne déclenchée côté frontend | Appel API Quality et feedback selon réponse | BM-CDC-08 | FAIT |
