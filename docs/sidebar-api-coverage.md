# Couverture API du sidebar

> Matrice de découverte historique. La couverture BM/PM/PR finale est maintenue dans `api-frontend-coverage.md` et le backlog dans `bm-pm-pr-api-missing-actions.md`.

La couverture ci-dessous ne recense que les endpoints utiles à une page. Les endpoints techniques, internes et runtime-only restent explicitement hors UI jusqu'à l'existence d'un besoin utilisateur.

| Menu | Page | Endpoint | Méthode | UI_REQUIRED | Utilisé frontend | Testé | Statut |
|---|---|---|---|---|---|---|---|
| Business Manager | Applications | `/api/v1/business-manager/applications` | GET | YES | Oui | Oui | FONCTIONNEL |
| Business Manager | Applications | `/api/v1/business-manager/applications` | POST | YES | Oui | Oui | FONCTIONNEL |
| Business Manager | Applications | `/api/v1/business-manager/applications/:id` | PATCH | YES | Oui | Oui | FONCTIONNEL |
| Business Manager | Applications | `/api/v1/business-manager/applications/:id/archive` | POST | YES | Oui | Oui | FONCTIONNEL |
| Business Manager | Versions | `/api/v1/business-manager/applications/:id/versions` | GET/POST | YES | Oui | Oui | PARTIEL |
| Business Manager | Lifecycle | `/api/v1/business-manager/applications/:id/transition` | POST | YES | Oui | Oui | PARTIEL |
| Business Manager | Data Model | `/api/v1/business-manager/applications/:applicationId/versions/:versionId/models` | GET/POST | YES | Partiel | Oui | PARTIEL |
| Business Manager | Data Model | `/api/v1/business-manager/applications/:applicationId/versions/:versionId/models/:modelId/validate` | POST | YES | Partiel | Oui | PARTIEL |
| Business Manager | Features | `/api/v1/business-manager/features` | GET/POST | YES | Partiel | Oui | PARTIEL |
| Business Manager | Capabilities | `/api/v1/business-manager/capabilities` | GET/POST | YES | Partiel | Oui | PARTIEL |
| Business Manager | Menu Engine | `/api/v1/business-manager/menus` | GET/POST | YES | Partiel | Non | PARTIEL |
| Business Manager | Menu Engine | `/api/v1/business-manager/application-versions/:versionId/navigation/preview` | GET | YES | Partiel | Non | PARTIEL |
| Business Manager | Configuration | `/api/v1/business-manager/configuration/definitions` | GET/POST/PATCH | YES | Partiel | Non | PARTIEL |
| Business Manager | Runtime Bridge | `/api/v1/business-manager/application-versions/:versionId/runtime-manifest` | GET | YES | Oui | Oui | FONCTIONNEL |
| Business Manager | Runtime Bridge | `/api/v1/business-manager/application-versions/:versionId/contracts` | GET/POST | YES | Partiel | Oui | PARTIEL |
| Business Manager | Validation | `/api/v1/business-manager/applications/:applicationId/versions/:versionId/validate` | POST | YES | Oui | Oui | FONCTIONNEL |
| Business Manager | Quality | `/api/v1/business-manager/application-versions/:versionId/quality/campaigns` | GET/POST | YES | Partiel | Oui | PARTIEL |
| Business Manager | Publication | `/api/v1/business-manager/applications/:applicationId/versions/:versionId/publish` | POST | YES | Oui | Oui | FONCTIONNEL |
| Pack Manager | Dashboard | `/api/pack-manager/dashboard` | GET | YES | Oui | Oui | PARTIEL |
| Pack Manager | Packs | `/api/pack-manager/packs` | GET/POST | YES | Oui | Oui | PARTIEL |
| Pack Manager | Packs | `/api/pack-manager/packs/:id` | GET/PATCH | YES | Oui | Oui | PARTIEL |
| Pack Manager | Packs | `/api/pack-manager/packs/:id/archive` | POST | YES | Oui | Oui | PARTIEL |
| Pack Manager | Pack Versions | `/api/pack-manager/packs/:packId/versions` | GET/POST | YES | Oui | Oui | PARTIEL |
| Pack Manager | Modules | `/api/pack-manager/versions/:versionId/modules` | GET/POST | YES | Oui | Oui | PARTIEL |
| Pack Manager | Features | `/api/pack-manager/versions/:versionId/features` | GET/POST | YES | Oui | Oui | PARTIEL |
| Pack Manager | Dependencies | `/api/pack-manager/versions/:versionId/dependencies` | GET/POST | YES | Oui | Oui | PARTIEL |
| Pack Manager | Rules | `/api/pack-manager/versions/:versionId/rules` | GET/POST | YES | Oui | Oui | PARTIEL |
| Pack Manager | Validation | `/api/pack-manager/versions/:id/validate` | POST | YES | Oui | Oui | FONCTIONNEL |
| Pack Manager | Manifest | `/api/pack-manager/versions/:id/manifest` | GET/POST | YES | Oui | Oui | FONCTIONNEL |
| Pack Manager | Publication | `/api/pack-manager/versions/:id/publish` | POST | YES | Oui | Oui | FONCTIONNEL |
| Pack Runtime | Resolver | `/api/runtime/resolve` | POST | YES | Oui | Oui | FONCTIONNEL |
| Pack Runtime | Resolutions | `/api/runtime/resolutions` | GET/POST | YES | Oui | Oui | FONCTIONNEL |
| Pack Runtime | Effective Manifest | `/api/runtime/resolutions/:id/effective-manifest` | GET | YES | Oui | Oui | FONCTIONNEL |
| Pack Runtime | Diagnostics | `/api/runtime/resolutions/:id/diagnostics` | GET | YES | Partiel | Oui | PARTIEL |
| Pack Runtime | Cache | `/api/runtime/cache/status` | GET | YES | Non | Oui | PARTIEL |
| Pack Runtime | Résilience | `/api/runtime/resilience/status` | GET | YES | Non | Oui | PARTIEL |
| Pack Runtime | Runtime technique | `/api/runtime/providers/:provider/probe` | POST | NO | Non | Oui | INTERNE |
| Pack Runtime | Runtime technique | `/api/runtime/resolutions/:id/diagnostics/export` | POST | NO | Non | Non | REPORTÉ |
| Auth + IAM + Context | Session | `/api/v1/auth/session` | POST | YES | Oui | Oui | FONCTIONNEL |
| Auth + IAM + Context | Utilisateurs | endpoint utilisateurs dédié | GET | YES | Non | Non | MANQUANT |
| Auth + IAM + Context | Permissions | guards et décorateurs backend | - | NO | Oui | Oui | INTERNE |
| Observability & Security | Audit | endpoints activity/audit BM | GET | YES | Partiel | Oui | PARTIEL |
| Platform Foundation | Snapshots | endpoints snapshot BM | GET/POST | YES | Partiel | Oui | PARTIEL |
| UI Builder / Experience Engine | Toutes les pages | - | - | YES | Non | Non | PLACEHOLDER |
| Data Model Manager | Relations | - | - | YES | Non | Non | PLACEHOLDER |
| Query Engine | Toutes les pages | - | - | YES | Non | Non | PLACEHOLDER |
| Feature & Capability Manager | Matrice | endpoints impact/snapshot BM | GET | YES | Partiel | Oui | PARTIEL |
| Rules & Formula Engine | Simulation | - | - | YES | Non | Non | PLACEHOLDER |
| Workflow Engine | Toutes les pages | - | - | YES | Non | Non | PLACEHOLDER |
| Approval Engine | Circuits | - | - | YES | Non | Non | PLACEHOLDER |
| Automation Engine | Toutes les pages | - | - | YES | Non | Non | PLACEHOLDER |
| Notification Manager | Toutes les pages | - | - | YES | Non | Non | PLACEHOLDER |
| Report & Document Builder | Toutes les pages | - | - | YES | Non | Non | PLACEHOLDER |
| Extension & Template Manager | Toutes les pages | - | - | YES | Non | Non | PLACEHOLDER |
| Integrations | Bindings | `/api/v1/business-manager/application-versions/:versionId/integration-bindings` | GET/POST | YES | Partiel | Oui | PARTIEL |
| Developer Platform | API Explorer | `/api/docs` | GET | YES | Non | Non | DISPONIBLE EXTERNE |
| Marketplace | Toutes les pages | - | - | YES | Non | Non | PLACEHOLDER |
| Version & Sandbox Manager | Comparaisons | `/api/v1/business-manager/applications/:id/versions/:versionId/compare/:otherVersionId` | GET | YES | Non | Oui | À CONNECTER |
| Publication & Rollback Manager | Rollback | controller rollback BM | POST | YES | Partiel | Oui | À CONNECTER |
| Platform Administration | Configuration | `/api/v1/business-manager/configuration/*` | GET/POST/PATCH/DELETE | YES | Partiel | Oui | PARTIEL |
