# CDC07 — correction ERP et preuve P0

Date : 2026-10-03. Branche : `mami`. P0 global **non déclaré terminé** : les données métier restent refusées par les permissions Dolibarr. Aucune permission distante n'a été modifiée.

## Git et périmètre

Base initiale propre : `72b28d3a246c8b5007741cf6b11651f964a7a154`. Fetch des remotes origin, jasmina, jasmina-bm et taratra31 effectué ; aucune référence distante ne contenait de commit absent de mami. La consolidation `7c7a165e` était déjà intégrée. Aucun push, aucune modification du PHP legacy, aucune migration Prisma. Les domaines BM-CDC-09, Form Builder, Dashboard Builder et AI Layer ne sont pas reconstruits.

## Diagnostic établi

Les requêtes des cinq ressources partent effectivement depuis le navigateur. Une première capture avant la dernière correction les voyait toutes terminer en 3,9–8,7 secondes : le chargement infini signalé n'a pas été reproduit dans cette capture. Le code ne garantissait cependant pas une échéance globale indépendante du transport. La latence distante est variable ; une capture suivante a réellement atteint dix secondes sur Clients et Stocks.

Le filtre global ne reconnaissait pas `DolibarrError.httpStatus` : un refus upstream 403 devenait une erreur Techzone 500. La traduction est désormais explicite : upstream 403 → Techzone 502 / `ERP_PERMISSION_DENIED` → UI `FORBIDDEN`. Le 502 distingue le refus du fournisseur d'un 403 IAM local. Un upstream 401 reste une erreur d'authentification fournisseur distincte. Une expiration locale → Techzone 504 / `INTEGRATION_TIMEOUT` → UI `UNAVAILABLE` ; elle ne prouve aucun statut HTTP distant.

La sonde directe réelle a reçu 403 sur `/orders`, `/thirdparties`, `/products` et `/invoices`, mais 200 sur `/users/info?includepermissions=1`. Les seules familles de droits présentes étaient `user`, `export`, `import`, `agenda`, `api`. Les familles `commande`, `societe`, `produit`, `facture`, `stock` étaient absentes. La clé est reconnue, ses autorisations métier sont insuffisantes.

| Ressource | Permission manquante | Vérification de la capability |
|---|---|---|
| Clients | `societe.lire` | API thirdparties, contrôle `hasRight('societe','lire')` |
| Produits | `produit.lire` | API products, contrôle de lecture produits |
| Commandes | `commande.lire` | API orders : lecture des commandes clients |
| Factures | `facture.lire` | API invoices : lecture des factures clients |
| Stocks | `produit.lire`, puis `stock.lire` pour les détails | Le chemin utilisé est products avec `includestockdata=1` ; son premier contrôle exige produit.lire |

Sources consultées en lecture seule : classes `api_orders`, `api_products`, `api_invoices`, `api_thirdparties` du PHP legacy. Le [code officiel Dolibarr Orders](https://doxygen.dolibarr.org/dolibarr_20.0/build/html/d9/d7b/api__orders_8class_8php_source.html) confirme le contrôle commande.lire. Ces droits doivent être examinés par l'administrateur Dolibarr ; aucun contournement n'est ajouté.

## Corrections appliquées

- Adapter Dolibarr : échéance absolue de 10 secondes, y compris connexion, réponse et retries, avec AbortSignal ; retries bornés uniquement pour lectures transitoires, jamais pour 401/403 ni pour les créations.
- Frontend : requêtes indépendantes ; Promise.race avec échéance de 15 secondes même si le transport ne termine pas ; AbortController sur délai, remplacement et démontage ; exclusion des réponses périmées après changement de tenant. Chaque ressource possède un seul état terminal : LOADED, EMPTY, UNCONFIGURED, FORBIDDEN, UNAVAILABLE ou ERROR. Sans tenant, UNCONFIGURED immédiat.
- Observabilité : même traceId dans la réponse Techzone, le filtre et les logs JSON `ERP_UPSTREAM_RESPONSE`. Endpoint, statut HTTP réellement reçu, durée, tentative et code transport ; aucun credential ni corps métier journalisé. `httpStatus: null` signifie aucune réponse HTTP.
- Resolver : registre relu et tenant/statut/configuration revalidés à chaque appel ; aucune réutilisation indéfinie d'une connexion désactivée ; clé serveur liée explicitement au tenant, sans fallback global implicite.
- Mapping : validation des listes ; erreurs propagées au lieu de données de démonstration. Stocks demande les données de stock et refuse une quantité manquante au lieu de fabriquer zéro ou une date de mise à jour. Le mapping métier complet ne peut pas être validé sur les vraies données tant que Dolibarr refuse leur lecture.
- Registry : permissions ERP explicites ; vues publiques sans credentials ; chiffrement AES-GCM lié au tenant pour les nouvelles clés ; transactions d'audit ; historique limité. Configuration locale secrète conservée uniquement dans `.env.local` ignoré.
- Sécurité HTTP : validation destination, contrôle DNS, refus des redirections, destinations privées soumises à allowlist serveur, limites de taille.
- UI : panneau d'erreurs groupé, retry par ressource, copie traceId, conservation des cartes indépendantes ; configuration/test/historique réels. Les compteurs indiquent uniquement les éléments reçus, pas un total métier inventé.

## Validation

- Backend : 23 suites, 234 tests PASS (ERP adapter, registry, integration, IAM, tenant). Inclut contrats HTTP des cinq ressources, transport réellement bloqué sur serveur de test, refus 403 sans retry, création non rejouée, stock absent distinct de zéro, isolation et secrets.
- Frontend : 7 tests PASS, dont cinq Promises volontairement sans résolution, délai explicite, annulation/changement tenant, succès et erreurs indépendants, refus fournisseur et absence de tenant.
- Builds Nest et Vite PASS. Vite signale un cas FormField dupliqué préexistant et des chunks volumineux hors périmètre.
- Oxlint ciblé : aucune erreur ; warnings backend de paramètres/imports inutilisés et catch devenus redondants. Frontend ciblé sans diagnostic.
- Une invocation directe de Jest sans le flag ESM du script npm a échoué au chargement des suites ; relance avec la commande officielle npm : 234/234 PASS.
- Navigateur réel Microsoft Edge/Playwright, connexion réelle, données réseau réelles. Captures aux largeurs 1440, 768 et 390 pixels, sans overflow. Aucune interception réseau ni fixture dans cette recette. Les doubles départs annulés proviennent du cycle de développement React StrictMode ; les requêtes actives suivantes terminent.
- Recette complémentaire : huit routes ERP/configuration rendues sans crash, session conservée, test de connexion et historique appelés réellement (HTTP 200). Ce contrôle de navigation ne remplace pas l'attente des cinq états terminaux du script dédié.

La preuve finale par ressource est dans `ERP_P0_RESOURCE_EVIDENCE.json` et le tableau associé `ERP_P0_RESOURCES.md`. Les logs et captures bruts restent localement sous `.runtime/`. Les tests unitaires utilisent des doubles isolés ; aucun mock ou fallback DEMO n'est utilisé par la recette réelle.

## Limites restantes

L'accès métier réel reste bloqué par les permissions Dolibarr ; la cause des latences intermittentes côté serveur distant n'est pas établie. Le timeout la borne, il ne répare pas le serveur distant. Aucun résultat de lecture réussie n'est inventé. La conformité P1–P3 (synchronisation, webhooks Dolibarr, versionnement mapping, liens externes, consolidation complète Integration Hub) reste non validée, comme détaillé dans `ERP_GAP_MATRIX.md`. Ce rapport ne déclare ni la mission CDC07 complète ni DONE P0 global.

## Configuration et reproductibilité

Les nouvelles clés enregistrées nécessitent `ERP_CREDENTIAL_ENCRYPTION_KEY` (32 octets aléatoires, encodés en 64 caractères hexadécimaux, à conserver dans le stockage de secrets serveur). Une clé existante `DOLIBARR_API_KEY` n'est utilisable que si `DOLIBARR_TENANT_ID` désigne explicitement son tenant ; une clé dédiée peut aussi utiliser `DOLIBARR_API_KEY_<UUID_AVEC_UNDERSCORES>`. Les destinations privées nécessitent `DOLIBARR_ALLOWED_PRIVATE_ORIGINS`. Ne jamais placer les valeurs secrètes dans Git.

Recette terminale : `node scripts/erp-cdc07-terminal-browser.cjs`, services locaux démarrés et compte de test configuré. Le script utilise l'installation Playwright locale `logs/browser-tools/node_modules/playwright` et Edge ; il n'installe rien et ne modifie pas les permissions Dolibarr. La preuve JSON est régénérée sous `.runtime/erp-terminal-evidence.json`.
