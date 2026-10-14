# CAHIER DES CHARGES — REGISTRY TRANSVERSAL
## Étape 2 — État réel, Gap Matrix et plan

**Référence :** CDC Registry Platform V2  
**Audit :** à finaliser sur repository courant  
**Priorité :** P1 pour Registry Core / Pack Runtime compatibility.

---

# 1. Verdict

```text
🟡 Architecture Registry clairement définie.
État réel du Registry Core à auditer avant modification.
```

Ne pas déclarer `MISSING` sans recherche.

---

# 2. KEEP probable / sources existantes

Le projet contient déjà plusieurs registries spécialisés ou notions équivalentes :

```text
Business Feature/Capability Registry
UI Component Registry
Automation Node/Action Registry
Data Provider Registry
Integration Connector Registry
Runtime Capability Registry
```

Décision :

```text
AUDIT → REUSE → UNIFY CONTRACTS
```

---

# 3. Risque principal

Ne pas créer :

```text
One Giant Registry
```

qui recopierait toutes les données des modules.

Cible :
- Registry Core minimal ;
- adapters/sources spécialisés ;
- metadata normalisée ;
- resolution commune.

---

# 4. Gap Matrix

| Domaine | Cible | Existant | Décision | Priorité |
|---|---|---|---|---|
| Registry Core | transverse | à auditer | AUDIT | P1 |
| Stable Keys | cohérentes | à auditer | AUDIT/ALIGN | P1 |
| Namespaces | gouvernés | à auditer | IMPLEMENT/ALIGN | P1 |
| Namespace Ownership | strict | à auditer | IMPLEMENT | P1 |
| Business Registry | source BM | probable | ADAPT | P1 |
| UI Registry | source UI | présent concept | ADAPT | P1 |
| Automation Registry | source Automation | présent concept | ADAPT | P1 |
| Data Registry | source Data | présent concept | ADAPT | P1 |
| Integration Registry | réel | Connector Registry existe | KEEP/ADAPT | P1 |
| Runtime Registry | capabilities/schemas | présent concept | COMPLETE | P1 |
| API Registry | contracts/versions | à auditer | ADAPT | P2 |
| Version Resolver | deterministic | à auditer | IMPLEMENT/TEST | P1 |
| Compatibility | central check | à auditer | IMPLEMENT | P1 |
| Availability | environment aware | partiel | COMPLETE | P1 |
| Cache | scoped | à auditer | COMPLETE | P2 |
| Diagnostics | real | partiel | COMPLETE | P2 |
| Security | tenant/namespace | à auditer | HARDEN | P1 |
| Frontend | Registry UI | maquettes/specs | à auditer | COMPLETE | P2 |

---

# 5. LOT REG-0 — Inventory

Search repository for :

```text
Registry
FeatureRegistry
CapabilityRegistry
ComponentRegistry
NodeRegistry
ProviderRegistry
ConnectorRegistry
RuntimeCapability
SchemaRegistry
Compatibility
```

---

# 6. LOT REG-1 — Canonical Contract

Définir interface minimale :

```text
namespace
key
version
owner
provider
scope
status
capabilities
schemaRef
compatibility
```

---

# 7. LOT REG-2 — Stable Keys

Inventory actual keys.

Avoid renaming already consumed stable keys.

---

# 8. LOT REG-3 — Namespace Governance

Map namespace → authorized owner.

Add server enforcement.

---

# 9. LOT REG-4 — Registry Sources

Adapters :

```text
BusinessRegistrySource
UiRegistrySource
AutomationRegistrySource
DataRegistrySource
IntegrationRegistrySource
RuntimeRegistrySource
ApiRegistrySource
```

---

# 10. LOT REG-5 — Discovery

Server-side query:
- namespace ;
- key ;
- capability ;
- provider ;
- version ;
- status ;
- scope.

---

# 11. LOT REG-6 — Version Resolver

Exact + compatible range.

Published flow always exact after lock.

---

# 12. LOT REG-7 — Schema Registry

Normalize schema support metadata.

---

# 13. LOT REG-8 — Compatibility Engine

Return:
- selected candidate ;
- rejections ;
- reason codes.

---

# 14. LOT REG-9 — Availability

Connect to :
- Environment ;
- Provider Health ;
- Integration ;
- Runtime.

---

# 15. LOT REG-10 — Removal Safety

Before disable/remove:
- Pack refs ;
- Runtime refs ;
- Deployment refs.

---

# 16. LOT REG-11 — Cache

Tenant/environment scoped cache keys.

Invalidation on lifecycle/availability change.

---

# 17. LOT REG-12 — Pack Manager

Use official Registry resolver.

No duplicated local compatibility rules where avoidable.

---

# 18. LOT REG-13 — Pack Runtime

Use exact locked refs.

No latest-compatible substitution.

---

# 19. LOT REG-14 — Environment / Deployment

Preflight uses Registry availability and capability checks.

---

# 20. LOT REG-15 — Security

Cross tenant + namespace takeover + provider injection.

---

# 21. LOT REG-16 — Diagnostics

Real registry source status.

---

# 22. LOT REG-17 — UI

Connect Overview/Entries/Capabilities/Providers/Schemas/Compatibility/Diagnostics.

---

# 23. LOT REG-18 — CI/E2E

Full register → resolve → lock → runtime path.

---

# 24. Production blockers

Do not release if :

- namespace takeover possible ;
- tenant A discovers tenant B entry ;
- published Pack resolves "latest" dynamically ;
- REGISTERED shown AVAILABLE without real evidence ;
- removal breaks active published Pack ;
- provider injection accepted ;
- Runtime silently substitutes incompatible version ;
- Registry diagnostics use static data.

---

# 25. Order

```text
REG-0 Inventory
↓
REG-1 Contract
↓
REG-2 Stable Keys
↓
REG-3 Namespaces
↓
REG-4 Sources
↓
REG-5 Discovery
↓
REG-6 Version Resolver
↓
REG-7 Schemas
↓
REG-8 Compatibility
↓
REG-9 Availability
↓
REG-10 Removal Safety
↓
REG-11 Cache
↓
REG-12 Pack Manager
↓
REG-13 Pack Runtime
↓
REG-14 Deployment
↓
REG-15 Security
↓
REG-16 Diagnostics
↓
REG-17 UI
↓
REG-18 E2E
```
