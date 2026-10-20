# Guide de recette — Techzone Boutique Pro 1.1

Ce guide explique les étapes à suivre après `node scripts/recette/seed-boutique.cjs` pour exécuter le [CDC Boutique Pro](../../SCENARIO_RECETTE_TECHZONE_BOUTIQUE_PRO_V1_1.md). Le seed prépare les données ; il ne valide pas les scénarios métier.

## 1. Vérifier la branche et la cible

Depuis la racine du projet :

```bash
git branch --show-current
npm run status
```

La branche attendue pour cette recette est **Nassa**. Si une autre branche apparaît, arrêter cette procédure et vérifier le contexte sans basculer automatiquement.

La préparation existante utilise `DATABASE_URL` de `backend/.env` : base **techzonecloud_dev**, schéma **business_manager**. C'est une dérogation demandée à la base `techzone_test` prévue par le CDC. Consigner cette dérogation dans le procès-verbal. Ne pas copier les identifiants de connexion dans les preuves.

Si les services sont arrêtés :

```bash
npm run dev
```

Ouvrir `http://localhost:3000`. Le backend utilise le port `3003` ; son contrôle de santé est `/health`. Éviter de lancer plusieurs serveurs ou compilations en parallèle.

## 2. Comprendre le résultat du seed

| Résultat | Interprétation | Suite |
|---|---|---|
| `DRY_RUN_ROLLED_BACK` | Simulation ; aucune nouvelle insertion conservée | Vérifier les compteurs et les données existantes |
| `reused` avec `created: {}` | Les données correspondantes existent déjà | Continuer les vérifications dans l'interface |
| Des créations simulées | Des données manquent encore | Si leur insertion dans la cible vérifiée est souhaitée, utiliser `--apply` |
| `acceptance: NOT TESTED` | Aucun scénario de recette validé par ce résultat | Exécuter les étapes suivantes |

Pour conserver les insertions nécessaires, uniquement après vérification de la cible :

```bash
node scripts/recette/seed-boutique.cjs --apply
```

**Le rejeu du seed ne remet pas les stocks ni les scénarios à zéro.** Les lignes existantes sont conservées. Ne pas l'utiliser comme outil de réinitialisation.

La préparation attendue est décrite dans [BOUTIQUE_DONNEES.md](BOUTIQUE_DONNEES.md) :

- Tenant A : `TENANT_BOUTIQUE_A`, application `TECHZONE_BOUTIQUE`, 42 enregistrements métier.
- Tenant B : `TENANT_BOUTIQUE_B`, application `TECHZONE_BOUTIQUE_CONTROLE`, 5 enregistrements métier.
- Versions applicatives `1.0.0` et `1.1.0` et packs `PACK_BOUTIQUE_VENTE` initialement en brouillon.
- 23 modèles par tenant : le CDC en annonce 25 mais en énumère 23. Consigner cet écart sans inventer deux modèles.

Les données métier sont stockées dans `business_records`, et non dans des tables physiques nommées `Product`, `Sale`, etc.

## 3. Préparer les accès IAM

### Créer l'administrateur par le seed

Depuis la racine du projet :

```bash
node scripts/recette/seed-boutique.cjs --with-admin          # Simulation
node scripts/recette/seed-boutique.cjs --with-admin --apply  # Création conservée
```

Cette option crée `boutique.recette.admin`, administrateur **plateforme IAM** (`isAdmin: true`), avec des appartenances actives à Boutique A et Boutique B et Boutique A comme tenant par défaut. Ce compte privilégié sert à préparer la recette ; utiliser les comptes métier restreints pour les tests de permissions et d'isolation.

Un mot de passe aléatoire est généré et haché avec bcrypt. Les identifiants sont enregistrés uniquement dans `.env.boutique-admin`, à la racine, ignoré par Git et accessible au propriétaire (`0600`). Pour les consulter dans votre terminal local :

```bash
cat .env.boutique-admin
```

Ne pas partager ce contenu. Se connecter sur `http://localhost:3000` avec `BOUTIQUE_ADMIN_USERNAME` et `BOUTIQUE_ADMIN_PASSWORD`, puis sélectionner **Boutique A** ou **Boutique B**. Le rejeu conserve le compte et son mot de passe. Une collision avec un autre compte est refusée, sans promotion automatique. Si le fichier du mot de passe a été perdu pour un compte déjà créé, utiliser la récupération IAM ; le seed ne réinitialise pas son mot de passe.

Sans `--with-admin`, le seed conserve son comportement initial et ne crée aucun compte.

1. Se connecter avec un compte autorisé.
2. Dans l'administration IAM, vérifier son appartenance active à `TENANT_BOUTIQUE_A`.
3. Pour préparer les modèles, attribuer le rôle réel adapté, notamment `application_manager` avec le périmètre nécessaire, par un administrateur habilité.
4. Préparer les profils du CDC : administrateur boutique, vendeur, stockiste et lecteur, avec leurs permissions métier réelles.
5. Préparer deux vendeurs distincts pour la concurrence et un accès distinct au tenant B pour contrôler ses données.

Les profils métier restent à créer séparément : l'option `--with-admin` ne crée que l'administrateur de préparation. Ne pas remplacer les profils métier par cet accès global `isAdmin` ou des permissions universelles. Si les rôles ou permissions nécessaires n'existent pas, marquer les tests concernés **BLOCKED** et décrire le manque.

Pour le test d'isolation, utiliser un vendeur de A sans accès à B.

## 4. Vérifier les modèles et les règles

Dans **Business Manager → Applications → TECHZONE_BOUTIQUE → 1.1.0 → Modèles de données** :

1. Retrouver les 23 modèles listés dans le CDC.
2. Vérifier les champs, types, relations, références, montants et quantités.
3. Vérifier les règles attendues : SKU/références uniques, quantités positives, stock disponible, remise autorisée et paiement correctement affecté.
4. Vérifier leur application effective côté serveur lors des opérations métier.

La présence de métadonnées BM ne prouve pas que ces règles sont exécutées. Si une réception, un transfert, une confirmation de vente ou un retour ne possède aucun parcours métier fonctionnel, déclarer le scénario **BLOCKED**. Ne pas modifier directement la base pour fabriquer le résultat attendu.

### Référence de version 1.0.0

Le seed crée une version `1.0.0` en brouillon ; cela ne prouve pas qu'elle constitue une référence fonctionnelle complète. Les définitions préparées pour la recette concernent la version `1.1.0`.

Pour SC-08, contrôler ou compléter la référence `1.0.0` conformément au CDC, puis suivre sa validation et sa publication normales. Conserver ensuite cette référence pour la comparaison avec `1.1.0`. Ne pas modifier une version publiée immuable ni dupliquer la version `1.1.0` déjà présente. Si la référence manque, consigner ce prérequis comme bloquant.

## 5. Préparer les 20 pages Boutique

Le module plateforme `/runtime` permet de gérer l'exécution des packs. Les pages commerciales ci-dessous doivent être créées ou vérifiées dans **UI Builder**, avec leurs bindings réels.

Ces chemins sont les routes **à l'intérieur de l'application publiée**. Leur existence dans le CDC ne garantit pas une URL directement accessible à la racine de la plateforme.

| Page | Route prévue |
|---|---|
| Tableau de bord | `/dashboard` |
| Produits | `/products` |
| Détail produit | `/products/:id` |
| Référentiels catalogue | `/catalog/references` |
| Fournisseurs | `/suppliers` |
| Achats | `/purchases` |
| Réceptions | `/receipts` |
| Stocks | `/inventory` |
| Mouvements | `/inventory/movements` |
| Transferts | `/inventory/transfers` |
| Clients | `/customers` |
| Nouvelle vente | `/sales/new` |
| Ventes | `/sales` |
| Détail vente | `/sales/:id` |
| Paiements | `/payments` |
| Créances | `/receivables` |
| Retours | `/returns` |
| Livraisons | `/deliveries` |
| Rapports | `/reports` |
| Paramètres | `/settings` |

Pour chaque page, vérifier les données du tenant actif, les actions autorisées, la persistance après rechargement et les états chargement/vide/erreur. Vérifier aussi l'affichage mobile, le clavier et la lisibilité. Une maquette sans données persistées ne valide pas le scénario.

## 6. Valider, publier et ouvrir le pack

1. Vérifier un environnement actif et autorisé dans le module des environnements. Le seed Boutique n'en crée pas.
2. Effectuer les validations requises dans Business Manager, UI Builder et Pack Manager.
3. Vérifier les contrats, versions verrouillées, snapshot UI et empreintes attendus avant publication.
4. Publier par le parcours normal avec les permissions requises ; vérifier les conditions de disponibilité et de déploiement applicables à l'environnement.
5. Ouvrir `http://localhost:3000/runtime`, puis **Lancer un pack** (`/runtime/resolver`).
6. Choisir l'application, la version publiée du pack et l'environnement actif, puis lancer la résolution.
7. Si le résultat est `BLOCKED`, consulter les diagnostics et corriger le prérequis indiqué.
8. Si le résultat est `EXECUTABLE`, activer avec un compte autorisé.
9. Vérifier le contexte **ACTIVE** et **READY**, puis cliquer sur **Ouvrir l'application**.

`EXECUTABLE` seul ne signifie pas que l'application est ouverte. Une résolution expirée doit être recalculée ; sa durée de validité est de 30 minutes. Aucun pack proposé peut simplement signifier que les versions sont encore en brouillon.

Ne pas contourner un blocage en forçant un statut dans la base. Si une étape nécessaire n'est pas disponible, consigner le blocage avant de poursuivre les tests dépendants.

## 7. Organiser la recette sans fausser les stocks

Avant chaque scénario, noter les quantités, statuts et montants réels de départ. Conserver une capture de l'interface et les réponses HTTP utiles ; vérifier les écritures persistées avec des lectures de la base lorsque nécessaire.

**Ordre conseillé pour les données partagées : SC-01, SC-04, SC-02, SC-03, SC-05, SC-06, SC-07, puis comparaison finale SC-08.** La préparation et l'ouverture du pack de l'étape 6 restent préalables aux tests dans l'application.

SC-04 doit partir de 20 webcams au dépôt et 3 au magasin. SC-02 consomme une webcam : le réaliser avant SC-04 modifierait ce prérequis. Après SC-04, contrôler SC-02 avec les quantités réelles avant/après, en signalant cet enchaînement. Pour une exécution indépendante avec les valeurs exactes du CDC, prévoir des données isolées ou rétablir les préconditions par les opérations métier autorisées et tracées.

SC-05 consomme le dernier routeur. Un rejeu nécessite également une préparation métier contrôlée. Aucune réinitialisation silencieuse ni relance du seed ne remplace cette préparation.

## 8. Exécuter les scénarios

### SC-01 — Achat et réceptions partielles

1. Ouvrir `CDC-SC01-ACHAT` : 30 souris USB à 12 000 Ar, total 360 000 Ar, reçu initialement 0.
2. Valider l'achat par l'action métier prévue.
3. Réceptionner 20 unités dans l'entrepôt choisi, puis vérifier un reliquat de 10.
4. Réceptionner les 10 restantes, puis vérifier un reliquat de 0.
5. Tenter une réception supplémentaire de 5 : elle doit être refusée.
6. Répéter une validation déjà effectuée et vérifier l'absence de double entrée.

**Attendu :** deux réceptions validées, mouvements correspondants, stock augmenté de 30 au total dans l'entrepôt concerné. La souris a un stock magasin initial de 0 ; consigner précisément l'entrepôt de réception et son solde initial.

### SC-02 — Vente avec remise

1. Ouvrir `CDC-SC02-VENTE` en brouillon.
2. Vérifier 2 claviers à 40 000 Ar, 1 webcam à 65 000 Ar et 3 HDMI à 15 000 Ar.
3. Vérifier le sous-total de 190 000 Ar, la remise de 9 500 Ar (5 %) et le total de 180 500 Ar.
4. Vérifier que le profil connecté a le droit d'appliquer cette remise.
5. Relever les stocks, confirmer, puis contrôler les sorties : 2 claviers, 1 webcam et 3 HDMI.
6. Répéter la confirmation et vérifier qu'aucune seconde sortie n'est créée.

**Attendu :** montants corrects, contrôle de permission serveur et décréments uniques. Les stocks magasin préparés avant toute opération sont clavier 10, webcam 3 et HDMI 20 ; un transfert préalable modifie le solde webcam.

### SC-03 — Paiement partiel et créance

1. Ouvrir `CDC-SC03-ALPHA`, montant 500 000 Ar, client Société Alpha, plafond 1 000 000 Ar.
2. Confirmer la vente, puis enregistrer 150 000 Ar en espèces et 200 000 Ar en paiement mobile.
3. Vérifier les encaissements de 350 000 Ar et le solde à payer de 150 000 Ar.
4. Vérifier la créance de 150 000 Ar : ce montant ne doit pas être compté comme un paiement reçu.
5. Enregistrer le règlement final de 150 000 Ar.
6. Vérifier un solde nul et des encaissements cumulés de 500 000 Ar ; tester les affectations excessives selon le contrat métier.

**Attendu :** paiements, affectations et créance cohérents et persistés. Les paiements initiaux ne sont pas précréés par le seed.

Pour une livraison partielle, choisir une ligne de quantité supérieure à 1, par exemple les deux claviers de SC-02. La ligne Alpha préparée de quantité 1 ne permet pas de démontrer deux livraisons partielles positives.

### SC-04 — Transfert de stock

1. Vérifier le stock webcam : dépôt 20, magasin 3, total 23.
2. Ouvrir `CDC-SC04-TRANSFERT` et sélectionner réellement le produit webcam et la quantité 8 dans le parcours métier.
3. Confirmer le transfert dépôt → magasin.
4. Vérifier dépôt 12, magasin 11, total 23 et les mouvements associés.
5. Répéter la confirmation : les soldes doivent rester identiques.

**Attendu :** transfert atomique sans création ni perte de stock. Le CDC ne définit pas de lignes de transfert : si le parcours ne permet pas de saisir produit et quantité, le test est **BLOCKED**.

### SC-05 — Deux ventes concurrentes

1. Vérifier que le magasin possède exactement 1 unité du SKU `ROUTEUR`.
2. Avec deux vendeurs autorisés du tenant A, préparer deux ventes distinctes demandant chacune cette unité.
3. Envoyer les deux confirmations réellement en concurrence, avec leurs identifiants de requête distincts.
4. Conserver les deux réponses HTTP et vérifier les écritures persistées.

**Attendu :** une seule vente confirmée, l'autre refusée ou laissée en attente selon le contrat, stock final 0 et une seule sortie. Deux clics successifs ne prouvent pas la gestion de concurrence.

### SC-06 — Retour défectueux

1. Ouvrir `CDC-SC06-HISTORIQUE` : 3 casques vendus, total et paiement de 105 000 Ar, stock vendable restant 7.
2. Retourner 1 casque défectueux par le parcours métier.
3. Vérifier le traitement de 35 000 Ar, par remboursement ou avoir selon le contrat.
4. Vérifier la conservation de la vente et du paiement originaux, ainsi que la trace du retour.
5. Vérifier que le casque défectueux ne réintègre pas le stock vendable : celui-ci reste 7 hors autres opérations.
6. Tenter un retour dépassant la quantité vendue : il doit être refusé.

**Attendu :** retour et compensation traçables, historique préservé. L'historique de départ est synthétique ; il ne prouve pas que la vente initiale a été exécutée par le moteur métier.

### SC-07 — Isolation et permissions

1. Identifier la vente `CDC-SC07-TENANT-B` dans l'application `TECHZONE_BOUTIQUE_CONTROLE` du tenant B.
2. Avec le vendeur de A sans accès à B, tenter par API de lire et de modifier cet identifiant.
3. Vérifier un refus `403` ou un `404` non révélateur conforme au contrat, sans changement persistant.
4. Avec le profil lecteur de A, tenter d'annuler une vente de A.
5. Vérifier le refus `403` et l'absence de modification.

**Attendu :** autorisation contrôlée côté serveur. Un bouton masqué ne constitue pas une preuve suffisante.

### SC-08 — Versions et exécution Runtime

1. Vérifier la référence `1.0.0` réellement validée et publiée, avec ses contrats et son interface.
2. Vérifier les ajouts attendus de `1.1.0` et sa publication sans altérer la référence.
3. Comparer les liens de versions, contrats, snapshots et empreintes disponibles.
4. Résoudre le pack publié `1.1.0` dans l'environnement autorisé, l'activer et ouvrir l'application après obtention de **ACTIVE / READY**.
5. Vérifier une lecture et une écriture autorisées depuis l'interface publiée.
6. Vérifier qu'un contexte bloqué ne permet ni ouverture de l'application ni écriture métier.

**Attendu :** versions verrouillées respectées, interface et données correspondant au pack, blocages effectifs. Des versions en brouillon ne suffisent pas à valider SC-08.

## 9. Constituer les preuves et décider

Pour chaque test, conserver : date, version, tenant, environnement, profil, référence métier, état avant/après, action exécutée, résultat HTTP et identifiant de trace si disponible. Ajouter les captures et vérifications persistées pertinentes. Masquer cookies, jetons, mots de passe et URL de connexion à la base.

| Statut | Signification |
|---|---|
| PASS | Test exécuté, résultat attendu démontré par des preuves |
| FAIL | Test exécuté, résultat observé incorrect |
| BLOCKED | Prérequis manquant empêchant l'exécution |
| NOT TESTED | Test pas encore exécuté |

Modèle de procès-verbal à copier dans un fichier daté :

```markdown
# PV de recette Boutique Pro — AAAA-MM-JJ

- Branche / commit :
- Application / version / pack :
- Tenant / environnement :
- Base et schéma (sans identifiants) :
- Dérogations au CDC :
- Ordre d'exécution et préconditions de stock :

| Test | Profil | État initial | Action / résultat observé | Attendu | Statut | Preuves / anomalie |
|---|---|---|---|---|---|---|
| SC-01 | | | | | NOT TESTED | |
| SC-02 | | | | | NOT TESTED | |
| SC-03 | | | | | NOT TESTED | |
| SC-04 | | | | | NOT TESTED | |
| SC-05 | | | | | NOT TESTED | |
| SC-06 | | | | | NOT TESTED | |
| SC-07 | | | | | NOT TESTED | |
| SC-08 | | | | | NOT TESTED | |

- Anomalies et prérequis restants :
- Décision GO / NO-GO et justification :
- Responsable de validation :
```

La recette est terminée lorsque les exigences du CDC sont couvertes, les preuves examinées et les écarts traités ou formellement acceptés. Un seed réussi, une compilation ou des tests techniques seuls ne constituent pas cette validation.

## 10. Débloquer les problèmes courants

| Symptôme | Vérification / action |
|---|---|
| Tenant invisible | Appartenance IAM active du compte et tenant sélectionné |
| Application invisible | Tenant, périmètre du rôle et permissions réelles |
| 23 modèles au lieu de 25 | Écart de décompte déjà identifié dans le CDC ; documenter |
| Aucun pack disponible | Publication effective et disponibilité pour l'application/environnement |
| Aucun environnement proposé | Environnement actif et autorisé ; aucun n'est créé par le seed |
| Résolution `BLOCKED` | Lire les diagnostics de cette résolution et traiter le prérequis indiqué |
| Résolution expirée | Relancer la résolution, puis vérifier et activer le nouveau contexte |
| Action refusée | Contrôler les permissions et leur périmètre avec l'administrateur habilité |
| Base inaccessible | Classer `DATABASE_UNAVAILABLE`, rétablir l'accès puis reprendre |
| Erreur de colonne ou de schéma | Comparer le schéma aux migrations existantes ; ne pas lancer de reset ni de `db push` à l'aveugle |

L'ancien résultat du seed peut mentionner `pm_packs.applicationId` manquant. La correction et sa vérification sont documentées dans [PACK_RUNTIME_CORRECTIONS.md](PACK_RUNTIME_CORRECTIONS.md) ; un ancien JSON conserve son état historique. Diagnostiquer l'état actuel avant toute intervention.

## Documents et contrôles complémentaires

- [CDC de référence](../../SCENARIO_RECETTE_TECHZONE_BOUTIQUE_PRO_V1_1.md)
- [Données et limites du seed](BOUTIQUE_DONNEES.md)
- [Corrections backend Runtime](PACK_RUNTIME_CORRECTIONS.md)
- [Interface Runtime et validation technique](PACK_RUNTIME_FRONTEND.md)
- [Résultat initial du seed](boutique-seed-result.json) et [vérification des données](boutique-seed-verification.json)
- [Contrôle base Runtime](runtime-db-verification.json) et [contrôle HTTP Runtime](runtime-http-verification.json)

Les scripts `node scripts/recette/check-runtime-db.cjs` et `node scripts/recette/check-runtime-http.cjs` fournissent des contrôles techniques complémentaires. Le contrôle HTTP connecté nécessite les comptes de test configurés et les services disponibles ; consulter ses prérequis avant exécution. Ces contrôles ne remplacent pas les huit scénarios métier ni les preuves de concurrence et d'isolation.
