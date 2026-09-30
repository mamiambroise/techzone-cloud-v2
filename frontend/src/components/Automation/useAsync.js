import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Chargement de données avec loading / error / reload.
 * - Les données précédentes sont conservées pendant un rechargement.
 * - Toute réponse arrivée après un rechargement ou un démontage est ignorée.
 * - Le signal AbortController est transmis à asyncFn ; il n'a d'effet réseau
 *   que si le service l'accepte, mais l'état reste protégé dans tous les cas.
 */
export function useAsync(asyncFn, { immediate = true } = {}) {
  const [state, setState] = useState({ data: null, loading: immediate, error: null });
  const fnRef = useRef(asyncFn);
  fnRef.current = asyncFn;
  const ctrlRef = useRef(null);

  const reload = useCallback(async () => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fnRef.current(ctrl.signal);
      if (!ctrl.signal.aborted) setState({ data, loading: false, error: null });
    } catch (err) {
      if (ctrl.signal.aborted) return;
      console.error(err);
      setState((s) => ({ ...s, loading: false, error: err }));
    }
  }, []);

  useEffect(() => {
    if (immediate) reload();
    return () => ctrlRef.current?.abort();
  }, [immediate, reload]);

  return { ...state, reload };
}

/**
 * Action utilisateur (démarrer, déclencher, évaluer…) protégée contre le
 * double clic : un second appel pendant l'exécution est ignoré.
 */
export function useAction(fn) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const pending = useRef(false);
  const [loading, setLoading] = useState(false);

  const run = useCallback(async (...args) => {
    if (pending.current) return undefined;
    pending.current = true;
    setLoading(true);
    try {
      return await fnRef.current(...args);
    } finally {
      pending.current = false;
      setLoading(false);
    }
  }, []);

  return { run, loading };
}
