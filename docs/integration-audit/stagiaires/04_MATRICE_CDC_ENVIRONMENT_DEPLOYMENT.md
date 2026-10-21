# Matrice CDC — Environment et Deployment

| Exigence CDC | État | Correction / preuve |
| --- | --- | --- |
| Permission explicite par endpoint | Conforme dans le périmètre audité | Les contrôleurs cockpit, deployments, diagnostics, environments, gates, releases et rollback portent les métadonnées `RequirePermission` attendues. |
| Tenant obligatoire et acteur fiable | Conforme dans le périmètre audité | Les services exploitent le tenant et l’utilisateur du principal ; les valeurs client `startedBy`/`actor` ne sont pas des autorités d’audit. Diagnostics, cockpit, release et rollback sont aussi filtrés par tenant. |
| Idempotence et ressources de déploiement cloisonnées | Conforme dans le périmètre audité | Les recherches de release, environment, deployment, listes et agrégats sont bornés au tenant du principal ; des tests de frontières inter-tenant ont été ajoutés. |
| Transitions concurrentes | Corrigé | Un verrou transactionnel PostgreSQL par tenant/environnement sérialise les créations concurrentes ; les transitions utilisent des mises à jour conditionnelles (CAS). Une annulation ou un échec ne peut plus être réécrit en `SUCCEEDED`, ni promouvoir l’environnement. |
| `SUCCEEDED` sans preuve | Corrigé en fail-closed | La promotion exige une preuve HTTP de readiness fraîche, liée au deployment/release/environment/tenant/trace, avec `activationId`, état runtime `READY`/`HEALTHY` et dépendances critiques `UP`. Un 200 seul, une preuve synthétique, incohérente, périmée, en erreur ou en timeout est refusé. |
| Sortie réseau de la sonde | Bornée | La sonde ne consulte que `GET /health/ready` d’une origine présente dans `DEPLOYMENT_RUNTIME_ALLOWED_ORIGINS`; une URL absente, invalide ou non autorisée échoue fermée. |
| Gates STAGING / PRODUCTION | Bloquées volontairement | Sans fournisseur de preuves immuables de tests et de sécurité, les gates requises `TESTS_PASS` et `SECURITY_CHECK` échouent. Aucun passage automatique n’est accordé. |
| Activation fournisseur/runtime réelle | Non démontrée | Aucun orchestrateur d’apply/activation ni fournisseur de runtime externe n’est implémenté ou qualifié par E2E dans ce périmètre. |

## Décision de conformité

Le faux succès interne est supprimé : une absence de preuve de readiness ne peut plus produire `SUCCEEDED`. Cela améliore le comportement de sûreté et protège l’état connu de l’environnement.

La conformité production complète reste non déclarée. La preuve HTTP n’est ni signée ni attestée par un fournisseur et aucun mécanisme mTLS, orchestrateur d’activation ou E2E avec runtime externe n’a été validé. Ces éléments sont requis avant d’affirmer qu’un artefact est réellement appliqué chez un fournisseur.
