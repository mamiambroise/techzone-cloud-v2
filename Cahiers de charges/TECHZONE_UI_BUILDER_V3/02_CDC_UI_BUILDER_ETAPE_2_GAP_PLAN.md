# CAHIER DES CHARGES — UI BUILDER
## Étape 2 — État réel, Gap Matrix et plan de consolidation

**Audit :** octobre 2026  
**Commits notables :** `313348ea`, `608c0c61`  
**Priorité :** P1

---

# 1. État global

```text
🔴 Fonctionnellement présent et connecté aux API,
mais certains contrôles essentiels cassent à l’usage.
```

---

# 2. KEEP

Déjà bon :

- APIs `/api/ui-builder/*` réelles ;
- store existant ;
- Pages existantes ;
- Theme existant ;
- Validation existante ;
- Renderer existant ;
- UI Definition consommée par Pack Manager/Runtime ;
- deep links partiellement pris en charge ;
- tests store/components présents.

Décision :

```text
KEEP + FIX
```

---

# 3. Worktree local

Modifications non commitées identifiées :

```text
UiBuilderLayout.jsx
UiVisualEditor.jsx
```

Elles améliorent certains deep links.

Décision :

```text
PRESERVE
```

Ne pas écraser.

---

# 4. P1 — callback contract incohérent

`BmSelect` et `BmSearchInput` renvoient directement une valeur/chaîne.

Mais :

```text
UiPagesManager
UiFormsBuilder
UiVisualEditor
```

lisent :

```text
event.target.value
```

Conséquence :
- select/search peut planter.

Décision :

```text
FIX
```

---

# 5. P1 — editor sans page sélectionnée

Route menu :

```text
/ui/builder/editor
```

mais aucune page n’est sélectionnée.

Résultat :
`Aucune page sélectionnée`.

Décision :

```text
FIX
```

---

# 6. Origine du bug

Les défauts sont déjà présents dans `origin/main`.

Ils ne doivent pas être attribués aux modifications locales.

---

# 7. Tests manquants

Aucun test spécifique :
- BmSelect contract ;
- BmSearchInput contract ;
- editor route ;
- default page selection.

Décision :

```text
IMPLEMENT
```

---

# 8. Gap Matrix

| Domaine | Cible | Existant | État | Décision | Priorité |
|---|---|---|---|---|---|
| UI API | réel | oui | bon | KEEP | P2 |
| Store | stable | oui | bon | KEEP | P2 |
| Pages | CRUD | oui | bon | KEEP | P2 |
| Editor | usable | oui | cassé partiel | FIX | P1 |
| BmSelect | value contract | incohérent consumer | cassé | FIX | P1 |
| SearchInput | value contract | incohérent | cassé | FIX | P1 |
| Deep links | valid page | partiel | faible | COMPLETE | P1 |
| Component Registry | réel | oui/à auditer | partiel | KEEP/COMPLETE | P1 |
| Bindings | BM/Data | oui/à certifier | partiel | COMPLETE | P1 |
| Forms | réel | oui | callback risk | FIX | P1 |
| Theme | réel | oui | bon | KEEP | P2 |
| Validation | réel | oui | bon/à renforcer | KEEP/COMPLETE | P1 |
| Renderer | shared | oui | à certifier | KEEP/TEST | P1 |
| Snapshot | immutable | oui via Pack | bon | KEEP | P2 |
| Tenant scope | obligatoire | à auditer | partiel | VERIFY/FIX | P1 |
| AppVersion scope | obligatoire | modèle existe | à tester | TEST | P1 |
| UI tests | complete | partiel | insuffisant | COMPLETE | P1 |

---

# 9. LOT UI-0 — Protect worktree

Avant modification :
- git status ;
- preserve local files ;
- inspect diffs.

---

# 10. LOT UI-1 — Callback Contract

Choisir une convention unique.

Recommandé :

```text
BmSelect.onChange(value)
BmSearchInput.onChange(value)
```

Puis corriger tous les consumers.

---

# 11. LOT UI-2 — Callback Tests

Ajouter tests :
- BmSelect value ;
- SearchInput value ;
- null/empty ;
- selection change ;
- page search ;
- form selector.

---

# 12. LOT UI-3 — Editor Default Page

À `/ui/builder/editor` :

```text
pageId in URL valid?
YES → open
NO → first valid page
NO pages → empty create state
```

---

# 13. LOT UI-4 — Deep Links

Tester :
- editor root ;
- valid page ;
- invalid page ;
- deleted page ;
- direct reload.

---

# 14. LOT UI-5 — Tenant/AppVersion Scope

Auditer backend/service :
- tenantId ;
- applicationVersionId ;
- page ownership ;
- snapshot ownership.

---

# 15. LOT UI-6 — Bindings

Valider :
- BM Entity/Field ;
- Data Contract ;
- permission ;
- operation ;
- AppVersion.

---

# 16. LOT UI-7 — Forms

Corriger callbacks puis vérifier :
- field mapping ;
- submit actions ;
- validation ;
- Data Runtime contract.

---

# 17. LOT UI-8 — Actions

Vérifier :
- NAVIGATE ;
- REFRESH ;
- AUTOMATION ;
- MODAL ;
- NOTIFICATION ;
- API contract.

Aucun arbitrary URL/code.

---

# 18. LOT UI-9 — Renderer Parity

Comparer :
- Preview ;
- Shared Renderer ;
- Pack Runtime renderer.

Réduire divergence.

---

# 19. LOT UI-10 — Validation

Renforcer :
- duplicate route ;
- invalid component ;
- broken binding ;
- broken automation ref ;
- unsupported runtime component ;
- AppVersion mismatch.

---

# 20. LOT UI-11 — Snapshot Integration

Tester :
- UI Definition ;
- validation ;
- immutable snapshot ;
- applicationVersionId ;
- Pack Manager.

---

# 21. LOT UI-12 — Security

Tests :
- cross-tenant UI definition ;
- forged AppVersion ;
- unknown component ;
- malicious props ;
- unauthorized write ;
- CALL_API arbitrary target.

---

# 22. LOT UI-13 — E2E

```text
ApplicationVersion
→ UI Builder
→ Page
→ Components
→ Binding
→ Preview
→ Validate
→ Pack Snapshot
→ Runtime Render
```

---

# 23. Production blockers

Ne pas considérer UI Builder prêt si :

- select/search plante ;
- editor sans page valide malgré pages existantes ;
- deep link casse au reload ;
- cross-tenant non testé ;
- snapshot AppVersion mismatch ;
- Preview et Runtime divergent fortement.

---

# 24. Ordre recommandé

```text
UI-0 Worktree
↓
UI-1 Callback Contract
↓
UI-2 Callback Tests
↓
UI-3 Default Page
↓
UI-4 Deep Links
↓
UI-5 Tenant/AppVersion
↓
UI-6 Bindings
↓
UI-7 Forms
↓
UI-8 Actions
↓
UI-9 Renderer Parity
↓
UI-10 Validation
↓
UI-11 Snapshot
↓
UI-12 Security
↓
UI-13 E2E
```
