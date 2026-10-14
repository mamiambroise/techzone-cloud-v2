# CAHIER DES CHARGES — PACK RUNTIME
## Étape 2 — État réel, Gap Matrix et plan de consolidation

**Audit :** octobre 2026  
**Commits notables :** `608c0c61`, `82609ca`, `313348ea`  
**Priorité :** P1 ; P0 si Pack Runtime constitue une frontière d’autorisation.

---

# 1. État global

```text
🟡 Résolution réelle, mais pas encore imposée comme barrière d’exécution.
```

---

# 2. KEEP

Déjà bon :

- module Pack Runtime réel ;
- résolution tenant-scoped ;
- lecture Pack publié ;
- diagnostics ;
- cache mémoire ;
- Effective Manifest concept présent côté backend ;
- dépendances vérifiées ;
- page Runtime existante ;
- `PublishedApplication` existant ;
- renderer UI publié ;
- Data Runtime réel.

Décision :

```text
KEEP + HARDEN
```

---

# 3. P1 — RuntimePage bypass resolution

État :

```text
code/version fournis
↓
PublishedApplication rendu
```

sans exiger `EXECUTABLE`.

Décision :

```text
FIX
```

---

# 4. P1 — PublishedApplication utilise manifest publié direct

État :
- lit le Manifest publié ;
- n’utilise pas systématiquement Effective Manifest résolu.

Décision :

```text
FIX
```

---

# 5. P1 — BLOCKED peut encore rendre / appeler Data Runtime

Risque critique :

```text
Resolution = BLOCKED
mais
UI render possible
et Data Runtime possible
```

Décision :

```text
FIX AS EXECUTION BOUNDARY
```

---

# 6. P1 — pas d’activation persistée

Il manque une vérité persistée claire de :

```text
tenant
application
version
environment
active runtime context
```

Décision :

```text
COMPLETE
```

---

# 7. P1 — ApplicationVersion mismatch

Pas de vérification stricte confirmée entre :

```text
PackVersion.applicationVersionId
et
Business Manager version demandée
```

Décision :

```text
FIX
```

---

# 8. P2 — cache L1_MEMORY uniquement

Pas bloquant MVP.

Décision :

```text
KEEP + PREPARE EXTENSION
```

---

# 9. P2 — outbox publication sans consumer trouvé

Event :

```text
pack.version.published
```

Décision :

```text
AUDIT + CONNECT OR DOCUMENT
```

---

# 10. Gap Matrix

| Domaine | Cible | Existant | État | Décision | Priorité |
|---|---|---|---|---|---|
| Published resolution | réel | oui | bon | KEEP | P2 |
| Tenant scope | oui | oui | bon | KEEP/TEST | P1 |
| Effective Manifest | obligatoire | backend partiel | non imposé | FIX | P1 |
| Execution Gate | executable only | absent/incomplet | critique | FIX | P1/P0 |
| UI Runtime | resolution-aware | non | cassé | FIX | P1 |
| Data Runtime gate | resolutionId | absent | critique | IMPLEMENT | P1 |
| AppVersion consistency | stricte | incomplète | risque | FIX | P1 |
| Activation persistence | oui | non | manque | IMPLEMENT | P1 |
| Cache | L1/L2 | L1 | acceptable | KEEP | P2 |
| Publication event | consumer | non trouvé | partiel | COMPLETE | P2 |
| BLOCKED tests | obligatoires | absents | manque | IMPLEMENT | P1 |

---

# 11. LOT PR-0 — Audit code/runtime

Inspecter :
- pack-runtime.service ;
- controllers ;
- models Prisma ;
- runtime cache ;
- RuntimePage ;
- PublishedApplication ;
- Data Runtime API ;
- deployment integration ;
- publication outbox.

---

# 12. LOT PR-1 — Execution Gate

Créer/réutiliser une fonction serveur centrale :

```text
assertExecutableResolution()
```

Vérifie :
- tenant ;
- resolution ;
- EXECUTABLE ;
- expiry ;
- PackVersion ;
- ApplicationVersion ;
- context.

---

# 13. LOT PR-2 — Effective Manifest

Renderer doit recevoir uniquement :
- Effective Manifest server-resolved.

Supprimer/fermer le chemin Manifest publié direct pour exécution.

---

# 14. LOT PR-3 — RuntimePage

Flow :

```text
request resolve
↓
loading
↓
BLOCKED ? show diagnostics
↓
EXECUTABLE ? continue
↓
active context/readiness
↓
render
```

---

# 15. LOT PR-4 — Data Runtime Gate

Chaque opération issue de PublishedApplication doit transmettre `resolutionId`.

Backend Data Runtime vérifie la résolution.

---

# 16. LOT PR-5 — ApplicationVersion Integrity

Vérifier côté serveur :
- requested app version ;
- PackVersion.appVersion ;
- UI snapshot app version ;
- Business Definition version.

Mismatch => BLOCKED.

---

# 17. LOT PR-6 — Persisted Activation

Auditer Prisma.

Créer minimum nécessaire pour stocker :
- active context ;
- resolution ;
- environment ;
- timestamps ;
- status.

---

# 18. LOT PR-7 — Activation / Deactivation

Ajouter/renforcer :
- activate ;
- readiness ;
- deactivate ;
- one-active rule ;
- audit.

---

# 19. LOT PR-8 — Cache

Inclure context/version dans cache key.

Invalidate on publication/activation/config/provider changes.

---

# 20. LOT PR-9 — Publication Event

Chercher consumer.

Si absent :
- implémenter consumer si architecture outbox active ;
- sinon documenter mécanisme réel et retirer faux wiring.

---

# 21. LOT PR-10 — Security Tests

Obligatoires :
- BLOCKED no render ;
- BLOCKED no Data write ;
- wrong resolutionId ;
- Tenant A resolution B ;
- AppVersion mismatch ;
- tampered Manifest ;
- expired resolution ;
- unauthorized activate.

---

# 22. LOT PR-11 — E2E

Tester :

```text
Pack Publish
→ Deploy
→ Resolve
→ Activate
→ Readiness
→ UI
→ Data Runtime
```

et BLOCKED path.

---

# 23. LOT PR-12 — UI/Diagnostics

Compléter :
- Runtime overview ;
- resolutions ;
- active contexts ;
- diagnostics ;
- cache.

---

# 24. Production blockers

Ne pas déclarer Pack Runtime stable si :

- BLOCKED peut rendre ;
- BLOCKED peut écrire ;
- direct Manifest published execution existe ;
- AppVersion mismatch non bloqué ;
- activation volatile uniquement ;
- cross-tenant resolution possible ;
- tests P1 absents.

---

# 25. Ordre

```text
PR-0 Audit
↓
PR-1 Execution Gate
↓
PR-2 Effective Manifest
↓
PR-3 RuntimePage
↓
PR-4 Data Runtime Gate
↓
PR-5 Version Integrity
↓
PR-6 Activation Persistence
↓
PR-7 Activation Lifecycle
↓
PR-8 Cache
↓
PR-9 Publication Event
↓
PR-10 Security Tests
↓
PR-11 E2E
↓
PR-12 UI
```
