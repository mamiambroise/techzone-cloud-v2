# CAHIER DES CHARGES — PACK MANAGER
## Étape 2 — État réel, Gap Matrix et plan de consolidation

**Audit :** octobre 2026  
**Commits notables :** `313348ea`, `608c0c61`, `d555170a`  
**Priorité :** P1

---

# 1. État global

```text
🟡 Backend solide, parcours UI initial bloqué.
```

---

# 2. KEEP

Déjà bon :

- module enregistré ;
- routes réelles ;
- tenant/RBAC appliqués ;
- cycle backend réel :
  `Pack → Version → Validation → Snapshot → Manifest → Publication` ;
- publication vérifie hash ;
- dependencies vérifiées ;
- validation ;
- immutabilité ;
- `applicationVersionId` relie la PackVersion à la version métier ;
- UI appelle les API réelles.

Décision :

```text
KEEP
```

---

# 3. P1 — applicationVersionId absent dans UI

Backend exige :

```text
applicationVersionId
```

lors de `createVersion`.

UI envoie actuellement :

```text
versionNumber
label
releaseNotes
```

Conséquence :

```text
APPLICATIONVERSIONID_REQUIRED
```

Décision :

```text
FIX
```

---

# 4. P1 — absence de sélecteur ApplicationVersion

La création de PackVersion doit proposer une ApplicationVersion valide.

Décision :

```text
IMPLEMENT UI
```

---

# 5. P1 — acceptance script obsolète

`consolidation-acceptance.cjs` utilise l’ancien payload.

Décision :

```text
FIX
```

---

# 6. Gap Matrix

| Domaine | Cible | Existant | État | Décision | Priorité |
|---|---|---|---|---|---|
| Pack CRUD | réel | oui | bon | KEEP | P2 |
| PackVersion | lié AppVersion | backend oui/UI non | bloqué | FIX | P1 |
| Tenant/RBAC | oui | oui | bon | KEEP/TEST | P1 |
| Validation | réelle | oui | bon | KEEP | P2 |
| Snapshot | immuable | oui | bon | KEEP | P2 |
| UI Snapshot | AppVersion-aware | oui backend | à vérifier UI | COMPLETE | P1 |
| Manifest | réel | oui | bon | KEEP | P2 |
| Hash | vérifié | oui | bon | KEEP | P2 |
| Publication | réelle | oui | bon | KEEP | P2 |
| UI creation | complète | partielle | cassée | FIX | P1 |
| Acceptance script | nouveau payload | ancien | cassé | FIX | P1 |
| Cross-tenant tests | requis | présents/à certifier | partiel | COMPLETE | P1 |

---

# 7. LOT PM-0 — Audit worktree

Avant changement :
- git status ;
- préserver modifications locales ;
- auditer Pack Manager UI/backend/tests.

---

# 8. LOT PM-1 — ApplicationVersion API source

Identifier l’endpoint canonique pour lister les ApplicationVersions.

Ne pas créer un doublon si BM expose déjà une API.

Retour utile :

```text
id
applicationId
version
status
validation
updatedAt
```

---

# 9. LOT PM-2 — Create PackVersion UI

Ajouter sélecteur obligatoire :

```text
Application Version *
```

Payload :

```json
{
  "applicationVersionId": "...",
  "versionNumber": "...",
  "label": "...",
  "releaseNotes": "..."
}
```

---

# 10. LOT PM-3 — Server-side checks

Vérifier :
- AppVersion exists ;
- same tenant ;
- same application/pack relation ;
- status allowed ;
- no forged ID.

---

# 11. LOT PM-4 — Clone Flow

Lors clone :
- demander/porter ApplicationVersion cible ;
- éviter copie incohérente ;
- source immuable.

---

# 12. LOT PM-5 — Acceptance Script

Mettre à jour `consolidation-acceptance.cjs`.

Tester création PackVersion avec `applicationVersionId`.

---

# 13. LOT PM-6 — Validation

Rejouer :
- Business Definition ;
- UI Snapshot ;
- Automation ;
- dependencies ;
- requirements ;
- config ;
- integrity.

---

# 14. LOT PM-7 — Snapshot consistency

Assert :

```text
PackVersion.applicationVersionId
matches all versioned snapshots
```

ou contrat équivalent.

---

# 15. LOT PM-8 — Publication regression

Tester :
- valid publish ;
- invalid hash ;
- unresolved dependency ;
- validation error ;
- already published mutation.

---

# 16. LOT PM-9 — Security

Tests :
- Tenant A AppVersion B ;
- Tenant A Pack B ;
- unauthorized validate ;
- unauthorized publish ;
- forged snapshot ref ;
- published mutation.

---

# 17. LOT PM-10 — UI polish

Compléter :
- versions ;
- validation cockpit ;
- Manifest viewer ;
- publication confirmation ;
- immutable published state.

---

# 18. LOT PM-11 — CI/E2E

Ajouter/mettre à jour :
- acceptance ;
- backend tests ;
- frontend tests ;
- E2E chain.

---

# 19. Blocages production

Ne pas considérer Pack Manager stable si :

- UI ne peut pas créer PackVersion ;
- `applicationVersionId` absent ;
- script acceptance rouge ;
- cross-tenant non testé ;
- Manifest/hash incohérent ;
- PUBLISHED mutable.

---

# 20. Ordre

```text
PM-0 Audit
↓
PM-1 ApplicationVersion source
↓
PM-2 UI create version
↓
PM-3 Server checks
↓
PM-4 Clone
↓
PM-5 Acceptance script
↓
PM-6 Validation
↓
PM-7 Snapshot consistency
↓
PM-8 Publication regression
↓
PM-9 Security
↓
PM-10 UI
↓
PM-11 CI/E2E
```
