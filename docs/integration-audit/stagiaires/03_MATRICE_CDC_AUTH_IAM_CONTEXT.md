# Matrice CDC — Auth, IAM et contexte

| Exigence CDC | État | Correction / preuve |
| --- | --- | --- |
| Compte désactivé, suspendu, verrouillé ou archivé refusé | Conforme | La connexion, le rafraîchissement et le garde JWT revalident l'état persistant de l'utilisateur et refusent par défaut les états inconnus. |
| Révocation immédiate des accès après suspension | Conforme | La suspension révoque sessions actives et jetons de rafraîchissement ; le garde refuse aussi l'utilisateur devenu inactif. |
| Session et JWT cohérents | Conforme | Le principal est construit depuis la session persistée ; l'identité tenant/site n'est plus ressuscitée depuis un JWT seul. |
| Adhésion valide et non révoquée | Conforme | Les contrôles incluent statut, fenêtre de validité, révocation et états tenant/organisation/site. |
| Isolation tenant / organisation / site | Conforme dans le périmètre audité | Le contexte contrôle les relations hiérarchiques et refuse les combinaisons inter-tenant ou inter-organisation. |
| Permissions sans autorisation périmée | Conforme | La résolution des autorisations est relue en persistance pour chaque accès gardé ; l'ancien cache de cinq secondes est supprimé. |
| Changement de tenant | Conforme | Le changement persiste tenant, organisation et site de la session, invalide l'autorisation puis émet le jeton. |
| Surface de permission Deployment / Business Manager | Conforme | Les constantes de permissions manquantes et leurs alias ont été restaurés. |

## Couverture de test

Les tests ciblés couvrent notamment : rejet d’une session d’utilisateur suspendu sans mise à jour d’activité, révocation transactionnelle, adhésion cross-tenant invalide, dérivation organisation/site et absence de cache d’autorisation obsolète.

Le runner E2E Nest/PostgreSQL isolé a aussi validé 16 scénarios : accès A/B inter-tenant, lecture/écriture/suppression refusées, session révoquée, rôle/permission, jetons invalides et challenge MFA. Cette couverture ne constitue pas une E2E navigateur.

## Reste recommandé

Étendre les E2E HTTP aux parcours administrateur complémentaires et aux courses concurrentes hors du périmètre IAM déjà couvert.
