import { useState, useEffect, useMemo } from 'react';
import { useToast } from '../../components/observability/useToast';
import * as overviewService from '../../services/billingOverviewMockService';
import DonutChart from '../../components/DonutChart';
import LineChart from '../../components/LineChart';
import './BillingPage.css';

function OverviewPage() {
  const { toast, showToast } = useToast();
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    setOverview(overviewService.getOverview());
  }, []);

  const stats = useMemo(() => overview?.stats || [], [overview]);
  const flow = useMemo(() => overview?.flow || [], [overview]);
  const mrrTrend = useMemo(() => overview?.charts?.mrrTrend || [], [overview]);
  const statusDistribution = useMemo(() => overview?.charts?.statusDistribution || [], [overview]);

  return (
    <div className="billing-page">
      <nav className="billing-breadcrumb">
        <span>Tenant / Subscription / Billing</span>
        <span className="billing-breadcrumb-sep">/</span>
        <span className="billing-breadcrumb-current">Vue d'ensemble</span>
      </nav>
      <h1 className="billing-title">Vue d'ensemble</h1>
      <p className="billing-subtitle">Cockpit du pack Tenant / Subscription / Billing.</p>
      <div className="billing-stats">
        {stats.map((s) => (
          <div key={s.label} className="billing-stat-card">
            <span className="billing-stat-value">{s.value}</span>
            <span className="billing-stat-label">{s.label}</span>
            <span className="billing-stat-context">{s.context}</span>
          </div>
        ))}
      </div>
      <div className="billing-section">
        <h3 className="billing-section-title">Flux Plan → Abonnement → Facturation → Paiement → Entitlements</h3>
        <div className="billing-flow">
          {flow.map((step, i) => (
            <span key={step}>
              {i > 0 && <span className="billing-flow-arrow">→</span>}
              <span className="billing-flow-step">{step}</span>
            </span>
          ))}
        </div>
      </div>
      {overview?.charts && (
        <div className="billing-charts">
          <div className="billing-chart-card">
            <h3 className="billing-chart-title">Évolution MRR (mock)</h3>
            <div className="billing-chart-body">
              <LineChart
                data={mrrTrend.map((m) => m.value)}
                width={420}
                height={180}
                stats={[
                  { label: 'Dernier', value: `€${mrrTrend[mrrTrend.length - 1]?.value || 0}` },
                  { label: 'Max', value: `€${Math.max(...mrrTrend.map((m) => m.value))}` },
                ]}
              />
            </div>
          </div>
          <div className="billing-chart-card">
            <h3 className="billing-chart-title">Distribution des statuts</h3>
            <div className="billing-chart-body">
              <DonutChart data={statusDistribution} size={180} />
            </div>
          </div>
        </div>
      )}
      {toast && <div className="obs-toast" role="status">{toast}</div>}
    </div>
  );
}

export default OverviewPage;
