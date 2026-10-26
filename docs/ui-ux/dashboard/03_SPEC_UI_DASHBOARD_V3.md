# 03 — SPÉCIFICATION UI/UX — ACCUEIL TECHZONE CLOUD V3

**Projet :** Techzone Cloud V3  
**Périmètre :** Accueil / Tableau de bord global  
**Version documentaire :** 3.0 — cible de modernisation  
**Statut :** Proposition à confronter à l'audit du repository  
**Référence :** `CDC_TABLEAU_DE_BORD_TECHZONE_CLOUD_V2` et maquette visuelle Accueil Techzone Cloud générée en conversation.

> **Objectif : moderniser le dashboard existant, sans remplacer les fonctionnalités ni réécrire les services qui fonctionnent.** Le visuel de référence illustre l'organisation cible, pas des métriques réelles ni des API déjà prouvées.

## 1. Vision et frontières fonctionnelles

L'Accueil est un **cockpit transversal d'orientation et de synthèse**. Il agrège les données des modules propriétaires et renvoie vers leurs écrans métiers. Il ne crée ni ne modifie directement les objets métiers et ne remplace pas les cockpits spécialisés (Observabilité, Administration, Automatisation).

**Principes :** conserver les routes, contrats et fonctionnalités existants après audit ; aucun mock silencieux en mode REAL ; isolation tenant et IAM côté backend ; widgets résilients aux erreurs partielles ; interface accessible et responsive.

## 2. Navigation globale

### 2.1 Sidebar principale (cible)

```text
ACCUEIL
└── Tableau de bord

CRÉATION D'APPLICATIONS
├── Business Manager
├── UI Builder
└── Automatisation

PUBLICATION & EXÉCUTION
├── Pack Manager
├── Environnements & Déploiements
└── Pack Runtime

DONNÉES & INTÉGRATIONS
├── Data Platform
├── ERP / Integration Hub
└── API Manager

SUPERVISION
└── Observabilité

COMMERCIAL
└── Abonnements & Facturation

ADMINISTRATION & INFRASTRUCTURE
├── Administration Platform
├── Auth / IAM
├── Registry
└── Prisma / Tenant Foundation
```

La sidebar est **repliable par groupe**, et les liens ne sont visibles que si l'utilisateur y est autorisé. Ne pas imposer les 15 modules à tous les profils. En mobile, utiliser un drawer. Préserver les routes existantes, utiliser un mapping centralisé et éviter de dupliquer les menus métier des modules.

### 2.2 Topbar

- Commande d'ouverture/réduction de sidebar.
- Fil d'Ariane `Accueil > Tableau de bord`.
- Sélecteur de tenant/contexte actif **si l'utilisateur peut changer de contexte** ; sinon afficher le tenant courant en lecture seule.
- Recherche globale tenant-scoped et permission-aware, si le service existe ; sinon fonctionnalité clairement indisponible ou lot différé.
- Notifications provenant d'événements réels, avec badge uniquement si comptage réel.
- Profil, paramètres personnels et déconnexion.
- Actualisation manuelle des widgets ; date de dernière mise à jour si disponible.

## 3. Structure de l'écran principal

Ordre visuel recommandé :

1. Topbar globale.
2. En-tête « Bienvenue sur Techzone Cloud » + courte description + contexte.
3. Indicateurs clés (KPI) — grille responsive.
4. Zone d'analyse (activité/tendance **si mesurable**) et santé des services.
5. Accès rapides aux modules.
6. Alertes et incidents récents.
7. Activités récentes.
8. Packs récents et environnements, selon droits et données.
9. Guide de démarrage conditionnel pour les nouveaux utilisateurs.

La composition est **adaptative** : aucun bloc vide ou artificiel ne doit être ajouté pour correspondre exactement à l'image.

## 4. KPI — contrat visuel et sources

| KPI candidat | Source propriétaire | Règle d'affichage |
|---|---|---|
| Applications | Business Manager | Nombre réel dans le périmètre courant |
| Packs publiés | Pack Manager | Uniquement statut publié réel |
| Déploiements | Deployment Manager | Compter une période explicitement indiquée |
| Applications actives | Pack Runtime | Statut d'activation/readiness réel |
| Alertes critiques | Observabilité | Uniquement alertes autorisées et actives |
| Utilisation des quotas | Subscription & Billing | Pourcentage seulement si quota et consommation comparables |
| Sources de données | Data Platform | KPI de substitution ou complément si pertinent |
| Connecteurs | Integration Hub | KPI de substitution ou complément si pertinent |

**Priorité :** conserver les KPI existants conformes au CDC V2 (Applications, Packs, Déploiements, Sources, Connecteurs). Les nouveaux KPI illustrés dans la maquette sont **conditionnels** à la disponibilité des données et aux permissions.

Chaque carte : libellé, valeur, unité/période, état de chargement, éventuelle tendance calculable, lien vers le module propriétaire. Pas de chiffres inventés ; pas de `0` pour une donnée inconnue. Distinguer `0`, `indisponible` et `accès refusé`.

## 5. Graphiques d'activité

Graphique optionnel d'évolution par période (7 jours, 30 jours, période disponible). Les séries (ex. requêtes, erreurs, déploiements) doivent avoir une source, une unité et une période compatibles. **Ne pas tracer latence (ms) et volume de requêtes sur un même axe sans échelle explicite.** Si aucune série historique fiable n'existe, remplacer le graphique par une section « Activité récente » ou un état « Historique indisponible ».

Prévoir légende, infobulles accessibles, affichage tabulaire alternatif, chargement progressif, filtre de période et lien vers Observabilité.

## 6. Santé de la plateforme

- Résumé des services visibles : `OPERATIONAL`, `DEGRADED`, `ERROR`, `UNAVAILABLE`, `UNKNOWN` selon les contrats existants.
- État par service : nom, badge, dernier contrôle connu, lien vers Observabilité ou module propriétaire.
- Un indicateur global n'est affiché que si sa méthode de calcul est fiable et documentée.
- Un service inconnu ne doit jamais apparaître comme « sain » par défaut.
- Les diagnostics détaillés restent dans Observabilité et les modules propriétaires.

## 7. Accès rapides aux modules

- Maximum **6 à 8 raccourcis prioritaires** sur l'Accueil, conformément au CDC V2.
- Bouton « Voir tous les modules » ouvrant le catalogue/navigation des modules accessibles.
- Priorisation selon rôle, contexte, usage ou personnalisation persistée si déjà supportée.
- Chaque carte : icône, titre, description brève, lien vers route existante, état autorisé/indisponible.
- Aucune carte ne déclenche directement une action métier destructive.

> La maquette illustrée affiche davantage de raccourcis pour montrer la diversité des 15 modules ; en production, limiter la grille initiale pour éviter la surcharge.

## 8. Alertes et incidents

Sources : Observabilité, validations Business/Pack, Runtime, Automation, Data, ERP, API, Deployment, Registry selon disponibilité.

- Niveaux `CRITICAL`, `ERROR`, `WARNING`, `INFO`.
- Carte : titre, module source, ressource, date, statut, lien profond.
- Tri prioritaire par sévérité puis récence, sans perdre la possibilité de filtrer.
- « Voir tout » redirige vers Observabilité ou le module propriétaire.
- Les alertes ne sont **pas** créées ni acquittées directement dans le dashboard sans contrat métier existant.

## 9. Activité récente

Événements réels uniquement : application créée, pack publié, déploiement effectué, workflow exécuté, synchronisation ERP, validation, entrée Registry, etc.

Champs : `eventType`, `module`, `resource`, `actor` (si autorisé), `timestamp`, `status`, `targetRoute` (selon contrat existant). Timeline avec 5 à 8 éléments maximum et lien « Voir tout ». Ne pas fabriquer d'événements de démonstration en mode REAL.

## 10. Packs récents et environnements

**Packs récents :** nom, version, statut, date, action d'ouverture de la fiche Pack.  
**Environnements :** nom réel, état, pack actif si connu, dernier déploiement et statut Runtime si disponible.

Ces sections sont optionnelles et peuvent apparaître sous les cartes principales ou dans un panneau « Activité et ressources ». Ne pas présumer que DEV/STAGING/PROD existent pour chaque tenant.

## 11. Guide de démarrage rapide

Visible prioritairement pour un tenant sans application ou un nouvel utilisateur ayant les permissions requises. Étapes :

1. Modéliser — Business Manager.
2. Construire l'interface — UI Builder.
3. Automatiser — Automatisation (facultatif selon application).
4. Composer, valider et publier — Pack Manager.
5. Déployer et exécuter — Deployment Manager / Pack Runtime.

L'avancement est **calculé à partir d'actions réelles** si les données existent. Sinon, afficher un guide statique sans pourcentage ni coche de progression fictive. Ne pas afficher des CTA inaccessibles.

## 12. Recherche et notifications

La recherche globale doit utiliser les contrats existants pour Applications, Packs, Workflows, Pages UI, Entités, Connecteurs, Registry Entries et Déploiements ; filtrage IAM/tenant **avant** exposition des résultats. État « aucun résultat » distinct d'une erreur réseau. Les notifications renvoient vers les objets propriétaires.

## 13. États transversaux

Chaque widget gère indépendamment :

- `LOADING` — skeleton, sans faux chiffre.
- `LOADED` — données disponibles.
- `EMPTY` — aucune donnée réelle.
- `ERROR` — échec technique avec retry local.
- `FORBIDDEN` — aucune exposition de données interdites ; masquer si approprié.
- `UNAVAILABLE` — source non déployée ou momentanément indisponible.
- `STALE` — dernière donnée connue, avec horodatage et indication explicite si ce mode existe.

Une panne ERP ou Runtime ne bloque pas tout l'Accueil.

## 14. Responsive

| Format | Comportement |
|---|---|
| Desktop ≥ 1440 px | Sidebar complète, 4–6 KPI par ligne selon largeur, zones d'analyse côte à côte |
| Laptop 1024–1439 px | Sidebar compacte, 2–4 KPI par ligne, panneaux adaptés |
| Tablette 768–1023 px | Drawer ou sidebar réduite, 2 KPI par ligne, graphiques pleine largeur |
| Mobile < 768 px | Drawer, 1 KPI par ligne (ou 2 si lisible), listes empilées, CTA accessibles |

Les seuils sont indicatifs ; réutiliser les breakpoints du Design System du repository s'ils existent. Aucun défilement horizontal de la page ; les tableaux peuvent disposer d'un conteneur scrollable.

## 15. Design System cible

- Sidebar bleu nuit, fond de contenu gris très clair, cartes blanches, bordures subtiles, radius cohérents.
- Bleu Techzone pour l'action primaire ; accents secondaires limités et sémantiques.
- Vert = opérationnel/succès ; ambre = attention ; rouge = erreur/critique ; neutre = inconnu/inactif.
- Typographie sans serif déjà utilisée dans le projet, sinon proposition Inter ; ne pas ajouter de police sans audit.
- Icônes Lucide si déjà disponibles.
- États focus visibles, contraste WCAG AA visé, navigation clavier, labels, lecteurs d'écran.
- Animations discrètes ~150–220 ms et respect de `prefers-reduced-motion`.
- Pas de couleur comme seul vecteur d'information.

## 16. Intégration à l'existant

**Audit préalable obligatoire :** routes, `GeneralOverviewView` si présent, `platformDashboardService` si présent, stores/slices, composants, widgets, services d'agrégation, permissions, contexte tenant, tests et design tokens.

Décisions possibles pour chaque bloc : `KEEP`, `IMPROVE`, `MERGE`, `COMPLETE`, `DEFER` ; `REPLACE` seulement si justifié. Préserver les fonctionnalités non représentées sur l'image en les intégrant dans les sections pertinentes.

**Architecture indicative, non imposée :** `Dashboard UI → API agrégée existante (ou contrat consolidé) → services propriétaires`. L'endpoint `/api/platform/dashboard` est une possibilité documentée par le CDC V2, **pas une route confirmée**.

Ne pas modifier le schéma Prisma ou le backend simplement pour reproduire un effet visuel. Toute évolution d'API doit être motivée, compatible, testée et autorisée.

## 17. Sécurité et gouvernance

- Le tenant courant est résolu côté serveur et validé ; ne jamais faire confiance au seul tenantId fourni par l'UI.
- Filtrage IAM par ressource, widget, route et résultat de recherche.
- Aucun secret, credential, token, trace sensible ou donnée d'un autre tenant dans les widgets, erreurs ou logs.
- Les actions rapides sont des navigations vers les modules propriétaires ; pas de contournement des validations, publications ou déploiements.
- Aucun mock silencieux en mode REAL. Des fixtures explicitement signalées sont acceptées **uniquement dans une galerie de maquettes isolée DEV/TEST**.

## 18. Performance et fiabilité

Chargement progressif des sections ; requête agrégée si disponible ; pagination/limitation des timelines ; refresh manuel ; cache court isolé par tenant et permission si autorisé ; ne pas faire de polling agressif sans besoin. Prévoir gestion des requêtes annulées lors du changement de contexte.

## 19. Critères d'acceptation UI/UX

- [ ] Le tableau de bord existant reste accessible à son URL actuelle ou redirige proprement.
- [ ] Aucune fonctionnalité existante n'a disparu sans décision documentée.
- [ ] Les 15 modules sont représentés dans la navigation **selon les droits**, sans obligation d'afficher 15 cartes sur l'Accueil.
- [ ] Le tenant actif et les droits sont respectés sur tous les widgets.
- [ ] Tous les KPI proviennent de données réelles ; périodes et unités sont explicites.
- [ ] Les widgets gèrent LOADING / EMPTY / ERROR / FORBIDDEN / UNAVAILABLE.
- [ ] Les erreurs partielles n'interrompent pas le reste de l'Accueil.
- [ ] Les raccourcis, alertes et activités ouvrent les routes propriétaires correctes.
- [ ] La recherche et les notifications n'exposent aucune ressource non autorisée.
- [ ] Le responsive desktop/tablette/mobile et l'accessibilité sont validés.
- [ ] Tests de régression et de sécurité multi-tenant réussis.
- [ ] Aucun changement backend/DB non nécessaire à la modernisation visuelle.

## 20. Stratégie de réalisation par lots

| Lot | Contenu | Critère de fin |
|---|---|---|
| DASH-00 | Audit et Gap Matrix | Inventaire fiable, sans code modifié |
| DASH-01 | Shell : sidebar, topbar, contexte | Navigation et droits préservés |
| DASH-02 | Header, KPI, accès rapides | Données réelles et liens corrects |
| DASH-03 | Activité, alertes, packs/environnements | Sources réelles, états partiels |
| DASH-04 | Santé, graphique si disponible, guide | Aucun statut ni historique fictif |
| DASH-05 | Responsive, accessibilité, tests | Régression et E2E validés |

**Git :** la branche active fait foi. Les décisions de commit/push doivent suivre les instructions explicites données à Codex pour cette mission ; ne pas inférer une branche fixe à partir d'un ancien document.

## 21. Points à confirmer après audit

Routes réelles, composants existants, API réellement disponibles, rôles, nomenclature de statuts, métriques historiques, notifications, recherche, persistance des préférences et design tokens. **Aucun de ces points n'est déclaré implémenté sans inspection du repository.**
