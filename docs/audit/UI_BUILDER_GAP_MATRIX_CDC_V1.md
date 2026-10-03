# UI Builder — Gap Matrix CDC V1

Audit effectué le 2026-10-03 sur `mami`. Les constats s'appuient sur le code
actuel, sans déclarer une capacité absente sans recherche. Le UI Builder est
une définition déclarative associée à une `ApplicationVersion`; il n'introduit
pas une deuxième source de vérité pour les entités métier.

| CDC requirement | Existing backend | Existing frontend | Existing Prisma | Existing API | Existing tests | Evidence | Decision | Status |
|---|---|---|---|---|---|---|---|---|
| Contexte tenant/version | Résolution tenant de la version | Context Bar avec réinitialisation Redux | `UiPage.tenantId` | overview/pages/context | tenant scope + service | `ui-builder.service.ts` | KEEP | REAL |
| UI Project / définition | Définition assemblée par version | Consommée par preview | pages + thème | `GET /uidefinition/:version` | service | CDC §3-4 | ADAPT | PARTIAL: pas de table `UiProject` distincte, conforme au contrat v1 par version |
| Pages CRUD / routes | create/update/delete/reorder, lock version | Pages Manager | `UiPage` | pages | service + slice | `ui-builder.service.ts` | COMPLETE | REAL |
| Canvas / tree / inspector | Persisté dans JSON `components` | DnD HTML5, tree, inspector schema-driven | `UiPage.components` | PATCH page | slice | `UiVisualEditor.jsx` | KEEP | REAL |
| Component Registry | Validation fail-closed des types rendables | Catalogue unique et renderer commun | — | — | registry | registry + renderer | IMPROVE | REAL |
| Bindings BM | Vérifie entity/field dans BM | Resolver structuré, aucun mock de lignes | `BmEntity`/`BmField` réutilisés | business-context | backend/frontend | `getBusinessContext`, `validate` | KEEP | REAL |
| Forms / DataTable | Stockés comme composants | Form builder et DataTable renderer | composants JSON | PATCH page | slice/registry | registry | COMPLETE | PARTIAL: submit réel Data Runtime v2 non implémenté |
| Actions | Allowlist v1 et validation de routes/configs | Inspector actions | composants JSON | PATCH page | service | DTO + validation | IMPROVE | PARTIAL: Automation/Data Runtime seulement référencés, pas exécutés par le preview |
| Navigation | Ordre, icône, visibilité dans définition | Écran Navigation | `UiPage` | reorder/PATCH | slice | `UiNavigationPresentation.jsx` | KEEP | REAL |
| Theme / responsive | thème persistant, version verrouillée | builder thème + trois devices | `UiThemeSetting` | GET/PUT theme | service | `UiThemeBuilder.jsx` | KEEP | REAL |
| Preview / validation | Definition + ERROR/WARNING/INFO | Shared Renderer + cockpit | — | validate | service | `Renderer.jsx` | KEEP | PARTIAL: runtime Pack distinct ne consomme pas encore la définition UI |
| Undo/redo/autosave | persistance explicite | undo/redo et save state | — | PATCH page | slice | `uiBuilderSlice.js` | KEEP | PARTIAL: autosave debounce non activé par défaut |
| IAM | permissions UI Builder sur toutes les routes | navigation protégée | IAM existant | decorators backend | navigation tests | controller + constants | IMPLEMENT | REAL |
| Audit | événements page/thème | — | `AuditEvent` | interne | service | `audit()` | KEEP | PARTIAL: validation read-only n'écrit pas d'audit |
| Pack Manager / Runtime | aucun contrat UI importé | preview local | — | — | — | Pack Runtime inspecté | DEFER | ABSENT: nécessite une extension coordonnée du manifest Pack |
| IA / collaboration | — | — | — | — | — | CDC §15 | DEFER | ABSENT par conception |

## Décisions et frontières

- Business Manager reste la source de vérité pour applications, versions,
  entités, champs et permissions.
- Le UI Builder stocke seulement des références typées et une composition UI.
- Pack Manager reste responsable de validation/publication; UI Builder ne
  publie rien automatiquement.
- Le runtime actuel ne doit pas être présenté comme interprétant des pages UI
  tant que le manifest Pack ne porte pas explicitement la UI Definition.
