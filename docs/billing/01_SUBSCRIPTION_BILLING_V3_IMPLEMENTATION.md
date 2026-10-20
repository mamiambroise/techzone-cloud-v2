# Subscription & Billing V3 — intégration frontend

## Périmètre

Cette livraison raccorde la navigation Billing V3 aux écrans et services déjà présents. Elle ne modifie ni les contrats API, ni la persistance, ni les règles de cycle de vie.

## Navigation

La sidebar présente désormais les quatre espaces tenant : **Mon abonnement**, **Utilisation**, **Factures & paiements** et **Paramètres**. Les quatre espaces plateforme sont **Offres & tarifs**, **Abonnements clients**, **Opérations financières** et **Diagnostics & audit**.

Les anciennes URLs demeurent disponibles : `/billing/plans`, `/billing/subscriptions`, `/billing/entitlements`, `/billing/payments`, `/billing/webhooks` et `/billing/admin`.

Les pages plateforme utilisent les endpoints `billingAdminService`; les routes sont filtrées par les permissions Billing correspondantes, et le backend conserve l'autorité finale via `IamAdminGuard` et `@Permissions`.

## Données et sécurité

- Les montants sont affichés tels que renvoyés par le backend, avec leur devise.
- La page d'accueil ne somme plus les montants de facture avec `Number` côté navigateur.
- Le compte de facturation utilise exclusivement `GET/POST /api/billing/billing-account`; l'écriture dépend de `billing:invoice:manage` et reste tenant-scopée côté serveur.
- Les vues plateforme utilisent les réponses réelles produits, plans actifs, abonnements, factures, paiements et diagnostics. Les capacités non exposées par les endpoints actuels (brouillons de plans et éditeur complet des tarifs) sont déclarées indisponibles, pas simulées.

## Vérification

- `npx vitest run src/app/navigationArchitecture.test.js src/app/navigationAccess.test.js src/app/navigationConfig.test.js` : 104 tests réussis.
- `npx vite build` : réussi.
- `npx jest src/modules/billing --runInBand` : 39 tests exécutés avec succès dans 3 suites; 4 suites ne démarrent pas à cause de la configuration Jest CommonJS/ESM de NestJS (`@nestjs/common`), préexistante et hors périmètre frontend.
