import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/apiClient.js';
import { erpFailure, isUnconfigured } from './ErpErrorPanel.jsx';

export const ERP_RESOURCES = { clients: 'Clients', products: 'Produits', orders: 'Commandes', invoices: 'Factures', stocks: 'Stocks' };
export const ERP_REQUEST_DEADLINE_MS = 15000;
export function useErpResources(tenantId) {
  const [states, setStates] = useState({});
  const requests = useRef(new Map());
  const generation = useRef(0);
  const load = useCallback(async resource => {
    requests.current.get(resource)?.abort();
    const controller = new AbortController(); requests.current.set(resource, controller);
    const current = generation.current;
    let timedOut = false;
    let timeoutId;
    setStates(previous => ({ ...previous, [resource]: { status: 'LOADING' } }));
    try {
      const deadline = new Promise((_, reject) => {
        controller.signal.addEventListener('abort', () => {
          clearTimeout(timeoutId);
          if (!timedOut) reject(new DOMException('ERP request cancelled', 'AbortError'));
        }, { once: true });
        timeoutId = setTimeout(() => {
          timedOut = true;
          reject({ code: 'INTEGRATION_TIMEOUT', message: 'Le délai de chargement ERP est dépassé. Réessayez.', statusCode: 504 });
          controller.abort();
        }, ERP_REQUEST_DEADLINE_MS);
      });
      const result = await Promise.race([api.get(`/erp/${resource}`, { signal: controller.signal, errorHandling: 'local', timeout: ERP_REQUEST_DEADLINE_MS }), deadline]);
      if (!Array.isArray(result.data)) throw { code: 'INTEGRATION_PAYLOAD_INVALID', message: 'Réponse ERP invalide.' };
      if (controller.signal.aborted || current !== generation.current) return;
      setStates(previous => ({ ...previous, [resource]: { status: result.data.length ? 'LOADED' : 'EMPTY', data: result.data } }));
    } catch (error) {
      if ((controller.signal.aborted && !timedOut) || current !== generation.current || requests.current.get(resource) !== controller) return;
      const detail = erpFailure(error);
      const status = isUnconfigured(error) ? 'UNCONFIGURED' : detail.statusCode === 403 || detail.code === 'ERP_PERMISSION_DENIED' ? 'FORBIDDEN' : [502,503,504].includes(detail.statusCode) || detail.code === 'INTEGRATION_TIMEOUT' ? 'UNAVAILABLE' : 'ERROR';
      setStates(previous => ({ ...previous, [resource]: { status, error } }));
    } finally {
      clearTimeout(timeoutId);
      if (requests.current.get(resource) === controller) requests.current.delete(resource);
    }
  }, []);
  useEffect(() => {
    generation.current++; setStates({});
    if (tenantId) Object.keys(ERP_RESOURCES).forEach(load);
    else setStates(Object.fromEntries(Object.keys(ERP_RESOURCES).map(resource => [resource, { status: 'UNCONFIGURED', error: { code: 'ERP_INSTANCE_NOT_CONFIGURED', message: 'Selectionnez un tenant pour charger ses ressources ERP.' } }])));
    return () => { generation.current++; requests.current.forEach(controller => controller.abort()); requests.current.clear(); };
  }, [tenantId, load]);
  return { states, retry: load, retryAll: () => Object.keys(ERP_RESOURCES).forEach(load) };
}
