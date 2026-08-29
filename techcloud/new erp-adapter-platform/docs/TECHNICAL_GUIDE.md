# Guide technique — ERP Adapter Platform

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PACK BOUTIQUE                            │
│              (Techzone - application cliente)               │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              INTERFACE ERP UNIVERSELLE                      │
│                   (IErpAdapter)                             │
│  - getClients()        - getProducts()                      │
│  - createOrder()       - updateStock()                      │
│  - healthCheck()       - ...                                │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   ERP ADAPTER PLATFORM                      │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐ │
│  │   MOCK       │  │  DOLIBARR    │  │  ODOO (futur)     │ │
│  │   ADAPTER    │  │  ADAPTER     │  │  ADAPTER          │ │
│  └──────────────┘  └──────────────┘  └───────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Principe : indépendance de l'ERP

Le **Pack Boutique** ne connaît pas l'ERP auquel il se connecte. Il utilise
toujours la même interface `IErpAdapter`. Le choix de l'ERP se fait
uniquement via le paramètre `?erp=<CODE>`.

```
PACK BOUTIQUE
     │
     ▼
INTERFACE ERP UNIVERSELLE
     │
     ▼
ERP ADAPTER PLATFORM
     │
 ┌────┼────┬────┬────┐
 ▼    ▼    ▼    ▼   ▼
MOCK DOLI ODOO ERPX FUTUR
```

## Comment ajouter un nouvel ERP

### 1. Créer un nouvel adaptateur

Créez un dossier `backend/src/erp-adapter/<votre-erp>/` avec :
- `<votre-erp>.adapter.ts` — implémentation principale
- `<votre-erp>.mapper.ts` — mapping Techzone ↔ ERP
- `<votre-erp>.dto.ts` — DTO spécifiques
- `<votre-erp>.error.ts` — traduction des erreurs
- `<votre-erp>.config.ts` — configuration
- `<votre-erp>.adapter.spec.ts` — tests

### 2. Implémenter IErpAdapter

```typescript
export class MonErpAdapter implements IErpAdapter {
  async getClients(): Promise<ErpClient[]> { /* ... */ }
  async getProducts(): Promise<ErpProduct[]> { /* ... */ }
  async getOrders(): Promise<ErpOrder[]> { /* ... */ }
  async createClient(data): Promise<ErpClient> { /* ... */ }
  async createProduct(data): Promise<ErpProduct> { /* ... */ }
  async createOrder(data): Promise<ErpOrder> { /* ... */ }
  async getStock(productId): Promise<StockInfo> { /* ... */ }
  async updateStock(productId, qty): Promise<StockInfo> { /* ... */ }
  async healthCheck(): Promise<HealthCheckResult> { /* ... */ }
}
```

### 3. Enregistrer l'adaptateur

Dans `erp-adapter.service.ts` :

```typescript
constructor(
  private readonly mockAdapter: MockAdapter,
  private readonly dolibarrAdapter: DolibarrAdapter,
  private readonly monErpAdapter: MonErpAdapter,
) {
  this.adapters.set('MOCK', mockAdapter);
  this.adapters.set('DOLIBARR', dolibarrAdapter);
  this.adapters.set('MON_ERP', monErpAdapter);
}
```

Dans `erp-adapter.module.ts` :

```typescript
providers: [ErpAdapterService, MockAdapter, DolibarrAdapter, MonErpAdapter],
```

### 4. Tester avec le sandbox

```bash
docker-compose exec backend npm test
docker-compose exec backend npm run test:e2e
```

### 5. Publier

Ajouter la documentation de l'ERP dans `docs/`.

## Structure des données

### PostgreSQL — Tables

#### ERPRegistry

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | String (PK) | UUID |
| `code` | String (unique) | Code identifiant (ex : DOLIBARR) |
| `nom` | String | Nom affiché |
| `type` | String | CLOUD, ON_PREMISE, MOCK, HYBRID |
| `url` | String | URL de l'ERP |
| `status` | String | draft, active, inactive |
| `healthStatus` | String | healthy, degraded, unknown |
| `capabilities` | JSON | Capacités (ex : environment) |
| `createdAt` | DateTime | Date de création |
| `updatedAt` | DateTime | Date de modification |

#### AdapterRegistry

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | String (PK) | UUID |
| `erpId` | String (FK) | Référence vers ERPRegistry |
| `adapterType` | String | Type d'adaptateur |
| `config` | JSON | Configuration (URL, timeout, retry...) |
| `status` | String | active, inactive |

#### EntityMapping

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | String (PK) | UUID |
| `erpId` | String (FK) | Référence vers ERPRegistry |
| `entity` | String | Customer, Product, Order, Stock |
| `erpEntity` | String | Nom côté ERP |
| `fieldMappings` | JSON | Mapping des champs |
| `status` | String | active, inactive |
| `version` | Int | Version du mapping |

## Mapping des données

### Client

| Techzone | Dolibarr | Description |
|----------|----------|-------------|
| `id` | `id` | Identifiant |
| `nom` | `name` + `firstname` | Nom complet |
| `email` | `email` | Email |
| `telephone` | `phone` | Téléphone |

### Produit

| Techzone | Dolibarr | Description |
|----------|----------|-------------|
| `id` | `id` | Identifiant |
| `ref` | `ref` | Référence |
| `label` | `label` | Libellé |
| `price` | `price` | Prix HT |
| `stock` | `stock` | Stock |

### Commande

| Techzone | Dolibarr | Description |
|----------|----------|-------------|
| `id` | `id` | Identifiant |
| `ref` | `ref` | Référence |
| `clientId` | `socid` | Client |
| `lines[].productId` | `lines[].fk_product` | Produit |
| `lines[].quantity` | `lines[].qty` | Quantité |
| `lines[].price` | `lines[].price` | Prix |
| `total` | `total_ht` | Total |
| `status` | `status` | Statut (voir tableau) |

### Statuts de commande

| Dolibarr | Techzone |
|----------|----------|
| `0` | `DRAFT` (Brouillon) |
| `1` | `VALIDATED` (Validée) |
| `2` | `PROCESSING` (En cours) |
| `3` | `SHIPPED` (Expédiée) |
| `4` | `DELIVERED` (Livrée) |
| `5` | `CANCELLED` (Annulée) |
| `6` | `PAID` (Payée) |

## Gestion des erreurs

| Erreur Dolibarr | Code Techzone | Message |
|-----------------|---------------|---------|
| HTTP 401 | `AUTH_ERROR` | Clé API invalide |
| HTTP 404 | `NOT_FOUND` | Ressource non trouvée |
| HTTP 409 | `DUPLICATE` | Doublon détecté |
| HTTP 500 | `ERP_ERROR` | Erreur interne |
| Timeout | `TIMEOUT` | Délai dépassé |
| Réseau | `CONNECTION_ERROR` | Impossible de se connecter |
| HTTP 429 | `RATE_LIMIT` | Trop de requêtes |

## Mécanismes de résilience

### Retry avec backoff exponentiel

Le `DolibarrAdapter` réessaie automatiquement les requêtes échouées :

```
Tentative 1 : échec → attente 1s  → tentative 2
Tentative 2 : échec → attente 2s  → tentative 3
Tentative 3 : échec → erreur finale
```

Configuration dans `dolibarr.config.ts` :
- `retryAttempts` : nombre d'essais (défaut : 3)
- `retryDelay` : délai initial (défaut : 1000ms)
- `timeout` : timeout par requête (défaut : 10000ms)

### Fallback sur Mock

Le **Mock ERP** sert de référence. Il fonctionne toujours, même quand
Dolibarr est indisponible. C'est le mode par défaut.

## Tests

### Tests unitaires

```bash
docker-compose exec backend npm test
```

Couvrent :
- `MockAdapter` — CRUD complet en mémoire
- `ErpAdapterService` — enregistrement et résolution des adaptateurs
- `DolibarrMapper` — mapping Techzone ↔ Dolibarr
- `DolibarrError` — traduction des erreurs

### Tests E2E

```bash
docker-compose exec backend npm run test:e2e
```

Couvrent :
- `erp-crud.e2e-spec.ts` — CRUD complet (registre + adaptateur)
- `erp-independence.e2e-spec.ts` — indépendance ERP
- `erp-resilience.e2e-spec.ts` — résilience aux pannes

## Sécurité

- Les clés API sont stockées dans des variables d'environnement
- Les secrets ne sont jamais exposés dans les réponses API
- La validation des entrées est faite avec `class-validator`
- Le CORS limite les origines autorisées (`localhost:3001`)
- Le Swagger UI est accessible en développement uniquement