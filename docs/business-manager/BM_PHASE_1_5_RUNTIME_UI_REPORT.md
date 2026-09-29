# Phase 1.5 — runtime et interface

Statut final au 2026-09-28 : **PARTIAL / BLOCKED_DATABASE**. La recette P0.5 qui suit est détaillée dans [P0_5_RUNTIME_WINDOWS_REPORT.md](../audit/P0_5_RUNTIME_WINDOWS_REPORT.md).

La navigation canonique compte 11 groupes et 115 définitions, dont 114 routes enregistrées et 29 redirections historiques. Le contrôle statique ne trouve aucune cible cassée. Les pages manquantes sont explicites (`ComingSoon`), les accès IAM restent filtrés selon les permissions effectives. `/business-manager/*` est canonique ; `/business/*` redirige.

Le refresh de session est partagé entre clients API et limité à une tentative après 401. AuthProvider attend un véritable utilisateur ; TenantProvider attend l'authentification et confirme le tenant auprès du serveur avant de publier le contexte. Aucun tenant fictif ni rôle de démonstration ne remplace les permissions IAM.

Configuration appelle le controller existant `/api/business-manager/configurations`. Son état de chargement, ses erreurs et son contexte sont visibles ; les valeurs de démonstration ne remplacent pas une erreur API. Les vues BM encore statiques sont classées partielles, pas implémentées de bout en bout.

Validation : frontend build et typecheck PASS, 43 tests PASS. Navigation statique PASS. Les essais navigateur précédant P0.5 ont connecté le compte et affiché les routes, mais les vues métier étaient bloquées par l'absence de tenant. Le dernier parcours étendu a expiré pendant l'expansion des sous-menus ; il ne constitue donc pas une recette complète. Les captures et `runtime/browser.json` sont des preuves historiques de ce contexte, pas des captures de Business Manager opérationnel.

P0.5 a ensuite créé le tenant et validé les cookies HttpOnly, la sélection et la session réelles. Il a révélé l'absence des colonnes `tenantId` métier en base. Conformément à l'arrêt demandé lorsqu'une migration est nécessaire, la recette navigateur métier complète et l'isolation DB restent à relancer après correction du schéma. Aucun Phase 2/CDC suivant commencé.
