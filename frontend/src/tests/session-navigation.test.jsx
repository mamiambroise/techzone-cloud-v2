import React, { StrictMode } from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, AuthContext, useAuth } from '../auth/AuthProvider.jsx';
import { TenantProvider, useTenant } from '../contexts/TenantProvider.jsx';
import { normalizeTenants } from '../contexts/tenantNormalization.js';
import ProtectedRoute from '../auth/ProtectedRoute.jsx';
import RequireNavigationAccess from '../auth/RequireNavigationAccess.jsx';
import ComingSoon from '../components/ComingSoon.jsx';
import { iamAuthService } from '../services/authService.js';
vi.mock('../services/authService.js', () => ({iamAuthService:{me:vi.fn(),refresh:vi.fn(),getTenants:vi.fn(),switchTenant:vi.fn()},getDeviceFingerprint:vi.fn()}));
const store = () => configureStore({reducer:(state={})=>state});
const wrap = children => <Provider store={store()}>{children}</Provider>;
function AuthProbe(){const auth=useAuth();return <p>{auth.authState}</p>;}
function TenantProbe(){const value=useTenant();return <p>{value.activeTenant?.id || 'none'} / {String(value.loading)}</p>;}
afterEach(cleanup);
beforeEach(()=>{vi.clearAllMocks();localStorage.clear();});
describe('Auth bootstrap',()=>{
 it('coalesces StrictMode bootstrap and accepts the real nested user envelope',async()=>{
  iamAuthService.me.mockResolvedValue({data:{user:{id:'user-1'},activeTenant:null}});
  render(wrap(<StrictMode><AuthProvider><AuthProbe/></AuthProvider></StrictMode>));
  await screen.findByText('AUTHENTICATED');expect(iamAuthService.me).toHaveBeenCalledTimes(1);
 });
 it('settles on unauthenticated without launching a second refresh mechanism',async()=>{
  iamAuthService.me.mockRejectedValue({response:{status:401}});
  render(wrap(<AuthProvider><AuthProbe/></AuthProvider>));
  await screen.findByText('UNAUTHENTICATED');expect(iamAuthService.refresh).not.toHaveBeenCalled();
 });
 it('distinguishes confirmed database failure from invalid credentials',async()=>{
  iamAuthService.me.mockRejectedValue({normalized:{code:'DATABASE_UNAVAILABLE'},response:{status:503}});
  render(wrap(<AuthProvider><AuthProbe/></AuthProvider>));await screen.findByText('DATABASE_UNAVAILABLE');
 });
});
describe('Tenant bootstrap',()=>{
 it('waits for AUTHENTICATED',()=>{
  render(wrap(<AuthContext.Provider value={{user:null,authState:'BOOTING'}}><TenantProvider><TenantProbe/></TenantProvider></AuthContext.Provider>));expect(iamAuthService.getTenants).not.toHaveBeenCalled();
 });
 it('normalizes nested memberships, deduplicates and excludes inactive tenants',()=>{
  expect(normalizeTenants({data:{data:[null,{tenant:{id:'a',status:'ACTIVE'}},{id:'a',status:'ACTIVE'},{id:'b',status:'DISABLED'}]}}).map(t=>t.id)).toEqual(['a']);
  expect(()=>normalizeTenants({data:{unexpected:true}})).toThrow();
 });
 it('activates a sole tenant on the server before committing it in the UI',async()=>{
  iamAuthService.getTenants.mockResolvedValue({data:[{id:'tenant-a',status:'ACTIVE'}]});
  let finish;iamAuthService.switchTenant.mockImplementation(()=>new Promise(resolve=>{finish=resolve;}));
  render(wrap(<AuthContext.Provider value={{user:{id:'u'},authState:'AUTHENTICATED'}}><TenantProvider><TenantProbe/></TenantProvider></AuthContext.Provider>));
  await waitFor(()=>expect(iamAuthService.switchTenant).toHaveBeenCalledWith('tenant-a'));
  expect(screen.getByText('none / true')).toBeInTheDocument();finish({data:{}});
  await screen.findByText('tenant-a / false');
 });
 it('does not silently choose the first of several tenants',async()=>{
  iamAuthService.getTenants.mockResolvedValue({data:[{id:'a'},{id:'b'}]});
  render(wrap(<AuthContext.Provider value={{user:{id:'u'},authState:'AUTHENTICATED'}}><TenantProvider><TenantProbe/></TenantProvider></AuthContext.Provider>));
  await screen.findByText('none / false');expect(iamAuthService.switchTenant).not.toHaveBeenCalled();
 });
});
describe('Protected routes',()=>{
  const page=auth=><MemoryRouter initialEntries={['/iam/users']}><AuthContext.Provider value={auth}><Routes><Route path="/login" element={<p>Login destination</p>}/><Route element={<ProtectedRoute/>}><Route path="/iam/users" element={<RequireNavigationAccess><p>Admin content</p></RequireNavigationAccess>}/></Route></Routes></AuthContext.Provider></MemoryRouter>;
  it('redirects unauthenticated access',async()=>{render(page({user:null,authState:'UNAUTHENTICATED'}));await screen.findByText('Login destination');});
  it('denies an authenticated user without admin permission',async()=>{render(page({user:{id:'u',isAdmin:false},authState:'AUTHENTICATED'}));expect(await screen.findByRole('heading',{name:'Accès refusé'})).toBeInTheDocument();expect(screen.getByText('Erreur 403')).toBeInTheDocument();expect(screen.queryByText('Admin content')).not.toBeInTheDocument();});
  it('renders a feature-specific ComingSoon without presenting it as implemented',()=>{render(<MemoryRouter><ComingSoon title="Formulaires" module="UI Builder" description="Construction visuelle des formulaires" plannedPhase={4}/></MemoryRouter>);expect(screen.getByRole('heading',{name:'Formulaires'})).toBeInTheDocument();expect(screen.getByText('Construction visuelle des formulaires')).toBeInTheDocument();});
  it('sends ComingSoon back to the concerned module instead of Business Manager',()=>{render(<MemoryRouter><ComingSoon title="Plans" module="Abonnements" description="Bientôt" backTo="/billing/plans" backLabel="Abonnements"/></MemoryRouter>);expect(screen.getByRole('link',{name:/Retour — Abonnements/})).toHaveAttribute('href','/billing/plans');});
 });
