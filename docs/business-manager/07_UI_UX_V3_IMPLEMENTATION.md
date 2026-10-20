# Business Manager — implémentation UI/UX V3

## Navigation

La navigation globale Business Manager expose exactement six entrées, filtrées par
les permissions existantes : Applications, Modèles de données, Fonctionnalités,
Navigation, Configuration et Validation. La route `/business-manager` rend
directement l’espace Applications ; l’ancienne vue globale n’est plus une entrée
de menu ni une destination d’ouverture.

Les deep links existants vers une application, une version, les modèles de
données, les fonctionnalités, la navigation et la validation sont préservés.

## Espaces de travail

- **Applications** : liste, recherche, filtres, création, édition, duplication,
  archivage/restauration et versions utilisent les services Business Manager
  existants.
- **Détail d’application** : Résumé, Versions, Métadonnées, Contrats et
  Historique. Les indicateurs et problèmes de validation proviennent des versions
  et rapports réellement retournés ; l’absence de source est signalée.
- **Modèles de données** : les éditeurs réels d’entités, champs, relations et
  contraintes restent dans le contexte application/version.
- **Fonctionnalités** : Features et Capabilities restent éditables ; les
  dépendances réelles sont accessibles depuis Capacities. Les Business Events
  sont explicitement indisponibles tant qu’un contrat backend dédié n’existe pas.
- **Navigation** : les menus et éléments de navigation métier restent séparés de
  l’UI Builder.
- **Configuration** : Paramètres métier et Contrats réutilisent les éditeurs
  existants. Métadonnées et permissions référencées ne sont pas fabriquées sans
  API propriétaire.
- **Validation** : garde les rapports, contrôles, liens vers les sections et les
  transitions backend de statut. La publication globale du pack ne fait pas
  partie de Business Manager.

## Intégrité

Les interfaces utilisent les primitives `bm/ui.jsx` et les tokens du Design
System. Les versions `PUBLISHED` sont rendues en lecture seule pour les actions
de création, modification, archivage, validation et transitions exposées par le
workspace. Aucun endpoint, contrat ou donnée de démonstration n’a été ajouté.
