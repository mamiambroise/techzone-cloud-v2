# UI Builder — consolidation de la spécification UI

Branche : `Ranja`. Modifications limitées au frontend et à la documentation.

Ajouts de cette passe :
- contexte commun tenant/application/version/page/device/statut et état de sauvegarde ;
- complétion calculée sur les étapes READY du serveur ;
- validation immédiate de format et unicité de route ;
- liens de validation ciblant le composant présent dans la page ;
- six onglets de l’inspecteur, visibilité par device et définition avancée en lecture seule ;
- accès aperçu depuis l’éditeur, badge PREVIEW, expansion plein écran et erreurs explicites ;
- focus clavier et réduction des mouvements limités au workspace.

Les écrans existants, les callbacks par valeur, la sélection automatique des pages et le Shared Renderer sont conservés.

## Écarts restant à traiter avant conformité complète

- Historique de révisions persistant : toujours absent. La passe technique suivante ajoute la comparaison et le rechargement des conflits via expectedUpdatedAt ; voir UI_BUILDER_TECH_IMPLEMENTATION.md.
- Permissions distinctes editor/validator : à relier aux autorisations réellement exposées ; le statut éditable de version ne constitue pas un rôle utilisateur.
- Séquence complète de binding operation/filtres/tri/pagination et badges d’autorisation : à exposer selon les capacités des contrats enregistrés.
- Gestion des pages : duplication, renommage, validation par page et colonnes complètes.
- Cockpit regroupé dans les dix domaines de validation.
- Inspector tablette sous forme de drawer avec gestion du focus.
- Certification visuelle navigateur aux quatre largeurs et tests de concurrence avec serveur réel.

Cette passe ne certifie pas l’ensemble des 32 sections du cahier des charges.
