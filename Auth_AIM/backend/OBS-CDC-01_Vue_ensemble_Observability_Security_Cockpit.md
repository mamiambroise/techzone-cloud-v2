# OBS-CDC-01 — Vue d’ensemble / Observability & Security Cockpit

**Référence :** OBS-CDC-01

## 1. Objectif
Fournir une vue synthétique de la santé, des erreurs, des événements de sécurité, de l'audit et des alertes de la plateforme.

## 2. KPIs
```text
Platform Health
Services Healthy
Services Degraded
Errors Today
Critical Errors
Security Events
Critical Security Events
Active Alerts
Unresolved Alerts
```

## 3. Sections
- santé globale ;
- services/composants ;
- erreurs récentes ;
- événements sécurité ;
- audit récent ;
- métriques ;
- alertes actives ;
- activité récente.

## 4. États
`HEALTHY`, `WARNING`, `DEGRADED`, `CRITICAL`, `UNKNOWN`.

## 5. Frontend React
Prévoir cartes KPI, filtres, recherche, timeline, graphiques simples, détails, badges de sévérité et états loading/empty/error.

## 6. Backend NestJS
Endpoints conceptuels :
```text
GET /api/observability/dashboard
GET /api/observability/health
GET /api/observability/activity
GET /api/observability/attention
```

## 7. Sécurité
L'accès au cockpit et aux détails sensibles dépend des permissions IAM. Les informations doivent être filtrées par tenant/scope.

## 8. Critères d'acceptation
Le cockpit permet d'identifier rapidement un service dégradé, une hausse d'erreurs, une alerte active ou un événement de sécurité critique.
