# Conformité des pages BM / PM / PR

Date d’audit : 2026-09-03. Statuts publics : `FUNCTIONAL`, `PARTIAL`, `API_MISSING`, `COMING_SOON`, `BROKEN`. L’état interne du menu emploie `AVAILABLE`, `PARTIAL`, `API_MISSING`, `COMING_SOON`, `DISABLED` et n’annonce jamais une page partielle comme terminée.

## Inventaire final

| Domaine | Page | Route | Statut | Source / limite principale |
|---|---|---|---|---|
| BM | Vue d’ensemble | `/business-manager` | FUNCTIONAL | collections BM API |
| BM | Applications | `/business-manager/applications` | FUNCTIONAL | CRUD principal API ; duplication manquante |
| BM | Versions & Lifecycle | `/business-manager/versions` | PARTIAL | validation/publication API ; opérations secondaires manquantes |
| BM | Data Model | `/business-manager/data-model` | PARTIAL | lecture/création/validation ; champs/relations incomplets |
| BM | Features & Capabilities | `/business-manager/features` | PARTIAL | lecture/création/association ; mutations secondaires incomplètes |
| BM | Menus & Navigation | `/business-manager/menus` | PARTIAL | menus/items/preview API ; archivage item manquant |
| BM | Configuration & Metadata | `/business-manager/configuration` | PARTIAL | définitions et valeurs API ; archivage définition manquant |
| BM | Contracts & Runtime Bridge | `/business-manager/contracts` | FUNCTIONAL | intégrations et snapshot/runtime bridge API |
| BM | Validation & Quality | `/business-manager/validation` | PARTIAL | campagnes, rapport et gate API ; catalogue des règles manquant |
| PM | Vue d’ensemble | `/pack-manager` | FUNCTIONAL | agrégats PM API |
| PM | Packs | `/pack-manager/packs` | PARTIAL | CRUD/archive/restore ; duplication manquante |
| PM | Versions | `/pack-manager/versions` | PARTIAL | create/update/validate/manifest/publish |
| PM | Modules | `/pack-manager/modules` | PARTIAL | create/list ; mutations secondaires manquantes |
| PM | Features & Capabilities | `/pack-manager/features` | PARTIAL | page PM dédiée, create/list/attach |
| PM | Dépendances | `/pack-manager/dependencies` | PARTIAL | create/list/validation publication ; preview CRUD manquant |
| PM | Règles & Conditions | `/pack-manager/rules` | PARTIAL | create/list/évaluation runtime ; simulation CRUD manquant |
| PM | Validation | `/pack-manager/validation` | PARTIAL | onglet de validation PM, sans réutilisation BM |
| PM | Publication | `/pack-manager/publication` | PARTIAL | pipeline PM et confirmation explicite |
| PM | Manifest | `/pack-manager/manifest` | FUNCTIONAL | génération, hash, JSON et téléchargement backend |
| PR | Vue d’ensemble | `/pack-runtime` | FUNCTIONAL | dashboard, contexte et résolutions API |
| PR | Runtime Context | `/pack-runtime/context` | PARTIAL | sélecteurs métier API ; registre avancé incomplet |
| PR | Resolver | `/pack-runtime/resolver` | FUNCTIONAL | résolution persistée et explicable |
| PR | Effective Manifest | `/pack-runtime/effective-manifest` | FUNCTIONAL | lecture effective manifest et JSON technique |
| PR | Runtime Status | `/pack-runtime/status` | PARTIAL | santé providers API |
| PR | Cache & Résilience | `/pack-runtime/cache` | PARTIAL | statut, entrées, invalidation et protections API |
| PR | Diagnostics | `/pack-runtime/diagnostics` | PARTIAL | diagnostics par résolution et re-resolve |
| PR | API Runtime | `/pack-runtime/api` | PARTIAL | contrats présents ; explorateur complet non livré |

## Synthèse chiffrée

- pages inventoriées : **27** ; `FUNCTIONAL` : **8** ; `PARTIAL` : **19** ; `BROKEN` : **0**.
- routes BM/PM/PR sans destination : **0**.
- pages PM envoyées vers une vue BM : **0** après correction des routes features et validation.
- vues contrôlées dans un navigateur réel : **9** par largeur, sur **3** largeurs.

Les fonctions partielles restent utilisables pour leur périmètre connecté. Une action non raccordée ouvre le contrat `API_MISSING` standardisé au lieu de muter une copie locale.
