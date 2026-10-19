# Analyse REG-008 - TypeScript specifications backend - 2026-10-19

## Resultat

Commande executee :

```powershell
npx tsc --noEmit -p backend/tsconfig.spec.json
```

Le premier audit a trouve 312 diagnostics dans 27 fichiers. Huit diagnostics IAM relevant du perimetre Mami ont ete corriges et valides dans `dfc26e1`. Le rerun reel echoue encore avec 304 diagnostics : REG-008 reste donc `A faire`.

| Code | Initial | Apres `dfc26e1` | Evolution | Cause dominante |
|---|---:|---:|---:|---|
| TS2345 | 285 | 281 | -4 | Mocks Jest non types, inferes en `never` |
| TS2571 | 6 | 6 | 0 | Valeur de mock/retour `unknown` |
| TS18046 | 6 | 6 | 0 | Valeur `unknown` utilisee sans affinage |
| TS2339 | 4 | 3 | -1 | Contrat ou client Prisma obsolete |
| TS2554 | 3 | 3 | 0 | Signature de constructeur/guard obsolescent |
| TS1117 | 2 | 2 | 0 | Cles d'objet dupliquees |
| TS2698 | 2 | 0 | -2 | Spread d'un type non objet dans une fixture IAM |
| TS2741 | 1 | 1 | 0 | Propriete obligatoire manquante |
| TS2531 | 1 | 0 | -1 | Acces potentiellement nul |
| TS2353 | 1 | 1 | 0 | Fixture avec propriete absente du contrat |
| TS7053 | 1 | 1 | 0 | Indexation dynamique hors contrat |
| **Total** | **312** | **304** | **-8** | |

## Corrections IAM autorisees et validees

| Fichier | Localisation | Diagnostic traite | Correction | Validation |
|---|---:|---|---|---|
| `src/iam/iam-throttle.service.ts` | 56 | TS2531 | Chaine optionnelle sur le timer de purge | Suite IAM PASS |
| `src/iam/jwt.util.ts` | 43 | TS2339 | `aud?: string` aligne le payload avec le jeton signe | Suite IAM PASS |
| `src/iam/iam-jwt.security.spec.ts` | 160 | TS2698 x2 | Contexte Nest explicite au lieu d'un spread de `never` | Suite IAM PASS |
| `src/iam/iam-admin-isolation.spec.ts` | 63, 96 | TS2345 x2 | `findUnique` type et double cast vers `PrismaService` | Suite IAM PASS |
| `src/iam/iam-permission.guard.spec.ts` | 30, 84 | TS2345 x2 | Mocks Prisma types | Suite IAM PASS |

Validation complementaire : `npm test -- --runInBand iam` passe avec 17 suites et 145 tests; `npx nest build` passe. Aucun `any`, `@ts-ignore` ou desactivation de TypeScript n'a ete ajoute par ce commit.

## Repartition exhaustive apres correction

Chaque ligne ci-dessous correspond aux erreurs encore emises par la commande. Les responsables marques `a confirmer` ne sont pas attribues sans preuve de propriete de module.

| Module / fichier | Diagnostics | Cause | Responsable | Priorite | Correction proposee |
|---|---:|---|---|---|---|
| Automation - `automation.controller.spec.ts` | 1 TS2554 | Signature de guard/constructeur stale | A confirmer - Automation | P2 | Aligner le mock et l'appel sur les quatre arguments actuels |
| Data Runtime - `bm-records.provider.spec.ts` | 4 TS2345 | `jest.fn()` inferes en `never` | A confirmer - Data Runtime | P2 | Typer les fonctions mockees selon le contrat provider |
| ERP Adapter - `erp-resource-runtime.service.spec.ts` | 1 TS2353 | `resourceKey` absent de `TenantContext` | A confirmer - ERP Adapter | P2 | Aligner la fixture sur le contrat actuel |
| IAM - `iam.constants.ts` | 2 TS1117 | `BM_CONTRACT_READ` et `BM_CONTRACT_WRITE` dupliques (91-92) | Nassa | P2 | Revoir la semantique puis supprimer/fusionner les doublons |
| Business Manager - `contracts.service.spec.ts` | 14 TS2345 | Mocks inferes en `never` | A confirmer - Business Manager | P2 | Typer les retours Prisma et services |
| Business Manager - `data-model.service.spec.ts` | 35 TS2345 | Mocks inferes en `never` | A confirmer - Business Manager | P2 | Typer les retours Prisma et services |
| Business Manager - `features.service.spec.ts` | 19 TS2345 | Mocks inferes en `never` | A confirmer - Business Manager | P2 | Typer les retours Prisma et services |
| Business Manager - `navigation.service.spec.ts` | 12 TS2345 | Mocks inferes en `never` | A confirmer - Business Manager | P2 | Typer les retours Prisma et services |
| Business Manager - `quality-engine.service.spec.ts` | 14 TS2345, 2 TS2571 | Mocks `never` et resultats `unknown` | A confirmer - Business Manager | P2 | Typer les retours puis affiner les valeurs inconnues |
| Business Manager - `runtime-bridge.service.spec.ts` | 8 TS2345 | Mocks inferes en `never` | A confirmer - Business Manager | P2 | Typer les retours Prisma et services |
| Deployment - `cockpit.service.spec.ts` | 6 TS2345 | Mocks inferes en `never` | Nassa | P2 | Typer les mocks du Cockpit |
| Integration - `integration-authorization.spec.ts` | 6 TS2345, 1 TS7053 | Mocks `never` et indexation dynamique | A confirmer - Integration | P2 | Typer les mocks et remplacer l'index non borne par une cle contractuelle |
| Pack Manager - `pack-manager.service.spec.ts` | 33 TS2345, 4 TS2571 | Mocks `never` et retours inconnus | Jasmina | P2 | Typer les mocks Prisma/services et affiner les retours |
| Pack Manager - `ui-snapshot.integration.spec.ts` | 9 TS2345 | Mocks inferes en `never` | Jasmina | P2 | Typer les fixtures snapshot |
| Pack Manager - `pack-manager.service.ts` | 3 TS2339 | Client Prisma genere sans `Pack.applicationId` attendu par le code | Jasmina | P1 | Verifier schema/migration et regenerer le client dans un changement approuve |
| Pack Runtime - `pack-runtime.service.spec.ts` | 5 TS2345 | Mocks inferes en `never` | Nassa | P2 | Typer les mocks de runtime |
| Platform - `applications.service.spec.ts` | 14 TS2345, 1 TS2554 | Mocks `never` et signature obsolete | A confirmer - Platform | P2 | Typer les mocks et aligner le constructeur |
| Platform - `application-versions.service.spec.ts` | 14 TS2345, 1 TS2554 | Mocks `never` et signature obsolete | A confirmer - Platform | P2 | Typer les mocks et aligner le constructeur |
| Platform - `contract.service.spec.ts` | 9 TS2345 | Mocks inferes en `never` | A confirmer - Platform | P2 | Typer les mocks |
| Platform - `dashboard.service.spec.ts` | 6 TS18046, 4 TS2345, 1 TS2741 | Valeurs inconnues, mocks et champ requis absent | A confirmer - Platform | P2 | Affiner les types, typer les mocks et completer la fixture |
| UI Builder - `ui-builder.controller.spec.ts` | 1 TS2345 | Mock infere en `never` | Ranja | P2 | Typer le mock controller |
| UI Builder - `ui-builder.security.spec.ts` | 2 TS2345 | Mocks inferes en `never` | Ranja | P2 | Typer les mocks de securite |
| UI Builder - `ui-builder.service.spec.ts` | 72 TS2345 | Mocks inferes en `never` | Ranja | P2 | Introduire des factories de mocks types |

Les 23 lignes totalisent 304 diagnostics. Elles couvrent donc tous les diagnostics actuels, sans masquer les erreurs derriere un type global `any`.

## Charge par responsable

| Responsable | Diagnostics restants | Perimetre |
|---|---:|---|
| Nassa | 13 | IAM 2, Cockpit Deployment 6, Pack Runtime 5 |
| Jasmina | 49 | Pack Manager, dont 3 erreurs source Prisma P1 |
| Ranja | 75 | UI Builder |
| A confirmer - Business Manager | 104 | Six specifications Business Manager |
| A confirmer - Platform | 50 | Applications, versions, contrats, dashboard |
| A confirmer - Data Runtime | 4 | Provider d'acces BM |
| A confirmer - Integration | 7 | Autorisation integration |
| A confirmer - Automation | 1 | Controleur |
| A confirmer - ERP Adapter | 1 | Runtime resource |
| **Total** | **304** | |

## Priorisation et suite

1. **P1 - Jasmina / Pack Manager :** verifier l'ecart entre `Pack.applicationId`, le schema et le client Prisma genere. Ne pas lancer une regeneration ou modifier les migrations sans approbation dediee.
2. **P2 - Nassa / IAM :** traiter les deux permissions dupliquees seulement apres validation de leur semantique; elles sont hors perimetre Mami et restent intactes.
3. **P2 - autres modules :** remplacer progressivement les mocks non types par des factories typees et mettre a jour les fixtures/signatures selon leurs contrats reels.
4. Rejouer la commande complete apres chaque lot. REG-008 ne passe a `OK` qu'a zero diagnostic.

Aucune correction hors IAM n'a ete appliquee dans cette execution.
