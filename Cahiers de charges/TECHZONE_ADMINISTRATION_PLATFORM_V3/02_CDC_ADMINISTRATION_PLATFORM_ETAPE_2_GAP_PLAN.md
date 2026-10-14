# CAHIER DES CHARGES — ADMINISTRATION PLATFORM
## Étape 2 — État réel, Gap Matrix et plan de consolidation

**Audit disponible :** historique repository  
**Priorité :** P1 pour remplacement des mocks frontend et durcissement sécurité.

---

# 1. Verdict

```text
🟡 Backend administration actif.
🔴 Frontend Administration majoritairement mock.
```

---

# 2. KEEP confirmé

Backend historique identifié :

```text
admin users
tenants
governance
delegation
actions
```

Persistance :
```text
Prisma IAM
```

Décision :
```text
KEEP + VERIFY CONTRACTS
```

---

# 3. Frontend Mock

Routes historiques :

```text
/admin/overview
/admin/users
/admin/organisations-tenants
/admin/access-governance
/admin/delegation
/admin/security-audit
/admin/monitoring
/admin/actions
```

utilisent des mock services.

Décision :

```text
REPLACE WITH REAL API
```

---

# 4. Architecture Risk

Backend Express/IAM historique peut être séparé du backend NestJS consolidé.

Décision :

```text
AUDIT CURRENT ROUTING
ADAPT
DO NOT DUPLICATE
```

---

# 5. Gap Matrix

| Domaine | Cible | Existant | État | Décision | Priorité |
|---|---|---|---|---|---|
| Admin Overview | réel | frontend mock | faux | FIX | P1 |
| Users Admin | IAM API réel | backend actif/UI mock | partiel | CONNECT | P1 |
| Tenant Admin | API réel | backend actif/UI mock | partiel | CONNECT | P1 |
| Governance | réel | backend actif/UI mock | partiel | CONNECT | P1 |
| Delegation | réel | backend actif/UI mock | partiel | CONNECT/HARDEN | P1 |
| Security Audit | real events | UI mock | faible | CONNECT | P1 |
| Monitoring | Observability | UI mock | faible | CONNECT | P1 |
| Admin Actions | controlled | backend active/UI mock | partiel | CONNECT/HARDEN | P1 |
| Feature Flags | governed | CDC target | à auditer | AUDIT | P1 |
| Providers | safe refs | à auditer | inconnu | AUDIT | P2 |
| Settings | owner-aware | à auditer | inconnu | AUDIT | P2 |
| Jobs | persistent | à auditer | inconnu | AUDIT | P1 |
| Maintenance | controlled | à auditer | inconnu | AUDIT | P1 |
| Re-auth/MFA | critical actions | à auditer | inconnu | COMPLETE | P1 |
| Audit | append/real | partial | à certifier | COMPLETE | P1 |

---

# 6. LOT ADMIN-0 — Inventory

Rechercher :
- current admin routes ;
- services ;
- IAM contracts ;
- frontend mock services ;
- Prisma models ;
- permissions ;
- audit ;
- jobs/settings/flags.

---

# 7. LOT ADMIN-1 — API Contract Consolidation

Définir/réutiliser contrats :
- Admin User ;
- Admin Tenant ;
- Governance ;
- Delegation ;
- Admin Action ;
- Diagnostic.

---

# 8. LOT ADMIN-2 — Permissions

Créer/aligner permissions explicites.

Aucun generic `admin=true`.

---

# 9. LOT ADMIN-3 — Users UI → Real API

Remplacer `adminUsersMockService`.

Tester :
- list ;
- detail ;
- disable ;
- revoke sessions.

---

# 10. LOT ADMIN-4 — Tenants UI → Real API

Remplacer `adminTenantsMockService`.

---

# 11. LOT ADMIN-5 — Governance

Remplacer `accessGovernanceMockService`.

Use IAM Registry.

---

# 12. LOT ADMIN-6 — Delegation

Remplacer mock + durcir :
- scope ;
- expiry ;
- grantor rights ;
- revoke ;
- audit.

---

# 13. LOT ADMIN-7 — Security/Audit

Connecter sources réelles.

Pas de faux alert counts.

---

# 14. LOT ADMIN-8 — Monitoring

Connecter Observability.

Administration = summary only.

---

# 15. LOT ADMIN-9 — Admin Actions

Catalogue contrôlé.

No arbitrary action name/command.

---

# 16. LOT ADMIN-10 — Re-auth/MFA

Actions HIGH/CRITICAL requièrent recent auth selon policy.

---

# 17. LOT ADMIN-11 — Feature Flags

Auditer existant.

Si absent, implémenter minimal registry persistant.

---

# 18. LOT ADMIN-12 — Platform Settings

Owner-aware settings registry.

---

# 19. LOT ADMIN-13 — Providers

Refs + health + REAL/MOCK status.

---

# 20. LOT ADMIN-14 — Jobs

Persisted system jobs + status + retry/cancel if safe.

---

# 21. LOT ADMIN-15 — Maintenance

Controlled scopes/windows.

---

# 22. LOT ADMIN-16 — Diagnostics

Aggregate module diagnostic contracts.

---

# 23. LOT ADMIN-17 — Security Tests

Cross-admin, elevation, delegation, reauth, target forgery.

---

# 24. LOT ADMIN-18 — E2E

Tenant suspension/reactivation + delegation lifecycle.

---

# 25. Production blockers

Do not release if :
- `/admin/*` displays mock data in REAL ;
- admin permissions are generic ;
- support can elevate itself ;
- delegation never expires ;
- destructive action without reason/audit ;
- critical action without re-auth policy ;
- secrets shown ;
- arbitrary shell/SQL exposed ;
- tenant suspension bypasses owner module contract.

---

# 26. Order

```text
ADMIN-0 Inventory
↓
ADMIN-1 Contracts
↓
ADMIN-2 Permissions
↓
ADMIN-3 Users
↓
ADMIN-4 Tenants
↓
ADMIN-5 Governance
↓
ADMIN-6 Delegation
↓
ADMIN-7 Security/Audit
↓
ADMIN-8 Monitoring
↓
ADMIN-9 Actions
↓
ADMIN-10 Re-auth/MFA
↓
ADMIN-11 Flags
↓
ADMIN-12 Settings
↓
ADMIN-13 Providers
↓
ADMIN-14 Jobs
↓
ADMIN-15 Maintenance
↓
ADMIN-16 Diagnostics
↓
ADMIN-17 Security
↓
ADMIN-18 E2E
```
