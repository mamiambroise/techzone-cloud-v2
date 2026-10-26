# Certification UI/UX — Techzone Classic / Accent Tabs B

Date : 20 octobre 2026  
Branche auditée : `mami`  
Commit de référence : `35853b3b` (`Merge pull request #27 from mamiambroise/mami`)

## Décision

**NON CERTIFIÉ**.

Le build, le contrôle TypeScript, les tests frontend complets et les tests IAM/Billing/ERP ciblés sont verts. Toutefois, aucune validation dans un navigateur réel ni capture responsive n'a pu être effectuée : le dépôt ne contient ni Playwright/Cypress, ni script E2E, et aucun navigateur pilotable n'était disponible. Cette absence de preuve interdit une certification globale, conformément au référentiel.

Cette décision ne signale pas une régression applicative confirmée. Elle interdit simplement de présenter les contrôles visuels, responsive et les parcours navigateur comme validés.

## État Git initial et périmètre

- Branche active : `mami`; aucune modification indexée, aucun conflit constaté.
- Arbre de travail non propre dès le début de l'audit. Les fichiers modifiés et non suivis ont été préservés; leur propriétaire n'est pas déductible de Git.
- Aucun `reset`, nettoyage, commit, push, merge ou modification de `main` n'a été exécuté.
- `git diff --check` et `git diff --cached --check` : PASS (avertissements CRLF non bloquants uniquement).
- La refonte contrôlée porte sur la sidebar à un niveau, `ModuleTabs`, le thème Classic, Billing et ERP. La présente mission ajoute aussi la galerie interne `/demo/ui-gallery` et son test.

## Inventaire statique des modules

Les nombres de pages proviennent de `pageDefinitions`; les onglets sont les entrées de `groupEntries`. « Contrôlé » signifie contrôlé statiquement et/ou couvert par les tests indiqués, pas validé visuellement dans un navigateur.

| Module | Route principale | Pages (réelles / prévues) | Onglets | Contexte / permission | Navigation & design | Tests | Statut |
|---|---|---:|---:|---|---|---|---|
| Tableau de bord | `/dashboard` | 1 / 0 | 1 | tenant | shell contrôlé statiquement | frontend complet | BLOCKED |
| Business Manager | `/business-manager` | 16 / 2 | 6 | tenant | deep links et contexte version contrôlés | navigation + composants | BLOCKED |
| UI Builder | `/ui` | 8 / 2 | 8 | `ui-builder:read` | shell/éditeur distincts contrôlés | frontend + sécurité renderer | BLOCKED |
| Automatisation | `/automation` | 6 / 5 | 10 | `automation:read` | routes et accès contrôlés | frontend complet | BLOCKED |
| Pack Manager | `/packs` | 6 / 7 | 11 | `pack.read` | routes et accès contrôlés | frontend complet | BLOCKED |
| Pack Runtime | `/runtime` | 11 / 0 | 7 | `runtime.resolution.read` | routes et accès contrôlés | frontend complet | BLOCKED |
| Données | `/data-runtime` | 8 / 0 | 7 | `data-runtime:read` | routes et accès contrôlés | frontend complet | BLOCKED |
| ERP / Dolibarr | `/erp` | 14 / 2 | 5 | `erp:read` | onglets consolidés, deep links contrôlés | frontend + backend ERP | BLOCKED |
| API & Intégrations | `/settings/integrations` | 8 / 0 | 4 | permissions Integration Hub | parité UI/API contrôlée | frontend complet | BLOCKED |
| Registry | `/registry` | 0 / 6 | 6 | plateforme | pages prévues explicitement | frontend complet | NOT RUN |
| Environnements & Déploiements | `/environments` | 13 / 0 | 3 | plateforme | routes contrôlées | frontend complet | BLOCKED |
| Auth / IAM | `/iam/users` | 6 / 6 | 7 | IAM | accès direct et tenant contrôlés | frontend + backend IAM | BLOCKED |
| Observabilité | `/observability` | 6 / 2 | 8 | IAM | routes contrôlées | frontend complet | BLOCKED |
| Abonnements & Facturation | `/billing/overview` | 14 / 2 | 4 tenant / 4 plateforme | Billing | scopes séparés par route | frontend + backend Billing | BLOCKED |
| Administration Platform | `/admin` | 0 / 7 | 3 | plateforme | pages prévues explicitement | frontend complet | NOT RUN |

Les routes contextuelles (versions Business Manager, éditeur UI, ressources ERP, créations/éditions) ne sont pas considérées orphelines : elles sont déclarées hors menu, protégées et résolues par les tests de deep link.

## Résultats des contrôles

| Test | Commande | Résultat | Preuve / observation |
|---|---|---|---|
| Tests frontend complets | `cd frontend && npm test -- --maxWorkers=1` | PASS | 42 fichiers, 339 tests PASS; 3 fichiers / 8 tests PostgreSQL opt-in SKIP. |
| Navigation, Billing, ERP, IAM frontend et galerie | `cd frontend && npm test -- src/pages/UiGallery.test.jsx src/components/SubNavBar.test.jsx src/app/navigationArchitecture.test.js src/app/navigationAccess.test.js` | PASS | 4 fichiers, 93 tests PASS. |
| Build frontend | `cd frontend && npm run build` | PASS | Vite produit `dist`; avertissement non bloquant sur un chunk > 500 kB. |
| Contrôle TypeScript frontend | `cd frontend && npm run lint` | PASS | `tsc --noEmit` sans sortie ni erreur. |
| IAM, Billing et ERP backend | `cd backend && npm test -- --runInBand …` | PASS | 5 suites, 35 tests PASS (`iam-jwt`, tenant membership/isolation, billing lifecycle, catalogue ERP). |
| Validation navigateur / captures | outil E2E absent | BLOCKED | Aucun Playwright/Cypress, script E2E ou navigateur automatisable détecté. Aucune capture fictive créée. |

### Diagnostic `ECONNRESET`

La suite Vitest a écrit deux `socket hang up` / `ECONNRESET` avant son résumé, mais s'est terminée avec le code 0 et l'intégralité des tests exécutés verts. Le même comportement apparaît avec un seul worker. Les recettes PostgreSQL sont explicitement conditionnelles (`PH6_COOKIE` / `PH7_FIXTURES`) et ignorées dans cet environnement; elles ne lancent donc pas de requête réelle.

Classification : **problème d'environnement ou de transport de l'exécuteur, non reproductible comme échec de test applicatif**. Il n'est pas masqué : la commande et la sortie sont consignées. Une investigation réseau supplémentaire nécessite un environnement où les services et le navigateur de test sont effectivement disponibles.

## Contrôles de conception réalisés

- `ModuleTabs` est l'unique barre d'onglets globale de module; ses liens utilisent les routes, `aria-current`, le focus visible et le défilement horizontal.
- La sidebar ne présente que les modules principaux; les tests d'architecture et de sidebar empêchent le retour de sous-menus fonctionnels.
- Les onglets Billing sont sélectionnés par l'espace de route (`/billing/*` ou `/billing/admin/*`), pas par le rôle le plus élevé. Les deux contextes restent filtrés par permission.
- ERP utilise cinq destinations partagées; la navigation locale répétée a été retirée de son tableau de bord.
- Les tokens Classic sont présents dans `frontend/src/index.css` et correspondent à la palette référencée (sidebar, primary, workspace, surface, texte, bordure et accents).
- Les contrôles automatiques existants couvrent la résolution des routes, les doublons de navigation, les redirections, les permissions, les routes directes, le tenant switch et la parité Integration Hub. Aucune règle fragile supplémentaire n'a été ajoutée.

## Galerie UI/UX

La galerie manquante a été ajoutée à `/demo/ui-gallery`.

- Elle est hors sidebar et se trouve sous le `ProtectedRoute` existant.
- Elle compose `PageHeader`, `ModuleTabs`, `Card` et `ConfirmModal` réels, avec des états de chargement, erreur, champ, sélection et actions.
- Elle ne crée ni thème concurrent, ni dépendance, ni données métier fictives.
- Test : `src/pages/UiGallery.test.jsx`.

## Anomalies et limites

| ID | Module | Sévérité | Description | Correction / décision | Statut |
|---|---|---|---|---|---|
| CERT-001 | Validation navigateur | P1 | Aucun outil E2E/capture ni navigateur pilotable. Les dimensions desktop/tablette/mobile et les interactions réelles ne sont pas prouvées. | Installer/configurer un seul outil E2E approuvé puis exécuter les parcours et captures. | OPEN |
| CERT-002 | Pages prévues | P2 | Registry et Administration Platform restent déclarés `NOT_IMPLEMENTED`; plusieurs pages d'autres modules sont planifiées. | Ne pas les présenter comme disponibles; les placeholders sont déjà explicitement déclarés. | OPEN |
| CERT-003 | Build | P3 | Avertissement Vite : chunk principal > 500 kB. | À traiter dans une optimisation dédiée; non lié à la refonte UI. | OPEN |

## Préparation de revue / PR

Titre proposé : `fix(ui): certify Techzone Classic navigation and component gallery`

- [x] Build frontend réussi.
- [x] Tests navigation réussis.
- [x] Tests IAM pertinents réussis.
- [x] Tests fonctionnels ciblés Billing/ERP réussis.
- [ ] Captures contrôlées.
- [ ] Responsive vérifié dans un navigateur réel.
- [ ] Aucun P1 ouvert.
- [x] Documentation mise à jour.
- [x] Modifications préexistantes préservées.

Ne pas créer de PR ni de commit global avant résolution ou acceptation explicite de `CERT-001`. Lors d'un futur commit, indexer explicitement les fichiers de cette mission; ne pas utiliser `git add .` ou `git add -A` sur cet arbre collaboratif.
