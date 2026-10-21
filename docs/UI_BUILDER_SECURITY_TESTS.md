# UI Builder — sécurité P1 sur Ranja

## Exécution

- Backend : `cd backend && npm run test:security:ui`.
- Frontend : `cd frontend && npm run test:security:ui`.
- HTTP/IAM/PostgreSQL : `cd backend && npm run test:e2e -- --runInBand`, exclusivement avec TEST_DATABASE_URL isolée.

Les étapes CI dédiées sont bloquantes (aucun continue-on-error). Les tests IAM HTTP restent dans l’étape E2E existante. Push sur Ranja et PR déclenchent les vérifications. Les tests unitaires ne remplacent pas une exécution PostgreSQL.

## Couverture et limites

| Cas | Preuve automatisée |
|---|---|
| SEC-UI-001/010 | ui-builder.security.spec.ts et IAM E2E : version étrangère refusée avant lecture des données |
| SEC-UI-002/090 | service et IAM E2E : modification de page étrangère refusée |
| SEC-UI-003 | lecture d’un formulaire étranger refusée ; pas d’endpoint de clonage dédié dans le contrat actuel |
| SEC-UI-011 | service : page hors version détectée ; Pack : version du snapshot incompatible bloquée |
| SEC-UI-020/021/080 | guard IAM réel avec métadonnées des routes, plus HTTP E2E page/theme ; permissions Data Runtime testées indépendamment de la visibilité UI |
| SEC-UI-030/031 | composant inconnu, chemin de module et noms hérités rejetés par registre ; renderer contrôlé |
| SEC-UI-040/041 | props exécutables refusées ; markup affiché comme texte, sans insertion HTML |
| SEC-UI-050 | entité absente du registre tenant/version refusée ; requête Prisma filtrée vérifiée |
| SEC-UI-051 | champ absent du modèle refusé et contrôles de permission Data Runtime testés ; pas de certification exhaustive de permissions par champ existant |
| SEC-UI-060/061 | CALL_API refusé avant stockage ; headers/Authorization interdits même sur une action connue ; HTTP E2E vérifie l’absence d’écriture |
| SEC-UI-070 | référence explicitement étrangère ou sans propriétaire refusée ; référence au tenant courant acceptée |
| SEC-UI-091 | resolver et contrôles éditeur : page supprimée/inconnue → fallback contrôlé |
| SEC-UI-100/101 | contrôles partagés et consumers : changements select et recherche par valeur |
| SEC-UI-110/111 | Pack : mismatch version, immutabilité publiée et hash altéré ; frontend : hash publié différent de la résolution refusé |
| SEC-UI-120 | renderer : composant inconnu publié → erreur contrôlée, sans exécution |
| SEC-UI-121 | application publiée : résolution absente, bloquée, inexécutable ou étrangère → aucun chargement ni rendu |
| SEC-UI-130 | clés sensibles et headers interdits dans JSON, thème et actions ; anciennes données sensibles refusées à la lecture UI Definition/thème |
| SEC-UI-140 | ValidationPipe rejette champs privilégiés et status ; service écrit explicitement les seuls champs autorisés |

## Corrections

Le contrôle JSON refuse les clés de credentials connues. Il ne constitue pas un détecteur universel de secrets dans du texte libre. Les messages d’erreur ne réaffichent pas les valeurs sensibles rejetées.

Le UI Builder refuse les références Automation sans tenant vérifiable. Le registre Automation historique est global et ses workflows peuvent ne pas porter de tenant ; ces références bloquent désormais la validation UI jusqu’à l’attribution d’un périmètre serveur. Les propriétés de scope sont déclarées sur WorkflowDefinition et ne sont pas ajoutées aux DTO publics.

L’application publiée attend une résolution Runtime RESOLVED/executable correspondant au tenant et au pack/version, puis vérifie que le hash du manifest chargé correspond au manifest résolu. Le contrôle frontend ne remplace pas les guards API ni les autorisations Data Runtime.

## Résultats locaux

- Backend sécurité : 143 tests réussis.
- Frontend sécurité : 115 tests réussis, 2 tests PostgreSQL ignorés par leur configuration existante.
- Build frontend réussi ; build backend sous Node 22.
- E2E HTTP ajouté mais non exécuté : runner arrêté avec `TEST_DATABASE_URL is not configured`. Aucune utilisation de la base applicative en substitution.
- Le parcours complet navigateur Login → Create → Bind Product → Preview → Validate → Page B reste à certifier sur environnement E2E ; les suites locales ne prouvent pas ce parcours de bout en bout.

Le DoD sécurité complet ne doit pas être déclaré acquis tant que ces vérifications E2E et les permissions fines de champs ne sont pas certifiées.
