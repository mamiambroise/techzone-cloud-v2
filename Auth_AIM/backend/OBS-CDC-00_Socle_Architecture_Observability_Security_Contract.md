# OBS-CDC-00 — Socle, Architecture & Observability/Security Contract

**Projet :** Techzone Cloud  
**Pack :** Observability & Security  
**Équipe :** Team 1 — Identity, Security & Administration  
**Référence :** OBS-CDC-00  
**Version :** 1.0

## 1. Objet
Définir le socle commun d'observabilité et de sécurité de Techzone Cloud : logs, audit, événements de sécurité, métriques, monitoring, alertes, corrélation, rétention, sécurité et contrats consommables par les autres packs.

## 2. Positionnement
```text
TOUS LES PACKS TECHZONE CLOUD
        ↓
Observability Contract v1 🔒
Security Event Contract v1 🔒
        ↓
OBSERVABILITY & SECURITY
        ├── Logs
        ├── Audit
        ├── Security Events
        ├── Monitoring
        └── Alerts
```

## 3. Responsabilités
Le pack doit :
- standardiser logs, audit, métriques et événements ;
- fournir un `traceId` de bout en bout ;
- centraliser les diagnostics ;
- détecter et classifier les événements de sécurité ;
- exposer l'état des composants ;
- générer des alertes contrôlées ;
- appliquer rétention et redaction.

Il ne doit pas :
- remplacer IAM ;
- modifier les données métier observées ;
- stocker des secrets dans les logs ;
- devenir une dépendance bloquante pour les flux métier ;
- permettre à un tenant de consulter les données d'un autre tenant.

## 4. Contrats v1
À versionner :
- Observability Event Contract ;
- Log Event Contract ;
- Audit Event Contract ;
- Security Event Contract ;
- Metric Contract ;
- Health Contract ;
- Alert Contract ;
- Error Contract.

## 5. Contexte commun
Chaque événement pertinent transporte selon le cas :
`timestamp`, `traceId`, `requestId`, `tenantId`, `userId`, `applicationId`, `environmentId`, `service`, `component`, `eventType`, `severity`.

## 6. Sévérités
```text
DEBUG
INFO
NOTICE
WARNING
ERROR
CRITICAL
```

Pour sécurité :
```text
LOW
MEDIUM
HIGH
CRITICAL
```

## 7. Redaction
Interdire dans les logs :
- mots de passe ;
- tokens complets ;
- secrets/API keys ;
- credentials ;
- données sensibles non nécessaires.

## 8. Résilience
La panne de la couche d'observabilité ne doit pas provoquer une panne globale des fonctions métier. Prévoir buffering/queue/retry lorsque pertinent.

## 9. Multi-tenant
Les événements doivent être correctement scoppés. Les recherches et dashboards doivent respecter l'isolation tenant.

## 10. Critères d'acceptation
- Contrats v1 lockés.
- `traceId` standardisé.
- Aucun secret dans les logs.
- Tenant isolation PASS.
- Audit immuable logiquement.
- Mocks conformes disponibles.
- Contract Tests PASS.
