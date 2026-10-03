import React, { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { iamAuthService } from '../services/authService.js';
import { useDispatch } from 'react-redux';
import { setActiveTenant } from '../store/platformSlice.js';
import { resetTenantScopedState } from '../store/tenantScope.js';
import { useAuth } from '../auth/AuthProvider.jsx';
import { normalizeTenants } from './tenantNormalization.js';
export const TenantContext = createContext(null);
export function TenantProvider({ children }) {
  const { user, authState, refreshPrincipal } = useAuth();
  const dispatch = useDispatch();
  const [tenants, setTenants] = useState([]);
  const [activeTenant, setActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revision, setRevision] = useState(0);
  const generation = useRef(0);
  const userId = user?.id;
  const commit = useCallback(tenant => { setActive(tenant); dispatch(setActiveTenant(tenant?.id ?? null)); }, [dispatch]);
const switchTenant = useCallback(async id => {
    const tenant = tenants.find(t => t.id === id);
    if (!tenant) throw new Error('Tenant non autorisé');
    const current = generation.current;
    setLoading(true);
    try {
      // 1. Le serveur revalide l'appartenance et bascule la session.
      await iamAuthService.switchTenant(id);
      await refreshPrincipal?.();
      if (current !== generation.current) return;
      localStorage.setItem('techzone_active_tenant', id);
      // 2. Purge des états tenant-scoped AVANT de publier le nouveau contexte :
      //    aucune donnée du tenant précédent ne doit rester visible, même
      //    pendant le rendu qui suit le changement.
      dispatch(resetTenantScopedState(id));
      // 3. Publication du contexte : effectiveNavigation se recalcule sur
      //    activeTenant.id et les modules rechargent leurs données.
      commit(tenant);
      setError(null);
      return tenant;
    } catch (failure) { if (current === generation.current) setError(failure); throw failure; }
    finally { if (current === generation.current) setLoading(false); }
  }, [tenants, commit, refreshPrincipal, dispatch]);
useEffect(() => {
    const current = ++generation.current;
    setTenants([]); commit(null); setError(null);
    // Une nouvelle session (ou une liste de tenants rafraîchie) repart d'un
    // magasin vierge : aucune donnée du tenant précédent ne doit survivre.
    dispatch(resetTenantScopedState(null));
    if (authState !== 'AUTHENTICATED') { setLoading(authState === 'BOOTING'); return; }
    setLoading(true);
    iamAuthService.getTenants().then(async response => {
      if (current !== generation.current) return;
      const list = normalizeTenants(response); setTenants(list);
      const stored = localStorage.getItem('techzone_active_tenant');
      const selected = list.length === 1 ? list[0] : list.find(t => t.id === stored);
      if (selected) {
        await iamAuthService.switchTenant(selected.id);
        await refreshPrincipal?.();
        if (current === generation.current) { commit(selected); localStorage.setItem('techzone_active_tenant', selected.id); }
      }
    }).catch(failure => { if (current === generation.current) setError(failure); })
      .finally(() => { if (current === generation.current) setLoading(false); });
    return () => { generation.current++; };
  }, [authState, userId, revision, commit, refreshPrincipal, dispatch]);
  const value = useMemo(() => ({tenants,activeTenant,loading,error,switchTenant,refreshTenants:()=>setRevision(r=>r+1),hasMultipleTenants:tenants.length>1}), [tenants,activeTenant,loading,error,switchTenant]);
  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}
export function useTenant() { const value = useContext(TenantContext); if (!value) throw new Error('useTenant must be used within a TenantProvider'); return value; }
