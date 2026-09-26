import { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from '../../components/observability/useToast';
import { DataTable } from '../../components/observability/DataTable';
import { DetailPanel } from '../../components/observability/DetailPanel';
import { StatusBadge } from '../../components/observability/StatusBadge';
import * as entitlementsService from '../../services/billingEntitlementsMockService';
import './BillingPage.css';

function EntitlementsPage() {
  const { toast, showToast } = useToast();
  const [entitlements, setEntitlements] = useState([]);
  const [quotas, setQuotas] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [tenantEntitlements, setTenantEntitlements] = useState([]);
  const [tenantQuotas, setTenantQuotas] = useState([]);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    setEntitlements(entitlementsService.listEntitlements());
    setQuotas(entitlementsService.listQuotas());
  }, []);

  const handleRowClick = useCallback((row) => {
    setSelectedTenant(row);
    setTenantEntitlements(entitlementsService.getEntitlementsByTenant(row.tenantId));
    setTenantQuotas(entitlementsService.getQuotasByTenant(row.tenantId));
    setDetailOpen(true);
  }, []);

  const columns = useMemo(() => [
    { key: 'tenantName', label: 'Tenant', width: '16rem' },
    { key: 'capability', label: 'Capacité', width: '14rem' },
    { key: 'granted', label: 'Accordé', width: '8rem', render: (v) => <span className={v ? 'billing-badge-active' : 'billing-badge-danger'}>{v ? 'Oui' : 'Non'}</span> },
    { key: 'source', label: 'Source', width: '12rem' },
    { key: 'validFrom', label: 'Validité', width: '20rem', render: (v, row) => v && row.validTo ? `${v} → ${row.validTo}` : '—' },
  ], []);

  const quotaColumns = useMemo(() => [
    { key: 'code', label: 'Code', width: '10rem' },
    { key: 'limit', label: 'Limite', width: '8rem', render: (v) => v.toLocaleString() },
    { key: 'used', label: 'Utilisé', width: '8rem', render: (v) => v.toLocaleString() },
    { key: 'remaining', label: 'Restant', width: '8rem', render: (v) => v.toLocaleString() },
    { key: 'resetPolicy', label: 'Reset', width: '10rem' },
  ], []);

  return (
    <div className="billing-page">
      <nav className="billing-breadcrumb">
        <span>Tenant / Subscription / Billing</span>
        <span className="billing-breadcrumb-sep">/</span>
        <span className="billing-breadcrumb-current">Entitlements &amp; Quotas</span>
      </nav>
      <h1 className="billing-title">Entitlements &amp; Quotas</h1>
      <p className="billing-subtitle">Capacités accordées et quotas par tenant.</p>
      <div className="billing-section">
        <h3 className="billing-section-title">Entitlements par tenant</h3>
        <div className="billing-table-wrapper">
          <DataTable columns={columns} rows={entitlements} rowKey="id" onRowClick={handleRowClick} emptyMessage="Aucun entitlement trouvé" />
        </div>
      </div>
      <div className="billing-section">
        <h3 className="billing-section-title">Quotas</h3>
        <div className="billing-table-wrapper">
          <DataTable columns={quotaColumns} rows={quotas} rowKey="id" emptyMessage="Aucun quota trouvé" />
        </div>
      </div>
      <DetailPanel open={detailOpen} title={selectedTenant ? `Détail : ${selectedTenant?.tenantName || ''}` : 'Détail'} onClose={() => setDetailOpen(false)}>
        {selectedTenant && (
          <>
            <h3 className="billing-section-title">Entitlements</h3>
            {tenantEntitlements.length > 0 ? (
              <div className="billing-table-wrapper">
                <table className="billing-table">
                  <thead><tr><th>Capacité</th><th>Accordé</th><th>Source</th></tr></thead>
                  <tbody>
                    {tenantEntitlements.map((e) => (
                      <tr key={e.id}>
                        <td>{e.capability}</td>
                        <td><span className={e.granted ? 'billing-badge-active' : 'billing-badge-danger'}>{e.granted ? 'Oui' : 'Non'}</span></td>
                        <td>{e.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <span>Aucun entitlement</span>}
            <div className="billing-section" style={{ marginTop: '1rem' }}>
              <h3 className="billing-section-title">Quotas</h3>
              {tenantQuotas.length > 0 ? (
                <div className="billing-table-wrapper">
                  <table className="billing-table">
                    <thead><tr><th>Code</th><th>Limite</th><th>Utilisé</th><th>Restant</th><th>Progression</th></tr></thead>
                    <tbody>
                      {tenantQuotas.map((q) => {
                        const pct = q.limit > 0 ? Math.round((q.used / q.limit) * 100) : 0;
                        return (
                          <tr key={q.id}>
                            <td>{q.code}</td>
                            <td>{q.limit.toLocaleString()}</td>
                            <td>{q.used.toLocaleString()}</td>
                            <td>{q.remaining.toLocaleString()}</td>
                            <td>
                              <div className="billing-quota-bar">
                                <div className="billing-quota-fill" style={{ width: `${pct}%`, backgroundColor: pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#10b981' }} />
                              </div>
                              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{pct}%</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : <span>Aucun quota</span>}
            </div>
          </>
        )}
      </DetailPanel>
      {toast && <div className="obs-toast" role="status">{toast}</div>}
    </div>
  );
}

export default EntitlementsPage;
