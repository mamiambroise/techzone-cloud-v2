# SECURITY TEST — PRISMA / TENANT FOUNDATION

---

# 1. Objectif

Prouver qu’aucun bug applicatif simple ne permet à Tenant A d’accéder aux données Tenant B.

---

# 2. APP-TENANT-001 — Missing service filter

Créer volontairement un scénario de test appelant une couche contrôlée sans filtre tenant.

Si RLS active :
- B reste invisible.

Ce test ne doit pas introduire de vulnérabilité en production ; utiliser uniquement harness test.

---

# 3. DB-RLS-001 — SELECT isolation

Tenant A :
```sql
SELECT ...
```

Attendu :
- uniquement lignes A.

---

# 4. DB-RLS-002 — INSERT forged tenant

Context A tente insert `tenantId=B`.

Attendu :
- refus.

---

# 5. DB-RLS-003 — UPDATE cross-tenant

A tente UPDATE B.

Attendu :
- aucune modification/refus.

---

# 6. DB-RLS-004 — DELETE cross-tenant

A tente DELETE B.

Attendu :
- aucune suppression/refus.

---

# 7. DB-RLS-005 — Missing context

Aucune variable tenant.

Attendu :
- aucune donnée tenant ;
- pas de mode global implicite.

---

# 8. DB-RLS-006 — Invalid context

Tenant ID invalide.

Attendu :
- refus/aucune ligne ;
- pas fallback global.

---

# 9. DB-RLS-007 — Pool leakage

Séquence :

```text
Tenant A transaction
Tenant B transaction
Tenant A
Tenant B
```

sur connexions réutilisées.

Attendu :
- zéro contamination.

---

# 10. DB-RLS-008 — Concurrent tenants

Lancer A/B en parallèle sur plusieurs cycles.

Attendu :
- isolation stricte.

---

# 11. DB-RLS-009 — Rollback

Transaction A avec SET LOCAL puis rollback.

Nouvelle transaction B.

Attendu :
- contexte A absent.

---

# 12. DB-ROLE-001 — Runtime no BYPASSRLS

Vérifier rôle runtime.

Attendu :
- `rolbypassrls = false`.

---

# 13. DB-ROLE-002 — Runtime no superuser

Attendu :
- false.

---

# 14. DB-SCHEMA-001 — Wrong schema prevention

Démarrer avec config incohérente volontairement en environnement test.

Attendu :
- échec explicite/preflight ;
- pas création silencieuse dans mauvais schema.

---

# 15. MIG-001 — Fresh DB

DB vide.

```text
migrate deploy
→ PASS
```

---

# 16. MIG-002 — Upgrade DB

Snapshot représentatif.

Attendu :
- migration PASS ;
- données présentes ;
- types corrects.

---

# 17. MIG-003 — Destructive SQL detection

Scanner migrations/scripts.

Flag :
- DROP SCHEMA ;
- DROP TABLE ;
- TRUNCATE ;
- unsafe ALTER.

Résultat :
- review obligatoire.

---

# 18. TYPE-001 — tenantId consistency

Comparer Prisma / information_schema.

Attendu :
- types cohérents.

---

# 19. FK-001 — tenant FK validity

Orphan tenant reference.

Attendu :
- impossible lorsque FK requise.

---

# 20. RAW-001 — raw query injection

Auditer `$queryRawUnsafe` / concaténations.

Attendu :
- aucun input utilisateur non paramétré.

---

# 21. BACKUP-001

Avant migration risquée :
- backup confirmé ;
- restore test documenté.

---

# 22. CI Blocking

Bloquants :

```text
MIG-001
MIG-002
TYPE-001
DB-RLS-001..009 lorsque RLS activée
DB-ROLE-001
DB-ROLE-002
cross-tenant application tests
```

---

# 23. Security DoD

- aucune lecture cross-tenant ;
- aucune écriture cross-tenant ;
- aucun pool leakage ;
- runtime sans bypass ;
- migrations reproductibles ;
- raw SQL sûr ;
- types tenant cohérents.
