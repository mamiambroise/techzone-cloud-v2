# Backlog des actions API manquantes BM / PM / PR

Règle d’implémentation : chaque action de cette liste passe par le registre `missing()` de `AppContext`. Elle affiche `ApiNotImplementedAlert`, retourne `API_MISSING`, ne modifie aucune collection et n’émet aucun toast de succès.

| Domaine / CDC | Actions utilisateur bloquées | Contrats backend attendus |
|---|---|---|
| BM-CDC-01 | dupliquer une application | `POST /api/v1/business-manager/applications/:id/clone` |
| BM-CDC-03 | modifier/archiver un modèle ; ajouter/modifier/supprimer un champ ; ajouter/supprimer une relation | endpoints `models/:id`, `fields/:id`, `relations/:id` |
| BM-CDC-05 | archiver un item de menu | `POST /api/v1/business-manager/menu-items/:id/archive` |
| BM-CDC-06 | archiver une définition de configuration | `POST /api/v1/business-manager/configuration/definitions/:id/archive` |
| BM-CDC-07 | modifier/archiver une intégration | `PATCH` et `POST .../integrations/:id/archive` |
| BM-CDC-08 | consulter le catalogue versionné des règles qualité | `GET /api/v1/business-manager/quality/rules` |
| PM-CDC-02 | dupliquer un pack | `POST /api/pack-manager/packs/:id/duplicate` |
| PM-CDC-03 | rollback et dépréciation de version | `POST /api/pack-manager/versions/:id/rollback|deprecate` |
| PM-CDC-04 | modifier/archiver un module | `PATCH /modules/:id`, `POST /modules/:id/archive` |
| PM-CDC-05 | modifier/archiver/toggle feature ; modifier/archiver capability | endpoints `/features/:id` et `/capabilities/:id` |
| PM-CDC-06 | modifier/supprimer une dépendance ; prévisualiser la résolution | endpoints `/dependencies/:id`, `/versions/:id/dependencies/resolve` |
| PM-CDC-07 | modifier/archiver/toggle une règle ; simuler les règles | endpoints `/rules/:id`, `/versions/:id/rules/simulate` |

Total d’actions explicitement protégées dans le registre : **29**. La mise à jour des métadonnées d’une version PM a été retirée de cette liste après raccordement de `PATCH /api/pack-manager/versions/:id`.

## IAM hors périmètre fonctionnel BM/PM/PR

La création de compte et la réinitialisation de mot de passe affichent également l’alerte standard. Le fournisseur IAM contractuel reste à raccorder ; aucun compte, mot de passe ou jeton n’est stocké dans le navigateur.
