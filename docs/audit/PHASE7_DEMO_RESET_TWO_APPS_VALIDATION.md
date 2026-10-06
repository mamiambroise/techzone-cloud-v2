# Phase 7 — reset contrôlé et deux boutiques Techzone

Validation locale : 5 octobre 2026. Branche canonique `mami`, PR #6, aucune fusion.

## A. Reset et sauvegardes

Base : `techzonecloud_local`, PostgreSQL local `127.0.0.1:55432`, schéma `business_manager`.
Les essais ont précédé l'intervention locale sur `techzonecloud_phase7_recipe` (restauration du backup) et `techzonecloud_phase7_fresh` (installation vide).

Sauvegardes hors Git dans `%TEMP%/techzone-phase7-safety` :

- `before-phase7.backup` : 724584 octets, 1086 entrées, SHA256 `4819df9c0e54696cd8f34b6701acdae030440abcde68de949b8f082d9e32ac05`. Restauration effectuée et empreintes de **toutes** les tables identiques.
- `before-local-20261005.backup` : 724873 octets, 1086 entrées, SHA256 `3096f470567a5364b1c0626fdb4e60fa2a90ab1e2887b0d4b7e4f8c71b077bba`. Backup complémentaire après détection de trois nouveaux refresh tokens et de sessions mises à jour ; ces changements ont été conservés.
- Snapshots de compteurs/empreintes : `before-reset.json`, `restored-copy.json`, `before-local-20261005.json`, `after-local-reset-20261005.json`, `final-local-20261005.json`.

Preuve des démos : IDs SHA256 déterministes du namespace `bm-demo`, concordance exacte code/application/version/tenant, recoupée avec `BM_DEMO_RESET_AUDIT.md` et le seed historique. Une version inconnue ou une référence entrante protégée fait échouer le script.

| Tenant | Application | ID application | ID version 1.0.0 |
|---|---|---|---|
| techzone-it-solution | gestion-des-ventes | 16684ba3-1504-5fca-89e0-21f31cf9dc1a | 77ba399f-c59a-55a3-a907-f3b44e40b30d |
| techzone-it-solution | gestion-de-stock | 4433b94c-a27d-56a3-913e-7d3025081dcf | 2288c2be-8f80-5383-acd2-759086538232 |
| techzone-it-solution | crm | 7945edcd-0744-59df-820a-7c3bc79e87a2 | 7858c969-43c2-5182-9f51-2c149a82c3a8 |
| techzone-it-solution | wisp | 4ae6ef0e-4c22-51b5-a50c-d0be168509c3 | 28c91a67-bd8a-5d54-afc8-a7f34f16df70 |
| techzone-it-solution | fret-transit | 9137db4c-e53d-543f-b222-187c7fa140f4 | fb9de755-c60d-5957-b102-5db90536bb29 |
| demo-horizon-sarl | centre-de-formation | aef288b9-93b1-528a-ab3c-6ad5b9b63f06 | bbc4bd20-88ed-594a-bd14-586d201d53e8 |
| demo-horizon-sarl | gestion-scolaire | 2b6014c5-b629-55b7-ab94-a24d68525a25 | 66b7dc19-1a31-5cae-8977-cda65e7eb5b0 |
| demo-horizon-sarl | gestion-rh | 32fd38de-1a64-5c40-a346-61987cc24ad5 | 9ded97d6-3e90-570b-8e84-0e92d49a50a4 |
| demo-horizon-sarl | gestion-projets | bcbca3fd-44d0-5c8d-b2aa-44ea0d414321 | d2dcf4da-6110-5058-b219-a348a2c5b84a |
| demo-horizon-sarl | support-sav | 163b3f87-58d5-5854-8746-cca19dbd8cdc | 5dc2c72c-54e6-5f3e-9e59-a6a057b3a1ea |

Dry-run local approuvé par empreinte exacte `3884cec96390bb2474968ef2609108eed0394d026d497f0b75aa7e24b2052b04` : **1788 lignes**, soit 10 applications et 1778 lignes liées (dont 10 versions). Transaction SERIALIZABLE ; comparaison de chaque ligne non ciblée dans chaque table avant COMMIT. Second passage : zéro cible.

Suppression détaillée : versions 10, applications 10, contraintes 273, versions de contrats 10, contrats 10, entités 62, capacités 159, features 53, validations de champs 259, champs 363, menus 10, éléments de navigation 86, métriques qualité 100, rapports qualité 10, relations 65, campagnes/runs de validation 10 chacun, capacités de version 159, features de version 53, configurations 76. Aucun UI, Pack, IAM ou record métier supprimé.

**UNKNOWN / PRESERVED** : les trois applications `bm-recette-*`, `ui_app_1790639265578`, `uib_no_version_recette` et les quatre `qa_*` ; leurs IDs exacts figurent dans le plan hors Git. Les cinq tenants préexistants et les quatre utilisateurs sont conservés.

| Table / groupe | Avant local | Après reset | Après boutiques |
|---|---:|---:|---:|
| Tenants | 5 | 5 | 7 |
| Utilisateurs / credentials | 4 / 4 | 4 / 4 | 4 / 4 |
| Memberships | 6 | 6 | 8 |
| Applications / versions | 19 / 19 | 9 / 9 | 11 / 11 |
| Entités / champs | 73 / 371 | 11 / 8 | 35 / 159 |
| Relations | 68 | 3 | 29 |
| Features / capacités | 56 / 163 | 3 / 4 | 42 / 115 |
| Menus / navigation | 12 / 88 | 2 / 2 | 4 / 30 |
| Configurations | 81 | 5 | 29 |
| Pages UI / thèmes | 3 / 1 | 3 / 1 | 101 / 1 |
| PackVersions / snapshots / manifests | 5 / 2 / 2 | 5 / 2 / 2 | 7 / 4 / 4 |
| Business records | table absente | 0 | 130 |
| Billing | 0 | 0 | 0 |

Orphelins contrôlés : versions→applications, entités→versions, champs→entités, relations source/cible, capacités→features, navigation→menus, pages→versions, records→entités : **0**. Le reset a également vérifié toutes les références FK entrantes avant suppression.

## B–C. Applications

| Élément | Techzone WiFi Services | Techzone Informatique |
|---|---|---|
| Code | WIFI_SERVICES | IT_SALES |
| Tenant | 0cf0f403-cc60-5128-ad92-305c010ba199 | 672202ea-22ad-579d-abc7-9c3c5998388a |
| Application | fa0d43f6-4fbe-5dad-a70d-a5dccca68187 | d3b7cdd0-703c-54ec-a72d-03c7d3915fce |
| Version 1.0.0 | 472584fe-3b27-504a-aedf-2b88ecc63d5a | 2920e376-1621-58d7-a6ff-766da196ae5a |
| Entités / champs / relations | 11 / 74 / 12 | 13 / 77 / 14 |
| Features / capacités actives | 18 / 51 | 21 / 60 |
| Navigation BM / configurations actives | 13 / 11 | 15 / 13 |
| Pages UI | 45 | 53 |
| Records locaux | 51 | 79 |

Schémas déclaratifs complets : `backend/scripts/ph7-spec.cjs`. Tous les codes techniques de champs/entités sont normalisés en minuscules selon le BM existant ; les labels conservent les noms métier. STRING→TEXT, TEXT long→LONG_TEXT, NUMBER→DECIMAL, ENUM→ALLOWED_VALUES, RELATION→relation BM MANY_TO_ONE avec cible vérifiée.

WiFi : Customer, InternetOffer, Subscription, Service, Supplier, NetworkEquipment, Order, OrderLine, Payment, Installation, Intervention. Configuration MGA/Madagascar, préfixes et options demandés. Navigation BM : clients, Internet (offres/abonnements/installations), services/interventions, équipements, fournisseurs, commandes et paiements.

Informatique : Category, Brand, Supplier, Product, Customer, CustomerOrder, CustomerOrderLine, Sale, SaleLine, PurchaseOrder, PurchaseOrderLine, StockMovement, Payment. Configuration MGA/Madagascar, préfixes et options demandés. Navigation BM : catalogue, clients, fournisseurs, achats, stock, ventes et paiements.

Données initiales WiFi : 5 clients, 3 offres, 5 abonnements, 4 services, 5 équipements, 3 fournisseurs, 5 commandes, 10 lignes, 4 paiements, 3 installations, 3 interventions. Informatique : 5 clients, 3 fournisseurs, 3 catégories, 4 marques, 10 produits, 3 achats, 10 lignes d'achat, 15 mouvements, 5 commandes client + 5 lignes, 5 ventes + 5 lignes, 5 paiements. Un record Runtime final supplémentaire dans chaque application.

Recettes réelles : relations tenant/application/entité, sommes des lignes et totaux, transitions abonnement/commande/installation/intervention/achat/commande client, refus des transitions sans capacité. Stock initial : entrées 10 par produit, sortie 1 pour les cinq premiers, stock résultant 9/10. Les calculs et mouvements sont explicites, **pas une automatisation transactionnelle implicite**.

## D–E. Migration et publication Pack

Lineage : `20261004000000_baseline_v2` → `20261004001000_business_records` → **`20261004002000_pack_application_version_link`**. Les deux premières migrations ne sont pas modifiées.

Migration n°3 : colonne UUID nullable, FK RESTRICT vers ApplicationVersion et index ; aucun backfill inventé. Les cinq anciennes PackVersions gardent un lien null et leurs données. Fresh, copie restaurée et base locale : PASS. Après migration locale, toutes les lignes historiques ont été comparées aux empreintes avant migration, en excluant seulement la nouvelle colonne nullable : PASS.

| Publication locale 1.0.0 | WiFi | Informatique |
|---|---|---|
| PackVersion | 93532716-d272-433e-a21b-90884019efab | 25d5e557-5e0a-44f2-9c9a-d8b0f201adea |
| Manifest | 38177c26-e41d-4aab-afad-9829d720a358 | 4fc9c0da-3f11-4d56-ac4f-d10eb389d099 |
| Manifest SHA256 | 7f582e3aee608c162d3e59c25316faf2869783dfb2cac3d587d3896dbf4ee594 | 96d69b5dc278cfe021c501edd0f3d0134a3f8ffe0e3c335312a854c0ec0e4868 |

Validation, snapshot, manifest et publication : PASS. La définition embarque les pages **et les métadonnées BM nécessaires au renderer**. Modification de la description du dashboard de travail après publication, puis relecture du manifeste et comparaison du hash : PASS pour les deux packs, copie et local. Aucun snapshot publié n'est réécrit.

## F. Runtime et UI

Le composant partagé `PublishedApplication` charge exclusivement `/runtime/manifests/:pack/:version`. Il n'appelle ni working UI ni latest UI. Accès depuis `/runtime` en choisissant un pack publié, ou `/runtime?pack=wifi_services&packVersion=1.0.0` / `it_sales`, après sélection du tenant correspondant.

Chaque entité possède LIST, CREATE, DETAIL et EDIT ; un dashboard supplémentaire par application. Les tables utilisent Data Runtime Query avec filtre, tri, pagination, refresh, détail/édition et archivage. Les formulaires utilisent le même renderer, types BM, ENUM select, RELATION select alimenté par Data Runtime, champs longs et numériques, lecture seule et erreurs explicites. Preview bloque les mutations.

Recette HTTP/IAM + renderer React réel sur la copie : créations `RT-WIFI-*` / `RT-IT-*`, édition et détail, listes, relation/ENUM, retour A→B→A, absence de fuite. Aucun mock API dans cette recette. Vérification séparée dans la base locale via Published Manifest → ExecutionEngine → BmRecordsProvider → PostgreSQL :

- `RT-WIFI-FINAL` : `0a473ca5-0f80-4596-9bca-b31f5d0147a7`.
- `RT-IT-FINAL` : `2843c654-1c4c-45b9-b047-0e6158a2f182`.

Edge headless réel : deux apps × 320/768/1024/1440 px, pas de débordement de page, tableaux défilants, focus Tab fonctionnel, aucune exception JavaScript. Captures hors Git `WIFI_SERVICES-*.png` / `IT_SALES-*.png`. La compétence frontend a guidé la séparation des champs/tables, les labels, états d'erreur et contrôles clavier.

## G. Vérifications reproductibles

Depuis `backend` :

```powershell
npx prisma validate --config prisma7.config.ts
npx prisma generate --config prisma7.config.ts
npx prisma migrate status --config prisma7.config.ts
npm test -- --runInBand --silent business-manager ui-builder pack-manager pack-runtime data-runtime iam
node --test scripts/ph7-spec.test.cjs
npx nest build
$env:PH7_BROWSER='1'
node scripts/ph7-accept.cjs
node scripts/ph7-verify.cjs techzonecloud_local
node scripts/ph7-live-permissions.cjs
```

Depuis `frontend` : `npm test -- --reporter=dot`, puis `npm run build`.

Résultats : 175 tests backend ciblés lors du passage complet ; tests supplémentaires de contexte IAM et de champs exécutés séparément. Frontend complet : 262 PASS, 8 SKIP (recettes opt-in exécutées séparément pour Phase 7 et tests préexistants). Recette Phase 7 : 11 groupes PASS, incluant navigateur réel. Builds backend/frontend PASS. Avertissements non bloquants : taille d'un bundle Vite, React Router/act dans des tests existants et dépréciation pg client.query.

Provisioning borné et reprenable : `ph7-build.cjs`, `ph7-records.cjs`, `ph7-ui.cjs`, `ph7-pack.cjs`. Chaque commande reçoit explicitement la base. Le local exige la sauvegarde intacte et la recette clone réussie. Deuxième passage données : **0 création**, records conservés. Ne pas exécuter le vieux seed `seed:bm` pour reprovisionner ces applications.

## H. Sécurité et limites

Les 4 utilisateurs et leurs 4 credentials sont inchangés. Aucun compte de test n'a été créé dans la base locale. Deux memberships ont été ajoutés pour l'administrateur existant dans les deux nouveaux tenants ; aucun droit préexistant supprimé. Les comptes `PH7-TEST-*` à mots de passe aléatoires n'existent que dans la copie de recette ; secrets uniquement en mémoire et jamais imprimés.

Le provider vérifie tenant/version/entité avant les capacités. Les administrateurs IAM authentifiés bénéficient des capacités dynamiques ; un simple corps JSON ne peut pas devenir administrateur. Tests négatifs lecture/création/modification/suppression et transitions, manifest cross-tenant 404 et requêtes A→B→A. Aucun nom WiFi/Informatique n'influence le moteur générique : ces noms restent dans les scripts/specs/tests.

Le frontend local et le backend ont été redémarrés via le gestionnaire du projet ; HTTP frontend, health et ready : 200. Le compte local de test existant est **non administrateur** : les appels HTTP réels aux deux boutiques refusent manifest/read/create/update/delete (403), sans record écrit. Il n'a pas été élevé pour faire passer une recette positive. Les essais positifs du renderer utilisent les comptes bornés de la copie ; en local, la chaîne publiée/ExecutionEngine/PostgreSQL a été vérifiée séparément. Les sessions créées par les tests négatifs ont été déconnectées ; les compteurs IAM de sessions/tokens peuvent donc augmenter normalement après le snapshot final de données métier.

Limites explicitement conservées :

- Totaux, paiements et stock sont saisis/calculés explicitement par la recette ; pas de recalcul multi-entités ni d'automatisation de réception/vente ajouté.
- Dashboards : listes et nombres réels d'enregistrements ; pas de KPI financiers calculés fictifs.
- Navigation du renderer publié : index de pages ; hiérarchie métier disponible dans les menus BM. Pas de nouveau moteur de navigation spécialisé.
- IAM conserve son catalogue de rôles statique. Le provisionnement ne crée pas un nouvel éditeur d'affectation fine des capacités aux utilisateurs non administrateurs.
- Les cinq packs historiques sans lien ApplicationVersion ne sont pas artificiellement rendus publiables.
- Le test navigateur utilise le composant Runtime partagé dans un harnais de recette ; il ne prétend pas être un audit WCAG exhaustif de tout le portail.

## I–J. Git et corrections

Commits limités aux nouveaux scripts/migration, runtime générique, renderer, tests et ce rapport. Modifications utilisateur préexistantes, suppressions d'images et `techzone/` exclues. Sauvegardes, snapshots contenant des IDs, logs, cookies, `.env` et node_modules restent hors Git. Push exclusivement `refs/heads/mami:refs/heads/mami` ; `origin/Mami` doit rester à `10bf388f8042e5657d13d8adff954a0518ca5e9a`. PR #6, pas de merge.

Corrections démontrées :

1. PostgreSQL indisponible après arrêt interrompu → reprise contrôlée du cluster existant, attente de récupération, aucune réinitialisation.
2. Pack.applicationVersionId absent → migration additive nullable testée sur fresh/copie/local.
3. Hash UI différent après JSONB et entre deux lectures → dates ISO et timestamp dérivé du contenu, test JSON roundtrip/stabilité + publication réelle.
4. Capacités BM absentes du catalogue IAM statique de l'admin → mapping côté serveur depuis le rôle authentifié, tests contre l'escalade par body et le cross-tenant.
5. ENUM/relation traités comme texte → renderer piloté par métadonnées, vraies options, tests HTTP et navigateur.
6. Édition relationnelle perdant la sélection pendant le chargement → select contrôlé et blocage de soumission pendant indisponibilité, recette d'édition PostgreSQL.
7. Actions métier contournables par UPDATE générique → vérification générique des transitions déclarées dans les capacités, test de refus et transitions réelles.
8. Sauvegarde ancienne par rapport aux sessions IAM → arrêt du garde-fou, nouvelle sauvegarde, conservation des sessions récentes.

## L. Cohérence UI / base après réouverture navigateur

Levée d'ambiguïté signalée sur le navigateur : le cockpit affichait 5 applications
pour le tenant affiché, alors que les deux boutiques n'y étaient pas visibles.

### Source de l'affichage

| Élément | Valeur |
|---|---|
| Backend | `scripts/windows/backend.cjs` → `backend/dist/main.js`, port 3003 |
| Frontend | Vite dev, port 3000, proxy `/api` et `/api/iam` → 3003 |
| Base servie | `techzonecloud_local`, PostgreSQL `127.0.0.1:55432`, schéma `business_manager` |
| Compte du navigateur | `techzonetest`, `isAdmin = false`, rôle `user` |
| Tenant du navigateur | `techzone-test` (`8031055e-14af-4b43-979f-904e820306e9`) |
| Tenant envoyé | implicitement `session.tenantId` via cookie `iam_access_token`, jamais en paramètre de requête |

Le sélecteur de tenant de l'en-tête est absent : `/auth/me` ne renvoie qu'un seul
tenant pour ce compte. Le `tenantId` n'est jamais choisi par le frontend ; il vient
de `iamSession.tenantId` (platform.service.ts:13, iam-jwt.guard.ts:75).

### Trois niveaux, tenant `techzone-test`

| Niveau | Applications | Actives | Versions | DRAFT | READY |
|---|---:|---:|---:|---:|---:|
| PostgreSQL | 5 | 5 | 5 | 5 | 0 |
| API `/business-manager/dashboard` | 5 | 5 | 5 | 5 | 0 |
| UI Vue d'ensemble | 5 | 5 | 5 | 0 |

L'UI affiche `Applications 5`, `Actives 5`, `Brouillons 5`, `Prêtes à publier 0`.
`Brouillons` compte les **versions** DRAFT (platform.service.ts:138-143), `Actives`
compte les **applications** ACTIVE (platform.service.ts:128-136) ; les libellés
et les indices affichés (« versions en DRAFT », « au statut READY ») correspondent
exactement à ces deux granularités. Aucun mélange : les 5 applications sont ACTIVE
et leurs 5 versions sont DRAFT. **Pas de bug de compteur, aucun correctif requis.**

### Les deux boutiques sont dans deux autres tenants

| Élément | WiFi | Informatique |
|---|---|---|
| Tenant | `techzone-wifi-services` | `techzone-informatique` |
| Applications | 1 (WIFI_SERVICES) | 1 (IT_SALES) |
| Service `ApplicationsService` | 1 / ACTIVE | 1 / ACTIVE |
| UI | non visible | non visible |

`POST /api/iam/auth/tenant/switch` vers les deux tenants de boutique renvoie
**403 « Appartenance au locataire non active »** : le compte `techzonetest` n'a
qu'une membership, `techzone-test`. Les deux boutiques sont conformes à la
conception Phase 7 (§ B : un tenant par boutique) ; l'affichage observé est
exactement celui du tenant du compte connecté. **Aucune données déplacée.**

### Classification des applications visibles

Origine recherchée dans les seeds, fixtures, tests, scripts et l'historique git
complet (`git log --all -S` sur chaque code, entité, page et identifiant).
Aucune occurrence dans le code : ni `seed.ts`, ni `bm-demo-seed.ts`, ni
`ph7-spec.cjs`, ni aucun `.spec.ts` / `.test.*`. Les codes à horodatage
(`bm-recette-1790638740178`, `ui_app_1790639265578`, `ui_1790639054398`) ne sont
pas générés par le code : `applications.service.ts:20` prend le code du DTO.

| Application | Créée | Entités | Pages UI | Records | Descendants (dry run) | Classification | Action |
|---|---|---:|---:|---:|---:|---|---|
| `uib_no_version_recette` | 2026-10-03 | 0 | 0 | 0 | 5 | UNKNOWN — recette navigateur manuelle | PRESERVED |
| `ui_app_1790639265578` | 2026-09-28 | 0 | 3 | 0 | 8 | UNKNOWN — recette navigateur manuelle | PRESERVED |
| `bm-recette-1790638740178` | 2026-09-28 | 1 | 0 | 0 | 12 | UNKNOWN — recette navigateur manuelle | PRESERVED |
| `bm-recette-1790638817100` | 2026-09-28 | 1 | 0 | 0 | 14 | UNKNOWN — recette navigateur manuelle | PRESERVED |
| `bm-recette-1790638926377` | 2026-09-28 | 5 | 0 | 0 | 29 | UNKNOWN — recette navigateur manuelle | PRESERVED |

Dry run sur le tenant (aucune suppression exécutée) : 5 applications, 5 versions,
7 entités, 4 champs, 3 relations, 3 features, 4 capacités, 2 menus, 2 navigation,
3 pages UI, 3 contraintes, 3 rapports qualité, 21 métriques qualité, 3 runs de
validation, 1 contrat `recipe` LOCKED, 7 événements d'audit, 0 business_records,
0 PackVersion lié, 0 session IAM. Références entrantes hors descendants : **0**.

`NO_VERSION` est un état de l'UI Builder (`UiBuilderLayout.jsx`), pas une donnée :
le code du scénario est conservé, seule l'instance persistée est sans origine
 identifiable. Conformément à la règle UNKNOWN, **aucune suppression**.

### FINAL UI / DATABASE CONSISTENCY

```
Frontend visible      : Business Manager, compte techzonetest
Tenant affiché        : techzone-test / 8031055e-14af-4b43-979f-904e820306e9
Tenant ID envoyé      : implicite via iamSession.tenantId (aucun paramètre requête)
Backend database      : techzonecloud_local @ 127.0.0.1:55432, business_manager

Applications PostgreSQL : 5 (techzone-test) | 1 (techzone-wifi-services) | 1 (techzone-informatique)
Applications API        : 5 | 1 | 1
Applications UI         : 5 | non visible (membership absente) | non visible (membership absente)

WIFI_SERVICES : tenant techzone-wifi-services, app fa0d43f6-4fbe-5dad-a70d-a5dccca68187,
                version 472584fe-3b27-504a-aedf-2b88ecc63d5a DRAFT,
                11 entités / 74 champs / 45 pages / 50 records,
                PackVersion 93532716 PUBLISHED VALID, manifest sha256:7f582e3a…
IT_SALES : tenant techzone-informatique, app d3b7cdd0-703c-54ec-a72d-03c7d3915fce,
                version 2920e376-1621-58d7-a6ff-766da196ae5a DRAFT,
                13 entités / 77 champs / 53 pages / 78 records,
                PackVersion 25d5e557 PUBLISHED VALID, manifest sha256:96d69b5d…

UIB Recette Sans Version : UNKNOWN (recette navigateur manuelle, 2026-10-03)
  classification : UNKNOWN — PRESERVED (0 suppression)

UI Application 1790639265578 modified : UNKNOWN (recette navigateur manuelle, 2026-09-28)
  classification : UNKNOWN — PRESERVED (0 suppression)

BM Recette #1 (bm-recette-1790638740178) : UNKNOWN — PRESERVED (0 suppression)
BM Recette #2 (bm-recette-1790638817100) : UNKNOWN — PRESERVED (0 suppression)
BM Recette #3 (bm-recette-1790638926377) : UNKNOWN — PRESERVED (0 suppression)

Technical fixtures removed   : 4 records RT-* (RT-WIFI-FINAL, RT-IT-FINAL et leurs
                              homonymes recréés par ph7-verify)
Technical fixtures preserved : 5 applications recette, 3 pages UI, 1 contrat recipe,
                              7 événements d'audit, 0 suppression
Unknown applications preserved : 5 / 5

Temporary RT/PH6 records cleaned  : oui, 0 restant
Business demo records preserved   : WiFi 50, Informatique 78 (128 total)

Dashboard counters (techzone-test) :
  Applications 5 | Active 5 | Draft versions 5 | Ready versions 0
  Actives = applications.status ACTIVE ; Brouillons = versions.status DRAFT.
  Libellés corrects, aucun mélange de granularité.

PostgreSQL = API = UI : PASS
```

### Encodage

`BM Recette v?rifi?e` : les octets sont `0x3F` (`?`) en base, et non un mauvais
affichage terminal. Les caractères accentués ont été perdus à l'insertion, en 2026-09-28,
dans ce tenant de recette uniquement. Scan global (`?` suivi d'une lettre) :
6 lignes, toutes dans `techzone-test`, **aucune dans les deux boutiques** ni dans
les données métier. Aucun remplacement global effectué.

### Nettoyage des fixtures techniques

Preuves Runtime déjà enregistrées au § F (identifiants, hash, manifest, captures).
Suppression ciblée des 4 records de validation persistés, après la section F :
`RT-WIFI-FINAL`, `RT-IT-FINAL`, et les deux homonymes recréés par un second
passage de `ph7-verify.cjs`. Contrôle après : 0 record contenant `RT-`, `PH6-`,
`RECETTE-` ou `TEST-`. Données métier conservées : WiFi 50, Informatique 78,
total 128.

### Correction front réelle

Clés React dupliquées dans « Activité récente » (`BMOverview.jsx:171`) : la clé
était `event.resourceId`, or plusieurs événements portent le même `resourceId`
(par exemple CREATED puis UPDATED sur la même configuration). Deux clés
dupliquées visibles dans la console sur le tenant de recette. Clé corrigée en
`resourceId-action-timestamp`, test de non-régression ajouté dans
`businessManager.test.jsx` (il échoue sur l'ancienne clé, vérifié).

### Contrôles finaux

Orphelins après nettoyage, tous à 0 : versions→applications, entités→applications,
champs→entités, navigation→menus, pages→applications, records→applications et
→entités, PackVersion→version. 11 applications et 128 records au total.
Pages UI des deux boutiques : 45 et 53, toutes liées à la version 1.0.0 de leur
application, `applicationId` et `tenantId` corrects, aucune page orpheline.

| Contrôle | Résultat |
|---|---|
| PostgreSQL = API = UI pour `techzone-test` | PASS (5 / 5 / 5 / 0) |
| PostgreSQL = API = UI par tenant | PASS |
| Compteurs du dashboard | PASS, aucun mélange de granularité |
| Pages UI Builder des deux boutiques | PASS, 45 + 53 |
| Données métier des deux boutiques | PASS, 50 + 78 |
| Fixtures techniques `RT-*` | 4 supprimées, 0 restante |
| Applications UNKNOWN | 5 preservées |
| Orphelins | 0 |

## M. Accès de `techzonetest` aux deux boutiques

### Audit IAM préalable

| Élément | Valeur |
|---|---|
| Identité | `iamUser.id = 0c801adb-49e2-4f06-a074-12266650898b` |
| Username | `techzonetest` |
| Email primaire | `recette.techzone@example.com` |
| `isAdmin` | `false` |
| Rôle effectif | `user` (15 permissions) |
| Membership `techzone-test` | `ACTIVE`, `joinedAt 2026-09-28T13:32:26.704Z`, `createdBy = lui-même` |
| Membership `techzone-wifi-services` | **ABSENTE** avant intervention |
| Membership `techzone-informatique` | **ABSENTE** avant intervention |

Aucun credential modifié. Aucun utilisateur créé. `defaultTenantId` laissé vide :
c'est le mécanisme normal, la session porte le tenant actif.

### Création par le mécanisme IAM officiel

Appel direct de `IamTenantsService.createMembership` — la méthode exacte derrière
`POST /api/iam/admin/tenants/:id/memberships` (iam-tenants.controller.ts:75) —
résolue depuis `backend/dist`, donc avec les mêmes validations que le endpoint :
tenant existant, utilisateur existant, refus de doublon, `joinedAt` posé
uniquement si `status = ACTIVE`, `createdBy` = acteur authentifié.

Impossible de passer par HTTP : la route exige `IAM_ADMIN`
(`IamAdminGuard`), donc un compte admin. L'appel de service évite de promouvoir
`techzonetest` en superadmin, conformément à la consigne. Acteur enregistré :
`bm.demo`, administrateur IAM existant.

| Tenant | membership avant | après | joinedAt |
|---|---|---|---|
| `techzone-wifi-services` | ABSENTE | `ACTIVE` | 2026-10-05T11:26:04.581Z |
| `techzone-informatique` | ABSENTE | `ACTIVE` | 2026-10-05T11:26:04.613Z |

Trois memberships ACTIVE au total. Aucun garde-corps IAM modifié :
`Appartenance au locataire non active` (iam-context.service.ts:127) reste
intact et a réellement bloqué les switches avant l'intervention (403),
il les autorise maintenant par la membership et non par un contournement.

### Rôle retenu

Rôle `user` inchangé. C'est le seul rôle non-admin du projet
(`iam.constants.ts:13-16`) et il couvre exactement les surfaces de lecture
demandées : `bm:read`, `ui-builder:read`, `data-runtime:read`,
`data-runtime:query`.

Il n'existe pas de rôle « administrateur tenant ». Les tables `role`,
`role_permission`, `role_assignment` et `permission` sont **vides** (0 ligne
chacune) et ne sont pas lues par le chemin d'autorisation : `IamJwtGuard`
dérive le rôle du seul booléen `user.isAdmin` (iam-jwt.guard.ts:89) et résout
les permissions via le catalogue statique `ROLE_PERMISSIONS`
(iam.constants.ts:152). Créer un rôle tenant réel aurait exigé de réécrire la
résolution d'autorisation, hors périmètre. Promouvoir en `admin` aurait donné
les 111 permissions et désobéit à la consigne.

Limite assumée : `pack.*` et `runtime.*` ne figurent pas dans `ROLE_PERMISSIONS[user]`
(iam.constants.ts:154-188). Pack Manager et l'API Runtime renvoient donc **403
« Insufficient permission »** pour ce compte. Ce n'est pas un défaut : ces
surfaces sont réservées à l'admin par conception, et `bm.demo` en conserve l'accès.

### Test de bascule de tenant (authentification réelle `techzonetest`)

Sept basculements successifs via `POST /api/iam/auth/tenant/switch`, tous 200
« Locataire changé », avec `/auth/me` et `/business-manager/applications`
relus après chaque bascule.

| Bascule | HTTP | Applications retournées | WIFI_SERVICES | IT_SALES | 5 UNKNOWN |
|---|---:|---|:---:|:---:|:---:|
| → techzone-test | 200 | 5 | absent | absent | 5 |
| → WiFi | 200 | 1 | **présent** | absent | 0 |
| → IT | 200 | 1 | absent | **présent** | 0 |
| → WiFi | 200 | 1 | **présent** | absent | 0 |
| → techzone-test | 200 | 5 | absent | absent | 5 |
| → IT | 200 | 1 | absent | **présent** | 0 |
| → techzone-test | 200 | 5 | absent | absent | 5 |

`/auth/me` expose désormais les trois tenants ; le sélecteur de l'en-tête les
affiche tous (`Choisir un tenant`, `Techzone Test`, `Techzone WiFi Services`,
`Techzone Informatique`).

### Isolation

Fuites croisées : **aucune**, dans les deux sens, sur les 7 basculements.

Au niveau service, `PackRuntimeService.publishedManifest` refuse le pack de
l'autre tenant avec `PUBLISHED_PACK_MANIFEST_NOT_FOUND` — l'isolation ne dépend
donc pas du simple filtrage de liste.

### Vérification navigateur

WiFi : sélecteur → `Techzone WiFi Services` → Vue d'ensemble `Applications 1`,
`Actives 1` → Applications → `Gestion WiFi & Services` (`WIFI_SERVICES`,
`ACTIVE`) → Versions `1.0.0 DRAFT` → Modèles de données : `11 élément(s) sur 11`
dans le contexte `Tenant : Techzone WiFi Services`. UI Builder :
`Gestion WiFi & Services · Version 1.0.0 · DRAFT`, pages `customer-list`,
`customer-create`, `customer-detail`, `customer-edit`, `subscription-*`,
`order-*` présentes.

Informatique : sélecteur → `Techzone Informatique` → UI Builder :
`Gestion Vente Informatique · Version 1.0.0 · DRAFT`, pages `product-*`,
`customerorder-*`, `sale-*` présentes. Business Manager : `13 élément(s) sur 13`,
contexte `Tenant : Techzone Informatique`.

Retour sur `techzone-test` : contexte remis à « Non sélectionné », aucune trace
de l'application précédente dans le DOM, puis les 5 applications de recette
réapparaissent avec leurs codes d'origine et leurs trois libellés `BM Recette
v?rifi?e` inchangés. Aucune écriture effectuée : aucun record créé, aucun
`RT-*` régénéré.

### Bug réel corrigé : UI Builder rejetait les deux boutiques

`GET /api/ui-builder/pages/:applicationVersionId` répondait **400 « Validation
failed (uuid v 4 is expected) »** pour les deux boutiques. Les versions Phase 7
sont provisionnées de façon déterministe et portent des UUID **v5**
(`472584fe-…`, `2920e376-…`), alors que `ui-builder.controller.ts:50` épinglait
`new ParseUUIDPipe({ version: '4' })`. C'était le seul contrôleur de tout le
projet à contraindre la version ; les 30 autres utilisent `new ParseUUIDPipe()`
non contraint, et Prisma produit des UUID v4 par défaut.

La contrainte de version d'UUID n'est pas une contrainte de sécurité : le tenant
est imposé par `TenantGuard` et le service filtre sur `principal.tenantId`.
Le pipe est donc passé en `new ParseUUIDPipe()`, aligné sur tous les autres
contrôleurs, et exporté pour être testable. Après correction : 200 sur
`pages` (45 / 53), `overview` (`WIFI_SERVICES` / `IT_SALES`, version 1.0.0) et
`business-context`.

Test de non-régression ajouté dans `ui-builder.controller.spec.ts` : les
identifiants v4 et v5 passent, un identifiant malformé est toujours refusé, et
le service reçoit bien le tenant actif. Vérifié rouge sur l'ancien pipe
épinglé, vert après correction.

### Écarts hors périmètre, non corrigés

`GET /api/business-manager/applications/<segment non-uuid>` renvoie **500
« Failed to resolve tenant for resource application »** au lieu d'un 404 : la
route `@Get(':id')` avale n'importe quelle chaîne et le `TenantResource` échoue
ensuite. Reproduit sur `/applications/versions` et `/applications/pas-une-app`.
Aucun appel frontend n'atteint cette forme (le frontend utilise toujours un
UUID réel), l'erreur n'a été observée qu'en naviguant manuellement vers une URL
qui ne correspond à aucune page. Préexistant, sans lien avec les tenants ni avec
la Phase 7 : non corrigé dans cette étape.

## K. Verdict

RESET 10 DEMOS : PASS. TECHZONE WIFI SERVICES : PASS. TECHZONE INFORMATIQUE : PASS. UI BUILDER : PASS. PACK / RUNTIME : PASS pour publication immutable et consommation des UI publiées, avec les limites explicites ci-dessus.

**FINAL BUSINESS MANAGER CLEANUP : PASS — UNKNOWN DATA PRESERVED.**
L'incohérence apparente était un tenant, pas une divergence de données : le
compte du navigateur n'est membre que de `techzone-test`, qui ne contient que les
5 applications de recette historiques. PostgreSQL, API et UI concordent
exactement (5 / 5 / 5 / 0) et le dashboard ne mélange pas statuts d'application
et cycle de vie de version.

**TECHZONETEST MULTI-TENANT ACCESS : PASS.**
**TENANT ISOLATION : PASS.**

**PHASE 7 — 2 BOUTIQUES TECHZONE : GO.**
