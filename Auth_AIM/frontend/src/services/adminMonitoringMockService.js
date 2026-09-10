import { monitoring as initialMonitoring } from '../data/mock';
import { adminOverview as initialOverview } from '../data/mock';

let monitoringStore = { ...initialMonitoring, services: initialMonitoring.services.map((s) => ({ ...s })), incidents: initialMonitoring.incidents.map((i) => ({ ...i })) };
let overviewStore = { ...initialOverview, services: initialOverview.services.map((s) => ({ ...s })), incidents: initialOverview.incidents.map((i) => ({ ...i })) };

export function getMonitoring() {
  return {
    ...monitoringStore,
    services: monitoringStore.services.map((s) => ({ ...s })),
    incidents: monitoringStore.incidents.map((i) => ({ ...i })),
  };
}

export function getOverview() {
  return {
    ...overviewStore,
    services: overviewStore.services.map((s) => ({ ...s })),
    incidents: overviewStore.incidents.map((i) => ({ ...i })),
  };
}

export function searchTraceId(traceId) {
  if (!traceId) return null;
  const inEvents = overviewStore.services.some((s) => s.name.includes(traceId));
  const inIncidents = overviewStore.incidents.some((i) => i.id.includes(traceId) || i.service.includes(traceId));
  if (!inEvents && !inIncidents) return null;
  return {
    traceId,
    matched: inEvents || inIncidents,
    mockDetail: 'Résultat mock pour la recherche par traceId.',
  };
}

export function resetStore() {
  monitoringStore = { ...initialMonitoring, services: initialMonitoring.services.map((s) => ({ ...s })), incidents: initialMonitoring.incidents.map((i) => ({ ...i })) };
  overviewStore = { ...initialOverview, services: initialOverview.services.map((s) => ({ ...s })), incidents: initialOverview.incidents.map((i) => ({ ...i })) };
}
