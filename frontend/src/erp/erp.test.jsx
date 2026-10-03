import React from 'react';
import { render, screen, fireEvent, renderHook, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ErpErrorPanel from './ErpErrorPanel.jsx';
import { useErpResources, ERP_REQUEST_DEADLINE_MS } from './useErpResources.js';
import { api } from '../services/apiClient.js';
vi.mock('../services/apiClient.js', () => ({ api: { get: vi.fn() } }));
const error = { code: 'INTEGRATION_TIMEOUT', message: 'Timeout ERP', traceId: 'test-trace', statusCode: 504 };
beforeEach(() => vi.clearAllMocks());
describe('ERP error panel', () => {
  it('deduplicates, copies a trace and provides controlled retries', async () => {
    const copy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: copy } });
    const retry = vi.fn(), retryAll = vi.fn(), dismiss = vi.fn();
    render(<MemoryRouter><ErpErrorPanel errors={[{ resource: 'clients', error }, { resource: 'clients', error }]} onRetry={retry} onRetryAll={retryAll} onDismiss={dismiss} /></MemoryRouter>);
    expect(screen.getAllByText('Timeout ERP')).toHaveLength(1);
    fireEvent.click(screen.getByText('Copier traceId')); await waitFor(() => expect(copy).toHaveBeenCalledWith('test-trace'));
    fireEvent.click(screen.getByText('Réessayer')); expect(retry).toHaveBeenCalledWith('clients');
    fireEvent.click(screen.getByText('Tout réessayer')); expect(retryAll).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText('Fermer')); expect(dismiss).toHaveBeenCalledTimes(1);
  });
  it('shows a single neutral configuration prompt', () => {
    render(<MemoryRouter><ErpErrorPanel errors={['clients','products'].map(resource => ({ resource, error: { code: 'ERP_INSTANCE_NOT_CONFIGURED' } }))} /></MemoryRouter>);
    expect(screen.getByText('ERP non configuré')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Configurer la connexion' })).toHaveAttribute('href','/settings/erp');
  });
});
describe('Independent ERP requests', () => {
  it('ends in UNCONFIGURED without issuing requests when no tenant is selected', () => {
    const { result } = renderHook(() => useErpResources(undefined));
    expect(Object.values(result.current.states)).toHaveLength(5);
    expect(Object.values(result.current.states).every(state => state.status === 'UNCONFIGURED')).toBe(true);
    expect(api.get).not.toHaveBeenCalled();
  });
  it('terminates all five requests even when the transport promise never settles', async () => {
    vi.useFakeTimers();
    try {
      const signals = [];
      api.get.mockImplementation((_url, config) => { signals.push(config.signal); return new Promise(() => {}); });
      const { result, unmount } = renderHook(() => useErpResources('tenant-a'));
      expect(Object.values(result.current.states).every(state => state.status === 'LOADING')).toBe(true);
      await act(async () => { await vi.advanceTimersByTimeAsync(ERP_REQUEST_DEADLINE_MS + 1); });
      expect(Object.values(result.current.states)).toHaveLength(5);
      expect(Object.values(result.current.states).every(state => state.status === 'UNAVAILABLE' && state.error.code === 'INTEGRATION_TIMEOUT')).toBe(true);
      expect(signals.every(signal => signal.aborted)).toBe(true);
      unmount();
    } finally { vi.useRealTimers(); }
  });
  it('classifies a provider permission refusal as FORBIDDEN without confusing IAM', async () => {
    api.get.mockRejectedValue({ response: { status: 502, data: { code: 'ERP_PERMISSION_DENIED', message: 'Refus ERP' } } });
    const { result } = renderHook(() => useErpResources('tenant-a'));
    await waitFor(() => expect(Object.values(result.current.states).every(state => state.status === 'FORBIDDEN')).toBe(true));
    expect(api.get).toHaveBeenCalledTimes(5);
  });
  it('keeps a successful resource visible alongside failure and empty states', async () => {
    api.get.mockImplementation(url => url.endsWith('/clients') ? Promise.resolve({ data: [{ id: 'a' }] }) : url.endsWith('/invoices') ? Promise.reject(error) : Promise.resolve({ data: [] }));
    const { result } = renderHook(() => useErpResources('tenant-a'));
    await waitFor(() => expect(result.current.states.invoices?.status).toBe('UNAVAILABLE'));
    expect(result.current.states.clients.data).toEqual([{ id: 'a' }]);
    expect(result.current.states.products.status).toBe('EMPTY');
    expect(api.get).toHaveBeenCalledTimes(5);
  });
  it('aborts old requests and rejects stale responses after tenant change', async () => {
    const pending = [];
    api.get.mockImplementation((_url, config) => new Promise(resolve => pending.push({ resolve, signal: config.signal })));
    const { result, rerender, unmount } = renderHook(({ tenant }) => useErpResources(tenant), { initialProps: { tenant: 'a' } });
    rerender({ tenant: 'b' });
    expect(pending.slice(0,5).every(item => item.signal.aborted)).toBe(true);
    await act(async () => { pending.slice(0,5).forEach(item => item.resolve({ data: [{ id: 'tenant-a-secret' }] })); });
    expect(JSON.stringify(result.current.states)).not.toContain('tenant-a-secret');
    unmount(); expect(pending.every(item => item.signal.aborted)).toBe(true);
  });
});
