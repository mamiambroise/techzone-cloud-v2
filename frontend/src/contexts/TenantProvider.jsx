import React, { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { iamAuthService } from '../services/authService.js';
import { useDispatch } from 'react-redux';
import { setActiveTenant } from '../store/platformSlice.js';
import { useAuth } from '../auth/AuthProvider.jsx';
import { normalizeTenants } from './tenantNormalization.js';
export const TenantContext = createContext(null);
export function TenantProvider({ children }) {
  const { user, authState } = useAuth();
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
      await iamAuthService.switchTenant(id);
      if (current !== generation.current) return;
      localStorage.setItem('techzone_active_tenant', id); commit(tenant); setError(null);
      return tenant;
    } catch (failure) { if (current === generation.current) setError(failure); throw failure; }
    finally { if (current === generation.current) setLoading(false); }
  }, [tenants, commit]);
  useEffect(() => {
    const current = ++generation.current;
    setTenants([]); commit(null); setError(null);
    if (authState !== 'AUTHENTICATED') { setLoading(authState === 'BOOTING'); return; }
    setLoading(true);
    iamAuthService.getTenants().then(async response => {
      if (current !== generation.current) return;
      const list = normalizeTenants(response); setTenants(list);
      const stored = localStorage.getItem('techzone_active_tenant');
      const selected = list.length === 1 ? list[0] : list.find(t => t.id === stored);
      if (selected) {
        await iamAuthService.switchTenant(selected.id);
        if (current === generation.current) { commit(selected); localStorage.setItem('techzone_active_tenant', selected.id); }
      }
    }).catch(failure => { if (current === generation.current) setError(failure); })
      .finally(() => { if (current === generation.current) setLoading(false); });
    return () => { generation.current++; };
  }, [authState, userId, revision, commit]);
  const value = useMemo(() => ({tenants,activeTenant,loading,error,switchTenant,refreshTenants:()=>setRevision(r=>r+1),hasMultipleTenants:tenants.length>1}), [tenants,activeTenant,loading,error,switchTenant]);
  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}
export function useTenant() { const value = useContext(TenantContext); if (!value) throw new Error('useTenant must be used within a TenantProvider'); return value; }
