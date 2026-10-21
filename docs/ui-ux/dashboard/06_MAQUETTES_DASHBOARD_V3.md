# 06 — MAQUETTES UI/UX — ACCUEIL TECHZONE CLOUD V3

**Projet :** Techzone Cloud V3  
**Périmètre :** Accueil / Dashboard transversal  
**Version :** 3.0 — proposition de maquettes  
**Référence fonctionnelle :** `03_SPEC_UI_DASHBOARD_V3.md`  
**Référence visuelle :** maquette « Bienvenue sur Techzone Cloud » générée en conversation.

> Les identifiants M01–M18 ci-dessous servent à la traçabilité. **18 maquettes/variantes ne signifient pas 18 routes** : l'écran principal est unique ; les autres références sont des états, composants, interactions et déclinaisons responsive. Les chiffres, dates, utilisateurs et statuts de l'image de référence sont purement illustratifs.

## 1. Identité visuelle

- Sidebar bleu nuit et logo Techzone Cloud.
- Surface principale gris très clair, cartes blanches, bordures discrètes, ombres légères.
- Hiérarchie visuelle nette, typographie professionnelle et composants du Design System existant.
- Accent primaire bleu ; couleurs d'état sémantiques et cohérentes.
- Icônes Lucide si présentes dans le projet.
- Interface française ; labels courts et explicites.
- Données de démonstration **visiblement marquées** dans une galerie DEV/TEST ; aucune donnée factice en REAL.

## 2. Arborescence cible

```text
ACCUEIL TECHZONE CLOUD
└── M01 Dashboard desktop [PAGE PRINCIPALE]
    ├── M02 Sidebar globale [COMPOSANT]
    ├── M03 Topbar et contexte [COMPOSANT]
    ├── M04 En-tête et actions [SECTION]
    ├── M05 Cartes KPI [COMPOSANT]
    ├── M06 Activité / graphique [SECTION CONDITIONNELLE]
    ├── M07 Santé des services [SECTION CONDITIONNELLE]
    ├── M08 Accès rapides [SECTION]
    ├── M09 Alertes / incidents [SECTION]
    ├── M10 Activité récente [SECTION]
    ├── M11 Packs / environnements [SECTION CONDITIONNELLE]
    ├── M12 Guide de démarrage [SECTION CONDITIONNELLE]
    ├── M13 Recherche globale [POPOVER/OVERLAY]
    ├── M14 Notifications [POPOVER/DRAWER]
    ├── M15 États loading/empty/error [ÉTATS PARTAGÉS]
    ├── M16 Forbidden/unavailable [ÉTATS PARTAGÉS]
    ├── M17 Tablette [VARIANTE RESPONSIVE]
    └── M18 Mobile [VARIANTE RESPONSIVE]
```

## M01 — Accueil Dashboard (desktop)

**Type :** page principale unique.  
**Disposition :** sidebar fixe à gauche ; topbar ; contenu central fluide.

**Zones visibles :**

1. Bienvenue + contexte courant.
2. KPI en grille.
3. Activité et santé, si sources disponibles.
4. Accès rapides (6–8 modules prioritaires).
5. Alertes et activités récentes.
6. Packs récents / environnements selon données et place.
7. Guide de démarrage conditionnel.

**Interactions :** clic KPI → module propriétaire ; clic alerte → détail ; changement de contexte → recharge contrôlée ; actualisation → refresh.

**Interdit :** inventer 12 applications, 8 packs, 68 % de quotas ou « tous les services opérationnels » simplement parce que l'image les montre.

## M02 — Sidebar globale

**Type :** composant commun réutilisable dans toute la plateforme.

**Contenu :** Accueil, Création d'applications, Publication & Exécution, Données & Intégrations, Supervision, Commercial, Administration & Infrastructure. Les 15 modules sont rangés dans ces groupes.

**États :** déployée, compacte, groupe ouvert/fermé, élément actif, élément masqué par IAM, drawer mobile.

**Règle :** une seule source de vérité pour la navigation ; pas de deuxième sidebar spécifique au Dashboard.

## M03 — Topbar / Contexte

**Type :** composant commun.

**Contenu :** bouton menu, breadcrumb, tenant actif, recherche, notifications, profil, éventuellement refresh.

**États :** tenant unique, tenant multiple, changement en cours, notifications absentes, recherche indisponible, profil ouvert.

**Sécurité :** ne jamais afficher des tenants ou ressources non autorisés.

## M04 — En-tête d'accueil

**Type :** section.

**Contenu :** « Bienvenue sur Techzone Cloud », sous-titre « Construisez, déployez et gérez vos applications métier », contexte et date de dernière actualisation si disponible.

**Variante :** message d'onboarding pour tenant sans application. Éviter de doubler les KPI par de grands chiffres dans le hero.

## M05 — KPI

**Type :** composant de carte réutilisable.

**KPI de base issus du CDC V2 :** Applications, Packs, Déploiements, Sources, Connecteurs.  
**KPI complémentaires conditionnels :** Applications actives, Alertes critiques, Utilisation des quotas.

**États :** valeur réelle, valeur 0, chargement, non disponible, interdit, tendance calculée, sans tendance.

**Affichage :** titre, valeur, unité/période, icône, variation seulement si historique fiable, navigation.

## M06 — Activité globale / graphique

**Type :** section optionnelle.

**Contenu :** graphique temporel avec filtre de période, légende, unités et source.

**Variantes :** une série, plusieurs séries compatibles, données insuffisantes, indisponible, alternative tabulaire accessible.

**Règle :** ne pas mixer arbitrairement des unités incompatibles sur un seul axe ; si aucune métrique historique n'existe, privilégier M10.

## M07 — Santé des services

**Type :** section optionnelle.

**Contenu :** résumé global si calculable ; liste des services pertinents et leur état réel ; lien vers Observabilité.

**États :** opérationnel, dégradé, erreur, indisponible, inconnu. Afficher l'horodatage si disponible.

**Règle :** ne pas convertir « inconnu » en « sain » ; éviter le doublon avec le cockpit complet Observabilité.

## M08 — Accès rapides

**Type :** grille de cartes.

**Contenu :** 6–8 modules prioritaires autorisés, icône, nom, description et chevron ; action « Voir tous les modules ».

**États :** carte disponible, route non autorisée (masquée), module temporairement indisponible, favoris si fonctionnalité existante.

**Règle :** ne pas afficher simultanément 15 raccourcis et 15 entrées de sidebar si cela surcharge l'accueil.

## M09 — Alertes et incidents récents

**Type :** liste compacte.

**Contenu :** sévérité, titre, module, ressource, date/heure, lien de détail.

**États :** aucune alerte, alerte critique, avertissement, source indisponible, accès refusé.

**Règle :** un clic ouvre Observabilité ou le module propriétaire ; pas de moteur d'incident parallèle.

## M10 — Dernières activités

**Type :** timeline compacte.

**Contenu :** événement, objet, module, horodatage, statut ; 5–8 éléments puis « Voir tout ».

**États :** vide, chargement, événements partiels, erreur de source.

**Règle :** événements réels uniquement, pas de faux historique.

## M11 — Packs récents et environnements

**Type :** panneaux optionnels.

**Packs :** nom, version, statut, date, lien vers Pack Manager.  
**Environnements :** nom, statut, version déployée, dernier déploiement, lien vers Deployment Manager.

**Variantes :** tenant sans pack, tenant sans environnement, permissions limitées. Ne pas créer des environnements fictifs.

## M12 — Guide de démarrage rapide

**Type :** panneau conditionnel.

**Étapes :** Modéliser → Créer l'interface → Automatiser (si pertinent) → Publier le pack → Déployer et exécuter.

**États :** nouveau tenant, progression réelle, guide statique, utilisateur sans permission, parcours terminé.

**Règle :** pas de pourcentage de progression inventé ; chaque CTA renvoie vers le module propriétaire.

## M13 — Recherche globale

**Type :** popover/overlay, pas une page dédiée obligatoire.

**Contenu :** champ de recherche, groupes de résultats autorisés (Applications, Packs, Workflows, UI, Data, ERP, Registry, Deployments), navigation clavier, résultats vides, erreurs.

**Règle :** utiliser la recherche existante si elle existe ; ne pas créer un faux moteur local en production.

## M14 — Notifications

**Type :** popover ou drawer.

**Contenu :** événements réels, catégorie, statut de lecture si supporté, horodatage, lien.

**États :** aucune notification, non lues, erreur, chargement. Aucun compteur inventé.

## M15 — États Loading / Empty / Error

**Type :** bibliothèque d'états partagés.

**Loading :** skeleton de carte, tableau ou graphique.  
**Empty :** « Aucune application pour ce tenant », CTA si autorisé.  
**Error :** erreur localisée au widget, bouton « Réessayer » si possible.

**Règle :** ne pas bloquer toute la page pour une source partiellement défaillante.

## M16 — États Forbidden / Unavailable

**Type :** bibliothèque d'états partagés.

**Forbidden :** masquer le contenu protégé ; écran 403 uniquement lorsque la route entière est interdite.  
**Unavailable :** source indisponible avec libellé explicite ; ne jamais montrer 0 à la place.

**Règle :** les contrôles frontend ne remplacent pas IAM backend.

## M17 — Accueil tablette

**Type :** variante responsive de M01, pas une route distincte.

**Disposition :** sidebar compacte/drawer ; 2 KPI par ligne ; graphique et santé empilés ; accès rapides en 2 colonnes ; listes en largeur disponible.

**Interactions :** filtres en popover, navigation tactile, scroll vertical naturel.

## M18 — Accueil mobile

**Type :** variante responsive de M01, pas une route distincte.

**Disposition :** topbar compacte, drawer, contexte tenant accessible, KPI en 1 colonne ou 2 selon largeur, sections empilées, raccourcis prioritaires, alertes avant éléments secondaires.

**États :** recherche et notifications en plein écran/drawer si nécessaire ; graphiques lisibles ou vue tabulaire alternative ; aucun débordement horizontal.

## 3. Matrice de correspondance avec les modules

| Élément Accueil | Module propriétaire | Destination |
|---|---|---|
| Applications | Business Manager | Liste des applications |
| Packs publiés / récents | Pack Manager | Packs / versions |
| Déploiements / environnements | Deployment Manager | Déploiements / environnement |
| Applications actives | Pack Runtime | Applications actives |
| Sources | Data Platform | Sources |
| Connecteurs ERP | Integration Hub | Instances / connecteurs |
| Alertes / santé | Observabilité | Alertes / services |
| Quotas | Subscription & Billing | Utilisation / quotas |
| Utilisateurs / tenants | IAM / Administration | Écrans administratifs autorisés |
| Registry | Registry Platform | Catalogue |

**Le Dashboard affiche et redirige ; il ne duplique pas les écrans de gestion de ces modules.**

## 4. Composants à mutualiser

`AppShell`, `Sidebar`, `Topbar`, `TenantSwitcher`, `Breadcrumbs`, `SearchOverlay`, `NotificationPopover`, `KpiCard`, `ModuleShortcutCard`, `StatusBadge`, `ActivityTimeline`, `AlertList`, `HealthStatusList`, `ChartContainer`, `EmptyState`, `ErrorState`, `LoadingSkeleton`, `PermissionGate`, `OnboardingSteps`.

Noms indicatifs uniquement : **réutiliser les composants déjà présents** avant de créer de nouvelles abstractions.

## 5. Ordre de génération des maquettes

| Lot | Références | Objectif |
|---|---|---|
| UI-01 | M01–M04 | Structure et navigation |
| UI-02 | M05–M08 | KPI, activité, santé, raccourcis |
| UI-03 | M09–M12 | Alertes, activité, packs, onboarding |
| UI-04 | M13–M16 | Recherche, notifications, états |
| UI-05 | M17–M18 | Tablette, mobile |

**Ne pas créer 18 pages React.** M01 est la page, M02–M16 sont principalement des composants/états, M17–M18 des variantes.

## 6. Contraintes pour Codex

1. Auditer l'Accueil existant, les routes et les composants avant toute modification.
2. Conserver les fonctionnalités existantes, même absentes de la maquette illustrée.
3. Utiliser `03_SPEC_UI_DASHBOARD_V3.md` pour le comportement, ce fichier pour l'inventaire et l'image pour l'inspiration visuelle.
4. Ne pas recopier les chiffres, dates, noms, badges ni graphiques de l'image comme données de production.
5. Connecter les widgets aux services réels ; en cas d'absence, afficher l'état approprié ou différer le widget.
6. Garder les API et permissions existantes ; ne pas inventer une route backend comme si elle existait.
7. Tester changement de tenant, accès refusé, erreurs partielles, responsive, clavier et liens profonds.
8. Réaliser par lots incrémentaux avec bilan des changements et régressions.

## 7. Checklist de validation des maquettes

- [ ] Les sections reprennent l'intention visuelle de la maquette Accueil.
- [ ] La sidebar couvre les 15 modules par groupes et respecte IAM.
- [ ] L'Accueil ne devient pas un second écran d'Administration ou d'Observabilité.
- [ ] Le nombre de raccourcis initiaux est limité.
- [ ] Les métriques et états sont toujours sourcés ou explicitement indisponibles.
- [ ] Aucun contenu existant utile n'est supprimé sans justification.
- [ ] Les variantes desktop/tablette/mobile sont cohérentes.
- [ ] Les états de chargement, vide, erreur, interdit et indisponible sont visibles.
- [ ] Les actions et liens conduisent aux modules propriétaires.
- [ ] La galerie DEV/TEST, si créée, est isolée de la production.

## 8. Résultat attendu

**Une seule page d'Accueil Techzone Cloud V3 modernisée**, des composants mutualisés et leurs variantes responsive/états, intégrés progressivement à l'application existante. Les 18 références servent au suivi de conception, pas à multiplier les routes.
