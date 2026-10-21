# Certification Billing V3 — 20 octobre 2026

## Verdict

**NON CERTIFIÉ pour une mise en production.** Le socle Billing livré au commit
`896ee0c2` est réel et les sept suites unitaires Billing passent, mais plusieurs
écrans et flux obligatoires des références ne sont pas encore disponibles. Il
manque en outre une campagne E2E Billing et une vérification navigateur
authentifiée.

Cette certification porte sur le code de la branche `mami`, sans modifier les
contrats, les routes ou les règles métier déjà livrées.

## Périmètre et références contrôlés

Les exigences ont été comparées à :

- `docs/billing/01_SUBSCRIPTION_BILLING_V3_IMPLEMENTATION.md`
- `Cahiers de charges/TECHZONE_SUBSCRIPTION_BILLING_V3/01_CDC_SUBSCRIPTION_BILLING_ETAPE_1_CIBLE.md`
- `Cahiers de charges/TECHZONE_SUBSCRIPTION_BILLING_V3/02_CDC_SUBSCRIPTION_BILLING_ETAPE_2_GAP_PLAN.md`
- `Cahiers de charges/TECHZONE_SUBSCRIPTION_BILLING_V3/03_SPEC_UI_SUBSCRIPTION_BILLING.md`
- `Cahiers de charges/TECHZONE_SUBSCRIPTION_BILLING_V3/04_TECH_SUBSCRIPTION_BILLING.md`
- `Cahiers de charges/TECHZONE_SUBSCRIPTION_BILLING_V3/05_SECURITY_TEST_SUBSCRIPTION_BILLING.md`
- `Cahiers de charges/TECHZONE_SUBSCRIPTION_BILLING_V3/06_MAQUETTES_SUBSCRIPTION_BILLING.md`

## Huit rubriques Billing

Un résultat `FAIL` signifie que la rubrique ne couvre pas encore le périmètre
fonctionnel demandé, même si sa route et une partie de ses données réelles sont
disponibles.

| Rubrique | Route | Données / service réel | Statut | Constat |
| --- | --- | --- | --- | --- |
| Mon abonnement | `/billing` | abonnement, droits, actions de cycle | PASS | Consultation et actions existantes ; les états de cycle sont désormais explicitement signalés. |
| Utilisation | `/billing/usage` | usage et limites Billing | PASS | Données réelles, états de chargement/erreur existants ; absence de mesure E2E navigateur. |
| Factures & paiements | `/billing/invoices`, `/billing/payments` | factures, lignes, documents, paiements | FAIL | Détail paiement, rapprochement complet et parcours unifié restent incomplets. |
| Paramètres | `/billing/settings` | compte de facturation | PASS | Nom légal, e-mail, adresse, taxe et devise sont reliés au service existant. |
| Offres & tarifs | `/billing/admin/catalog` | produits, plans, prix | FAIL | Consultation réelle, mais création/édition de plans, prix, droits et limites absente. |
| Abonnements clients | `/billing/admin/subscriptions` | abonnements plateforme | FAIL | Liste réelle seulement ; détail, filtre tenant et actions d'exploitation absents. |
| Opérations financières | `/billing/admin/operations` | factures et paiements | FAIL | Consultation réelle, mais revue de génération, ajustements et rapprochement opérateur absents. |
| Diagnostics & audit | `/billing/admin/diagnostics` | signaux, sweeps, webhooks | FAIL | Diagnostic partiel ; audit financier et pont ERP ne sont pas implémentés. |

## Couverture des 40 maquettes

| Maquette | État | Élément vérifié / écart |
| --- | --- | --- |
| M01 — Vue d'ensemble | PARTIEL | Synthèse réelle présente, mais pas les six KPI compacts de la maquette. |
| M02 — Plan actuel | PASS | Abonnement courant et statut disponibles. |
| M03 — Droits | PARTIEL | Liste réelle, présentation non équivalente aux cartes attendues. |
| M04 — Utilisation | PARTIEL | Données par période disponibles, sans jauges de progression complètes. |
| M05 — Détail d'usage | PARTIEL | Événements/période disponibles ; détail visuel incomplet. |
| M06 — Avertissement quota | PARTIEL | Statut remonté, sans seuil et progression dédiés. |
| M07 — Quota atteint | PARTIEL | Statut possible, pas d'écran/politique dédiée. |
| M08 — Liste factures | PARTIEL | Liste réelle et statuts, filtrage/revue attendus incomplets. |
| M09 — Détail facture | PARTIEL | Lignes, totaux et document ; compte, paiements, ajustements et timeline incomplets. |
| M10 — Ligne de facture | PARTIEL | Lignes visibles sans détail dédié. |
| M11 — Liste paiements | PARTIEL | Liste réelle ; informations de rapprochement incomplètes. |
| M12 — Détail paiement | ABSENT | Pas de vue de détail/audit de rapprochement. |
| M13 — Paiement manuel | PARTIEL | Action réelle existante, pas de modal opérateur dédiée. |
| M14 — Impayé | PASS | Alerte explicite basée sur `PAST_DUE`. |
| M15 — Grâce | PARTIEL | Alerte et fin de grâce réelles, sans compte à rebours/écran complet. |
| M16 — Suspendu | PASS | Alerte explicite, sans inventer de données. |
| M17 — Réactivation | PARTIEL | Action/retour de statut existants, confirmation visuelle limitée. |
| M18 — Résiliation | PASS | Actions de résiliation existantes. |
| M19 — Upgrade | PARTIEL | Sélection réelle, information d'effet/calendrier insuffisante. |
| M20 — Downgrade | PARTIEL | Sélection réelle, information d'effet/calendrier insuffisante. |
| M21 — Paramètres facturation | PASS | Adresse ajoutée aux champs réellement sauvegardés. |
| M22 — Catalogue produits | PARTIEL | Consultation réelle, aucune gestion complète. |
| M23 — Liste plans | PARTIEL | Plans/prix actifs visibles, liste d'administration incomplète. |
| M24 — Détail plan | ABSENT | Pas de page dédiée. |
| M25 — Création plan | ABSENT | API existante, aucun éditeur UI. |
| M26 — Liste prix | PARTIEL | Prix inclus au catalogue, aucune liste dédiée complète. |
| M27 — Éditeur prix | ABSENT | Aucun éditeur UI. |
| M28 — Éditeur droits | ABSENT | Aucun éditeur UI. |
| M29 — Éditeur limites | ABSENT | Aucun éditeur UI. |
| M30 — Abonnements clients | PARTIEL | Liste réelle, sans recherche/filtre tenant ni actions. |
| M31 — Détail abonnement client | ABSENT | Pas de détail opérateur dédié. |
| M32 — Revue génération facture | ABSENT | Endpoint backend sans écran de revue. |
| M33 — Ajustement | ABSENT | Endpoint backend sans interface. |
| M34 — État fournisseurs paiement | PARTIEL | Éléments de statut présents, sans classification et supervision complète. |
| M35 — Webhooks | PARTIEL | Route profonde et données reçues, pas de revue/réconciliation complète. |
| M36 — Diagnostics | PARTIEL | Signaux et sweeps, couverture ERP incomplète. |
| M37 — Audit financier | ABSENT | Aucun journal financier dédié. |
| M38 — Pont ERP | ABSENT | Aucun écran ni contrôle dédiés. |
| M39 — Mobile | PARTIEL | Grilles/overflow réactifs relus statiquement ; pas de test navigateur mobile. |
| M40 — Cycle de vie | PARTIEL | Actions/statuts et tests backend, sans visualisation complète du flux. |

## Tests exécutés

| Contrôle | Commande / portée | Résultat |
| --- | --- | --- |
| Schéma de base de test | `npm run prisma:test:status` dans `backend` | PASS — base isolée `techzone_test`, schéma à jour. |
| Suites Billing | `npm test -- --runInBand src/modules/billing` dans `backend` | PASS — 7 suites, 77 tests. |
| Build backend | `npx nest build` dans `backend` | PASS. |
| Navigation frontend | `npx vitest run src/app/navigationArchitecture.test.js src/app/navigationAccess.test.js src/app/navigationConfig.test.js` | PASS — 3 fichiers, 104 tests. |
| Build frontend | `npx vite build` dans `frontend` | PASS. |
| E2E isolation/IAM | `npm run test:e2e -- --runInBand iam-cross-tenant.e2e-spec.ts` | FAIL — 17/19 assertions passent, 2 MFA échouent. |
| E2E Billing complet | Recherche des suites E2E Billing | NON EXÉCUTÉ — aucune suite Billing E2E n'existe actuellement. |
| Revue navigateur desktop/mobile | Serveur local + compte de test | NON EXÉCUTÉ — `npm run status` retourne « Accès refusé » et aucun navigateur de test authentifié n'est disponible. |

### Suites Billing détaillées

| Suite | Résultat |
| --- | --- |
| `common/money.spec.ts` | PASS |
| `common/billing-period.spec.ts` | PASS |
| `subscription/subscription-lifecycle.spec.ts` | PASS |
| `invoice/billing-invoice.service.spec.ts` | PASS |
| `payment/billing-payment.service.spec.ts` | PASS |
| `lifecycle/billing-lifecycle.service.spec.ts` | PASS |
| `webhook/billing-webhook.service.spec.ts` | PASS |

## Diagnostic Jest CommonJS / ESM

Les quatre suites signalées comme bloquées ne nécessitaient pas une modification
de configuration. La configuration Jest est déjà ESM (`ts-jest` avec
`useESM: true`) et le script `backend/package.json` lance Jest avec
`node --experimental-vm-modules`.

Le blocage était provoqué par l'appel direct à `npx jest`, qui contourne ce
script et exécute Jest sans les modules VM ESM. L'exécution via `npm test --`
utilise la configuration existante et a relancé toutes les suites Billing avec
succès. Aucun changement de runtime ou de configuration n'a donc été introduit.

## Parcours demandés : niveau de preuve

| Parcours | Niveau vérifié | Résultat |
| --- | --- | --- |
| Tenant : abonnement, usage, factures, paiements, paramètres | Routes et services réels, build ; pas de navigateur | PARTIEL |
| Admin : catalogue, abonnements, opérations, diagnostics | Routes/services réels, build ; fonctionnalités incomplètes | PARTIEL |
| Activation et résolution des droits | Tests lifecycle/subscription | PASS unitaire |
| Génération/consultation facture | Tests invoice + pages | PASS unitaire, E2E absent |
| Paiement manuel et rapprochement | Tests payment | PASS unitaire ; rapprochement UI E2E absent |
| Paiement refusé/non confirmé | Tests payment/webhook | PASS unitaire |
| Renouvellement, retard, grâce, suspension, réactivation | Tests lifecycle/subscription | PASS unitaire |
| Quotas et limites | Revue des écrans | NON TESTÉ E2E |
| Isolation entre deux tenants | Tests invoice/payment | PASS unitaire ; E2E Billing absent |
| IAM et droits commerciaux backend | Tests unitaires et navigation | PARTIEL — E2E IAM bloqué par MFA hors Billing |

## Défauts corrigés durant la certification

- Les paramètres de facturation pouvaient afficher/sauvegarder nom, e-mail,
  taxe et devise, mais pas l'adresse de facturation : le champ est maintenant
  relié au compte de facturation existant.
- Les états `PAST_DUE`, `GRACE_PERIOD` et `SUSPENDED` n'étaient pas assez
  explicites dans la vue d'abonnement : des alertes contextuelles utilisent
  désormais exclusivement le statut et la date de grâce réels.
- Les onglets administrateur Billing restaient visibles sans contrôle de droits
  côté interface : ils sont maintenant filtrés par les permissions existantes.

## Défauts et fonctionnalités restant à réaliser

- Éditeurs d'administration produits/plans/prix/droits/limites ; les API ne
  justifient pas de les présenter comme terminés sans interface correspondante.
- Détails opérateur d'abonnement et de paiement, ajustements, revue de
  génération de facture et rapprochement complet.
- Audit financier et pont ERP.
- Suite E2E Billing couvrant les deux tenants, les permissions IAM, les droits,
  les limites et l'intégralité du cycle de paiement sans prestataire réel.
- Vérification visuelle authentifiée desktop et mobile, incluant chargement,
  vide, erreur et état interdit.

## Risques bloquants avant production

1. **Couverture fonctionnelle administrateur insuffisante** : les écrans de
   gestion et de contrôle financier attendus ne sont pas implémentés.
2. **Absence de campagne E2E Billing** : les isolations tenant et IAM sont
   vérifiées unitairement mais pas par des requêtes HTTP de bout en bout.
3. **E2E IAM non vert** : le test MFA échoue car le client Prisma de test ne
   fournit pas `mfaChallenge` (`this.prisma.mfaChallenge.create` est
   indéfini). La migration/schema contient bien `MfaChallenge`; il faut
   diagnostiquer la génération du client de test séparément, sans masquer ces
   deux échecs.
4. **Validation visuelle non exécutable dans cet environnement** : aucun rendu
   navigateur authentifié n'a permis de certifier les états mobile et les huit
   rubriques de façon interactive.

## Décision

Le build et le socle backend Billing sont sains au niveau unitaire, mais les
écarts ci-dessus empêchent une certification de production. La prochaine étape
doit être une implémentation ciblée des écrans administrateur manquants suivie
d'une vraie suite E2E Billing sur la base `techzone_test`, puis d'une revue
navigateur avec un compte tenant et un compte plateforme de test.
