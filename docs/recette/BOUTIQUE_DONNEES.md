# Données de préparation — Boutique Pro 1.1

Les données ont été insérées dans `techzonecloud_dev`, schéma `business_manager`, à la demande explicite de travailler sur la cible de `backend/.env`. Cette demande remplace pour ce chargement la cible `techzone_test` prévue au CDC. Travail réalisé sur `Nassa`. Aucun reset, migration, changement de contrat/API ou publication.

## Contenu

- Deux tenants : `TENANT_BOUTIQUE_A` et `TENANT_BOUTIQUE_B`.
- Application A : `TECHZONE_BOUTIQUE`. Application B : `TECHZONE_BOUTIQUE_CONTROLE` (le schéma déployé impose un code globalement unique).
- Versions `1.0.0` et `1.1.0` en brouillon ; aucune ancienne version existante modifiée.
- Les 23 modèles effectivement énumérés dans le CDC sont déclarés dans chaque tenant : 46 entités, 234 champs, 56 relations déclaratives.
- 42 enregistrements métier dans A et 5 dans B, stockés dans `business_records`.
- Pack `PACK_BOUTIQUE_VENTE` par tenant, versions en brouillon ; aucune preuve de publication fabriquée.

Le CDC annonce 25 modèles alors que ses tableaux en contiennent 23 (5 + 3 + 4 + 5 + 3 + 2 + 1). Aucun modèle supplémentaire n'a été inventé.

## Utilisation des scénarios

| Scénario | Données de départ | Actions restant à exécuter dans l'application |
|---|---|---|
| SC-01 | `CDC-SC01-ACHAT`, 30 souris, coût 12 000 Ar, total 360 000 Ar, reçu 0 | Valider la commande, recevoir 20 puis 10, tenter 5 supplémentaires |
| SC-02 | `CDC-SC02-VENTE`, 2 claviers + 1 webcam + 3 HDMI, total 180 500 Ar, brouillon | Vérifier l'autorisation de remise et confirmer ; vérifier la sortie de stock |
| SC-03 | `CDC-SC03-ALPHA`, 500 000 Ar, client Alpha avec plafond 1 000 000 Ar | Confirmer, encaisser 150 000 + 200 000 Ar, créer la créance 150 000 Ar, solder |
| SC-04 | Webcams dépôt 20 / magasin 3 ; `CDC-SC04-TRANSFERT` en brouillon | Le CDC ne définit pas les lignes du transfert : sélectionner 8 webcams dans le parcours réel, confirmer deux fois |
| SC-05 | Produit `ROUTEUR`, magasin 1 unité | Lancer deux confirmations concurrentes via API avec deux vendeurs |
| SC-06 | Historique synthétique `CDC-SC06-HISTORIQUE`, 3 casques, 105 000 Ar, paiement et sortie 3 ; stock vendable restant 7 | Retourner un casque défectueux, vérifier 35 000 Ar, ne pas réintégrer au vendable |
| SC-07 | Vente `CDC-SC07-TENANT-B` exclusivement dans B | Provisionner les comptes et permissions réels puis vérifier les refus HTTP |
| SC-08 | Versions et packs en brouillon | Construire les pages, valider les contrats, publier et vérifier le Runtime |

Une livraison Alpha en brouillon et sa ligne sont également présentes. Les réceptions, créances, retours et événements d'audit ne sont pas préremplis : ils doivent résulter des actions réelles. Les données historiques SC-06 sont synthétiques et ne prouvent aucune exécution métier.

## Exécution

Depuis la racine du projet :

```bash
node scripts/recette/seed-boutique.cjs          # Simulation SQL puis ROLLBACK
node scripts/recette/seed-boutique.cjs --apply  # Insertion puis COMMIT
```

Le script lit uniquement `DATABASE_URL` dans `backend/.env`, sans afficher les identifiants. Les identifiants de fixtures sont déterministes. Les lignes existantes sont conservées ; un rejeu ne remet pas les scénarios à zéro. Une erreur annule l'ensemble de la transaction. Les cibles explicitement nommées production sont refusées.

Le résultat d'insertion est conservé dans `boutique-seed-result.json`. Les contraintes de relation sont déclaratives BM ; leur création ne prouve pas leur application par le Runtime.

## Limites de recette

**NOT TESTED** : les 20 pages, IAM/RBAC, contraintes métier, autorisations de remise, atomicité, concurrence, isolation HTTP, contrats et publication. Le chargement des données ne réalise pas ces fonctionnalités.

Au chargement initial, la base ne possédait pas `pm_packs.applicationId`. Cet écart a été corrigé le 20 octobre 2026 par application de la migration existante `20261015000000_pack_application_scope`, avec rapprochement des packs dont les versions désignent une application unique. Voir `PACK_RUNTIME_CORRECTIONS.md` et `runtime-db-verification.json`. Les résultats JSON du seed initial conservent leur état historique.

Aucun compte, mot de passe, session ni privilège IAM n'a été ajouté. L'accès aux deux nouveaux tenants doit être configuré via l'administration IAM réelle.
