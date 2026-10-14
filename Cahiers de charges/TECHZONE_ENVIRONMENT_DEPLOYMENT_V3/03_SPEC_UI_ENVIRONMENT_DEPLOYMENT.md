# SPEC UI — ENVIRONMENT & DEPLOYMENT MANAGER

---

# 1. Design

Respecter le design Techzone Cloud :

- sidebar bleu nuit ;
- fond clair ;
- cards blanches ;
- accents bleu/indigo/violet ;
- badges de statuts ;
- Lucide icons ;
- responsive ;
- données réelles.

---

# 2. Navigation

```text
PLATEFORME
├── Environnements
└── Déploiements
```

---

# 3. Environment Overview

Cards :
- Total environments ;
- READY ;
- DEGRADED ;
- UNAVAILABLE ;
- Active Deployments ;
- Failures recent.

Aucune métrique inventée.

---

# 4. Environment List

Colonnes :

```text
Name
Type
Status
Applications
Active Pack
Runtime
Last Deployment
Updated
Actions
```

Filtres :
- type ;
- status ;
- application ;
- readiness.

---

# 5. Environment Detail

Header :
- name ;
- type ;
- status ;
- Tenant ;
- actions.

Tabs :

```text
Overview
Deployments
Configuration
Capabilities
Integrations
Runtime
Diagnostics
History
```

---

# 6. Create Environment

Champs :

- name ;
- key ;
- type ;
- application optional ;
- runtime target ;
- configuration refs ;
- policies.

Jamais de secret en clair.

---

# 7. Environment Check

Modal/panel :

```text
Runtime
Data
Integrations
Capabilities
Secrets availability
Configuration
```

Résultats :
- PASS ;
- WARNING ;
- ERROR.

---

# 8. Deployment Overview

Cards :
- queued ;
- running ;
- succeeded ;
- failed ;
- rollback ;
- median duration if real.

---

# 9. Deployment List

Colonnes :

```text
Deployment
Environment
Application
Pack Version
Status
Requested By
Started
Duration
Actions
```

---

# 10. Deployment Wizard

Étapes :

```text
1 Environment
2 Application
3 Published Pack Version
4 Compatibility
5 Configuration
6 Review
7 Deploy
```

Chaque étape doit être validée côté backend.

---

# 11. Pre-Deployment Review

Afficher :

- Pack published ;
- Manifest valid ;
- Environment ready ;
- Runtime compatible ;
- capabilities ;
- Data requirements ;
- Integration requirements ;
- policies ;
- warnings.

`ERROR` désactive le déploiement.

---

# 12. Protected Environment Confirmation

Pour production :

- nom Environment ;
- Pack version ;
- impact ;
- confirmation explicite ;
- policy notice.

Pas de bypass permission.

---

# 13. Deployment Detail

Header :
- status ;
- Environment ;
- Pack Version ;
- actor ;
- started/completed.

Sections :
- summary ;
- timeline ;
- validations ;
- Runtime ;
- diagnostics ;
- audit ;
- related rollback/retry.

---

# 14. Timeline

```text
Requested
Validated
Prepared
Runtime Load
Resolved
Activated
Readiness
Completed
```

Statut réel uniquement.

---

# 15. Rollback UI

Afficher :
- current release ;
- candidate previous release ;
- compatibility ;
- policy ;
- warnings.

Confirmation forte.

---

# 16. Diagnostics

Table :

```text
Stage
Severity
Code
Message
Resource
Timestamp
Correlation ID
```

Aucun secret.

---

# 17. History

Timeline :
- deploy ;
- failure ;
- retry ;
- rollback ;
- cancellation.

---

# 18. States

```text
LOADING
EMPTY
ERROR
FORBIDDEN
UNAVAILABLE
DEGRADED
```

---

# 19. Permissions UI

Masquer/désactiver selon permissions :

- create ;
- execute ;
- cancel ;
- retry ;
- rollback ;
- diagnostics.

Backend reste autorité.

---

# 20. Responsive

Desktop :
- tables + timeline.

Tablet :
- compact table/drawers.

Mobile :
- cards ;
- sticky main action ;
- detail accordion.

---

# 21. Critères UX

- aucun status fictif ;
- actions reflètent backend ;
- tenant context visible ;
- erreurs structurées ;
- deep links ;
- confirmation production ;
- loading/empty/error complets.
