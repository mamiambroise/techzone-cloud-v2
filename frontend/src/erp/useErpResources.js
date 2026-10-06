import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/apiClient.js';

export const ERP_CATALOG_DEADLINE_MS = 15000;

/**
 * Fetches metadata and resolved capability states only. It intentionally does
 * not load every business collection: resource data is fetched on navigation.
 */
export function useErpCatalog(tenantId) {
  const [state, setState] = useState({ status: 'LOADING', catalog: null, error: null });
  const requestRef = useRef(null);
  const generation = useRef(0);

  const load = useCallback(async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    const currentGeneration = generation.current;
    setState({ status: 'LOADING', catalog: null, error: null });
    try {
      const response = await api.get('/erp/catalog', {
        signal: controller.signal,
        errorHandling: 'local',
        timeout: ERP_CATALOG_DEADLINE_MS,
      });
      if (controller.signal.aborted || currentGeneration !== generation.current) return;
      const catalog = response.data;
      if (!catalog || !Array.isArray(catalog.resources)) throw new Error('Réponse catalogue ERP invalide.');
      setState({ status: catalog.resources.length ? 'LOADED' : 'EMPTY', catalog, error: null });
    } catch (error) {
      if (controller.signal.aborted || currentGeneration !== generation.current) return;
      setState({ status: 'ERROR', catalog: null, error });
    } finally {
      if (requestRef.current === controller) requestRef.current = null;
    }
  }, []);

  useEffect(() => {
    generation.current += 1;
    if (!tenantId) {
      setState({ status: 'UNCONFIGURED', catalog: null, error: null });
      return undefined;
    }
    load();
    return () => {
      generation.current += 1;
      requestRef.current?.abort();
      requestRef.current = null;
    };
  }, [tenantId, load]);

  return { ...state, retry: load };
}

export const ERP_STATUS_LABELS = {
  AVAILABLE: 'Disponible',
  PERMISSION_DENIED: 'Accès Dolibarr refusé',
  MODULE_DISABLED: 'Module Dolibarr désactivé',
  NOT_SUPPORTED: 'Non supporté par Dolibarr',
  NOT_IMPLEMENTED: 'Non implémenté',
  UNKNOWN: 'Non vérifié',
  UNAVAILABLE: 'Indisponible',
  AUTH_FAILED: 'Authentification refusée',
  ERROR: 'Erreur de diagnostic',
};
