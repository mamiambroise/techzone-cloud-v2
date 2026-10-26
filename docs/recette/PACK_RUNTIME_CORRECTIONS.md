# Pack Runtime — corrections du 20 octobre 2026

Branche : `Nassa`. Cible : base du `.env`, `techzonecloud_dev`, schéma `business_manager`. Références : les six documents de `Cahiers de charges/TECHZONE_PACK_RUNTIME_V3`.

## Incident `/runtime`

Le frontend charge le registre Pack Manager avec le dashboard. Le modèle Prisma `Pack` contient `applicationId`, mais cette colonne était absente de PostgreSQL. Les migrations du 13 au 16 octobre n'étaient pas appliquées. La migration existante `20261015000000_pack_application_scope` ajoute la colonne, sa clé étrangère et sa liaison depuis les versions de pack non ambiguës. Les migrations ont été appliquées sans reset ni suppression des données métier.

Lors du contrôle HTTP initial, le frontend répondait sur 3000 et le backend ne répondait pas sur 3003. Le traceId historique fourni par l'utilisateur ne peut pas être relié à un journal local absent ; le diagnostic de schéma est confirmé indépendamment par PostgreSQL.

La reconstruction a également révélé un cache TypeScript conservé hors de `dist`, alors que Nest supprime `dist` avant de compiler. `tsBuildInfoFile` est maintenant placé dans `dist` afin qu'une reconstruction propre ne puisse pas réutiliser un cache dont les fichiers de sortie ont été effacés.

La première version de la nouvelle migration ajoutait aussi la colonne existante dans une migration antérieure. Cette tentative a été annulée, marquée rolled back par Prisma, puis corrigée : la nouvelle migration ajoute uniquement l'index d'unicité du contexte actif. L'état final des migrations est vérifié dans `runtime-db-verification.json`.

## Corrections livrées

| Exigence du CDC | Mise en œuvre |
|---|---|
| Résolution serveur seule autorité | `RuntimeExecutionService`, partagé entre Pack Runtime et Data Runtime |
| EXECUTABLE uniquement | Suppression de la promotion implicite de `RESOLVED` ; manifeste effectif obligatoire, exécutable et intègre |
| Expiration | Résolutions nouvellement créées valables 30 minutes ; expiration persistée dans `RuntimeResolution.result.expiresAt` |
| Cohérence de version | PackVersion, version métier, snapshot UI et businessContext UI doivent référencer la même version |
| Intégrité | Recalcul du hash effectif, du manifeste publié et du snapshot avant exécution |
| Activation persistée | Réutilisation de `RuntimeResolution.result.runtimeContext`, sans nouvelle table |
| Une activation par scope | Verrou transactionnel tenant/application/environnement et index PostgreSQL partiel |
| Idempotence | Une seconde activation de la même résolution conserve son identifiant de contexte |
| Readiness locale | Revalidation de la définition métier, de la publication/UI et de PostgreSQL ; les contrats externes non pris en charge bloquent la résolution |
| Désactivation | Contexte INACTIVE persistant, audit et invalidation du cache applicatif |
| Permissions | `runtime.activate` et `runtime.deactivate` ajoutées au catalogue IAM et au rôle application_manager ; aucune affectation utilisateur créée |
| Rendu publié | Chargement depuis l'endpoint serveur `execution-manifest` ; aucun fallback au manifeste brut |
| Data Runtime | Preuve obligatoire pour les ressources BM publiées, même si le navigateur omet son en-tête d'origine ; vérification du binding et conservation des contrôles IAM |
| Transport de la preuve | Les formulaires, tableaux, fiches et sélecteurs de relations transmettent `X-Runtime-Resolution-Id` ; en-têtes autorisés par CORS |
| Cache | Réponse HIT cohérente avec MISS, expiration persistée contrôlée ; invalidation sur activation/désactivation |
| États UI | Activations issues des contextes persistés ; absence de pack publié explicite ; aucun statut Active/OK fabriqué |
| Diagnostic de schéma | HTTP 503 `DATABASE_SCHEMA_OUTDATED` plutôt qu'un 500 générique ; aucun SQL ou identifiant secret exposé |

## API ajoutées

```text
POST /api/runtime/resolutions/:id/activate
POST /api/runtime/resolutions/:id/deactivate
GET  /api/runtime/contexts
GET  /api/runtime/resolutions/:id/execution-manifest
```

L'identifiant utilisé pour activer/désactiver reste celui de la résolution. L'API de manifeste d'exécution revalide la résolution et renvoie le contexte actif et le manifeste effectif. Les anciennes résolutions sans expiration persistée doivent être relancées.

## Vérifications reproductibles

Vérifications réalisées : build Nest complet terminé avec code 0 et sans diagnostic TypeScript ; build Vite final terminé avec code 0 ; 37 tests frontend Renderer/PublishedApplication verts ; dernière passe de 24 tests backend gate/Data Runtime/activation verte ; tests du filtre d'erreurs et du catalogue IAM verts. Le contrôle PostgreSQL valide la migration, les permissions et l'unicité du contexte actif.

Le démarrage depuis les sources a atteint `BOOT` sur 3003 avec connexion PostgreSQL confirmée et a refusé une requête anonyme au dashboard (401). Un watcher externe a ensuite été relancé pendant le remplacement par les fichiers compilés et a effacé `dist` ; il a été laissé seul jusqu'à la fin de sa reconstruction. Le contrôle HTTP final confirme `/health` = 200, frontend `/runtime` = 200, proxy frontend `/api/runtime/dashboard` = 401 et backend `/api/runtime/dashboard` = 401 sans session. Le backend est désormais servi par ce watcher existant. Les mots de passe de recette présents comme variables dans `.env` sont vides : la vérification HTTP connectée reste **BLOCKED — TEST_LOGIN_CREDENTIALS_MISSING** sans utiliser la session navigateur de l'utilisateur. Preuves : `runtime-http-verification.json`.

```bash
node scripts/recette/check-runtime-db.cjs
node scripts/recette/check-runtime-http.cjs
```

Le contrôle HTTP utilise les identifiants de test configurés dans `.env`, via le véritable login IAM. Il n'affiche aucun mot de passe, cookie ou token. Le contrôle PostgreSQL crée des lignes temporaires pour vérifier le refus de double activation et annule intégralement cette transaction.

## Limites et recette restante

- La boutique créée par le seed reste en DRAFT ; aucun manifeste publié ou résultat métier n'a été inventé.
- La publication réelle de la boutique, ses 20 pages, et le parcours complet UI → publication → activation → lecture/écriture restent **NOT TESTED** tant qu'ils ne sont pas exécutés.
- Les contrats de readiness des providers Automation/Integration et la distinction complète DECLARED/REGISTERED/AVAILABLE/EXECUTABLE restent à consolider. Les sections externes explicitement présentes dans un manifeste bloquent la résolution si leur readiness n'est pas prise en charge.
- Les endpoints Automation/Integration indépendants ne sont pas refondus dans cette correction ; leur intégration complète à la frontière Runtime n'est pas revendiquée.
- Aucun consumer outbox `pack.version.published` n'est revendiqué. Les résolutions relisent les publications et la configuration avant le cache ; l'exécution revalide l'intégrité persistée. La consommation événementielle reste à faire.
- La propagation immédiate de toutes les modifications de configuration/providers vers les contextes déjà actifs et vers plusieurs processus reste à consolider ; le TTL des résolutions ne constitue pas cette propagation.
- La liaison au Deployment, la totalité des 30 maquettes et tous les cas SEC-PR ne sont pas déclarés terminés par ces corrections.

Ce rapport distingue la correction de l'incident et le durcissement réalisé de la validation complète du CDC.
