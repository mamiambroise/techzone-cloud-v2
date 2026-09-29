# Techzone Cloud — Project implementation matrix

27 September 2026; evidence: [First Full Runtime Review](FIRST_FULL_RUNTIME_REVIEW.md) and [sanitized evidence](full-runtime-review/). Status refers to the scope named in MODULE. Only HTTP infrastructure and anonymous login-page protection are REAL_PASS. Unit tests, source code, CDCs and mocks do not certify business E2E. Phase labels are architecture families, not invented delivery milestones.

| PHASE | MODULE | CDC | BACKEND | API | DATABASE | FRONTEND | REAL_TEST | MOCK | STATUS | BLOCKER | NEXT_ACTION |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Socle | Backend HTTP | docs/ARCHITECTURE.md | NestJS running | health / 401 / 400 / 403 measured | SELECT 1 observed | Proxy measured | HTTP probes | No | REAL_PASS | Scope = HTTP only | Reconcile auth schema |
| Socle | Login page and anonymous protection | docs/ARCHITECTURE.md | Anonymous guard | me 401 | Not needed | 92 redirects; 3 viewports | Live anonymous browser | No | REAL_PASS | Authenticated paths not included | Resume after auth repair |
| IAM | Auth/IAM | Architecture; IAM reports | Local auth services | Login 500 | Incompatible mappings/columns | Contract fixes | Login attempted, failed | No success simulated | BROKEN | SCHEMA_ERROR | Review IAM data migration |
| IAM | Tenant Context | Architecture | Token context, no membership validation seen | Context controller present | No test membership | No connected verification | BLOCKED_AUTH | No | BROKEN | Security scoping and persona | Use official memberships |
| IAM | Permissions | iam.constants.ts; historical docs | isAdmin mapping differs from DB roles | Guards unit PASS | Role assignments exist; none direct for account | Sidebar not filtered | Unit only | Static role catalogue | BROKEN | Authority mismatch | Restore legitimate role resolution |
| IAM | Administration | Architecture | Controllers/services | Present | Mappings inconsistent | Pages present | BLOCKED_AUTH | Mixed presentation constants | BROKEN | SCHEMA_ERROR | Reconcile before CRUD |
| Commercial | Subscription | Architecture | Prisma service | Present | Historical auth_aim tables | DemoPage | Not tested | UI demo | PARTIAL | AUTH/SCHEMA and placeholder | Validate API then connect UI separately |
| Commercial | Billing | Architecture | Prisma service | Present | Historical auth_aim tables | DemoPage | No financial operations | UI demo | PARTIAL | AUTH/SCHEMA | Dedicated safe sandbox recipe |
| Commercial | Entitlements/Quotas | Architecture | Prisma service | Present | Historical tables | DemoPage | Not tested | UI demo | PARTIAL | No integrated access evidence | Separate permission and entitlement checks |
| PF | Application / Business Manager | PF-CDC references in code | CRUD services | Paths corrected | Platform tables exist | Redux + API | BLOCKED_AUTH | Initial business arrays | PARTIAL | No tenant scoped API | Validate scoping and safe CRUD |
| BM | Data Models / Features / Metadata | No complete BM step catalogue found | Config/contract code; scope incomplete | Platform endpoints | Some tables; feature migration pending | Metadata UI | Not tested | Mixed static data | PARTIAL | No complete BM step proof | Map actual CDC before next work |
| BM | Validation / Quality | Code / specifications screen | No dedicated Pack validation certified | Partial platform contracts | Not verified | Validation cockpit | Not tested | Static/state-based checks | PARTIAL | Engine scope incomplete | Do not infer completed BM-CDC |
| BM | Pack Manager | FEATURE_MATRIX.md | Platform services reused | Partial | Application/version tables | Pack screens | BLOCKED_AUTH | Mixed | PARTIAL | Dedicated engine not certified | Document real capabilities |
| BM | Pack Publication | PublicationView source | No launch handler in view | No call from launch action | No write from handler | Success toast | Static proof of NO_OP | NO_OP | MOCK_ONLY | No publication operation | Mark unavailable pending dedicated scope |
| BM | Pack Runtime | FEATURE_MATRIX.md reference | No dedicated engine identified | Not identified | Not identified | No proof | Not tested | Unknown | NOT_IMPLEMENTED | No runtime evidence | Separate future mission |
| ERP | ERP Registry | Architecture | Tenant-aware CRUD | Present | tenantId columns missing | UI/API present | Anonymous 401 only | No live success | BROKEN | SCHEMA_ERROR + AUTH | Review tenant migration |
| ERP | ERP Adapter / Dolibarr | Architecture | Real and mock providers | Present | Registry/config dependent | ERP screens | PHP 202 / MySQL unavailable | Explicit provider possible | BLOCKED_EXTERNAL | ERP_EXTERNAL_UNAVAILABLE | Restore external ERP |
| Data | Data Runtime | Architecture; contracts in code | Provider/execution/binding | Present | History in memory | UI present | Unit PASS only | Provider-dependent | PARTIAL | AUTH/ERP/SCHEMA | Run actual query workflow |
| Data | Query Engine | query contracts in code | Filter/sort/page implementation | Query endpoint | ERP provider dependent | UI present | Unit PASS only | Unit doubles | PARTIAL | No live ERP result | Read-only ERP recipe |
| Automation | Rules / Conditions | WF contract reference | Evaluators in memory | Present | No durable rules store proven | UI present | Unit PASS only | Default mock rules | PARTIAL | No end-to-end result | Validate durable lifecycle |
| Automation | Formula Engine | No standalone CDC found | No dedicated formula engine found | Not identified | Not identified | No standalone route | Not tested | Not applicable | NOT_IMPLEMENTED | Not located | Do not build in this mission |
| Automation | Workflow | WF-CDC reference | In-memory executor | Present | In memory | UI present | Unit PASS only | Default workflows | PARTIAL | NO_OP actions | Distinguish orchestration and effects |
| Automation | Automation / Actions | WF-CDC-00 | Engine + no-handler success | Present | History in memory | UI present | Unit PASS only | Production NO_OP defaults | PARTIAL | No real action effect | Expose unsupported actions honestly |
| Observability | Observability / Audit | Architecture | Memory stores + DB reads | Present | Mixed persistence | API + mock security events | TraceId HTTP observed | Production mixed | PARTIAL | No real mutation audit | Validate end-to-end audit |
| UI | UI Runtime | Architecture | No configurable UI engine identified | React routing only | Not applicable | Static routed components | Anonymous route check only | Demo pages | PARTIAL | No metadata runtime proof | Do not infer builder completion |
| PF/DEP/Integration | Platform | PF and DEP references | Services present | 98 paths corrected | Platform tables | API and simulated metrics | Unit/HTTP only | Mixed | PARTIAL | AUTH and scope issues | Scoped CRUD and contracts |

## Business Manager step reference

The available docs do not contain a complete authoritative BM-CDC step breakdown. PF-CDC-00..06 is visible in the frontend shell; WF-CDC and DEP-CDC appear in source/tests. BM-CDC-09 is explicitly excluded by AGENTS.md and has not been rebuilt. No absent step is declared complete.

| STEP | CDC | CODE | BACKEND | FRONTEND | REAL_TEST | STATUS |
| --- | --- | --- | --- | --- | --- | --- |
| Applications | PF references; no complete BM step mapping | Present | CRUD | Catalog | BLOCKED_AUTH | PARTIAL |
| Data Models / Features | Incomplete reference | Partial metadata/config | Partial | Metadata UI | BLOCKED_AUTH | PARTIAL |
| Menu / Navigation | Canonical route catalogue | Present | Not applicable | 92 entries | Anonymous only | PARTIAL |
| Configuration / Metadata | PF config references | Present | Prisma API | Config screen | BLOCKED_AUTH | PARTIAL |
| Validation / Quality | Screen/specifications | Partial | No Pack engine certified | Cockpit | Not executed | PARTIAL |
| Page/UI, Form, Dashboard builders; AI | Explicitly out of scope | Not reviewed or developed | Not certified | Not certified | NOT_TESTED | NOT_IMPLEMENTED |

The last row means no implementation certified by this review, not proof that no historical file exists.
