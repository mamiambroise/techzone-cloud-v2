import React from 'react';
import { render, screen, fireEvent, renderHook, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ErpErrorPanel from './ErpErrorPanel.jsx';
import { useErpCatalog } from './useErpResources.js';
import { api } from '../services/apiClient.js';

vi.mock('../services/apiClient.js', () => ({ api: { get: vi.fn() } }));

const error = { code: 'INTEGRATION_TIMEOUT', message: 'Timeout ERP', traceId: 'test-trace', statusCode: 504 };
const catalog = { resources: [{ key: 'customer', effectiveStatus: 'AVAILABLE' }], summary: { total: 1 } };

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
});

describe('Tenant ERP catalogue', () => {
  it('does not issue an ERP request without a selected tenant', () => {
    const { result } = renderHook(() => useErpCatalog(undefined));
    expect(result.current.status).toBe('UNCONFIGURED');
    expect(api.get).not.toHaveBeenCalled();
  });

  it('loads one metadata request instead of every business collection', async () => {
    api.get.mockResolvedValue({ data: catalog });
    const { result } = renderHook(() => useErpCatalog('tenant-a'));
    await waitFor(() => expect(result.current.status).toBe('LOADED'));
    expect(result.current.catalog).toEqual(catalog);
    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith('/erp/catalog', expect.objectContaining({ errorHandling: 'local' }));
  });

  it('clears a stale catalogue when the active tenant changes', async () => {
    const pending = [];
    api.get.mockImplementation((_url, config) => new Promise((resolve) => pending.push({ resolve, signal: config.signal })));
    const { result, rerender } = renderHook(({ tenant }) => useErpCatalog(tenant), { initialProps: { tenant: 'tenant-a' } });
    rerender({ tenant: 'tenant-b' });
    expect(pending[0].signal.aborted).toBe(true);
    await act(async () => { pending[0].resolve({ data: { resources: [{ key: 'leak' }] } }); });
    expect(JSON.stringify(result.current.catalog)).not.toContain('leak');
    await act(async () => { pending[1].resolve({ data: catalog }); });
    await waitFor(() => expect(result.current.catalog).toEqual(catalog));
  });

  it('exposes a catalogue error without inventing availability', async () => {
    api.get.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useErpCatalog('tenant-a'));
    await waitFor(() => expect(result.current.status).toBe('ERROR'));
    expect(result.current.catalog).toBeNull();
  });
});
