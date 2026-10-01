import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  AreaChart, Area, CartesianGrid,
} from 'recharts';
import {
  ServerStackIcon,
  ScaleIcon,
  FolderOpenIcon,
  BoltIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
  UsersIcon,
  ShoppingCartIcon,
  CurrencyEuroIcon,
  ArchiveBoxIcon,
  TruckIcon,
  DocumentTextIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';
import {
  erpRegistryService,
  automationService,
  erpHealthService,
  statsService,
  orderService,
  invoiceService,
  productService,
  clientService,
  documentService,
} from '../services/apiClient.js';
import { DashboardSkeleton } from '../components/Loaders.jsx';
import ErpErrorPanel from '../components/ErpErrorPanel.jsx';

function Dashboard() {
  const [recentErps, setRecentErps] = useState([]);
  const [automation, setAutomation] = useState(null);
  const [erpHealth, setErpHealth] = useState(null);
  const [erpMetrics, setErpMetrics] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [clientsMap, setClientsMap] = useState({});
  const [documentsCount, setDocumentsCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [widgetErrors, setWidgetErrors] = useState({});
  const healthState = erpHealth?.status;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [erpRes, autoRes, healthRes, statsRes, orderRes, invRes, prodRes, clientRes, docRes] =
          await Promise.allSettled([
            erpRegistryService.getAll(),
            automationService.cockpit(),
            erpHealthService.check(),
            statsService.get(),
            orderService.getAll(),
            invoiceService.getAll(),
            productService.getAll(),
            clientService.getAll(),
            documentService.getAll(),
          ]);
        const errors = {};
        if (erpRes.status === 'rejected') errors.erps = erpRes.reason;
        if (autoRes.status === 'rejected') errors.automation = autoRes.reason;
        if (healthRes.status === 'rejected') errors.health = healthRes.reason;
        if (statsRes.status === 'rejected') errors.metrics = statsRes.reason;
        if (orderRes.status === 'rejected') errors.orders = orderRes.reason;
        if (invRes.status === 'rejected') errors.invoices = invRes.reason;
        if (prodRes.status === 'rejected') errors.products = prodRes.reason;
        if (clientRes.status === 'rejected') errors.clients = clientRes.reason;
        if (docRes.status === 'rejected') errors.documents = docRes.reason;
        setWidgetErrors(errors);
        if (erpRes.status === 'fulfilled') {
          const erps = erpRes.value.data;
          setRecentErps(erps.slice(0, 5));
        }
        if (autoRes.status === 'fulfilled') setAutomation(autoRes.value.data);
        if (healthRes.status === 'fulfilled') setErpHealth(healthRes.value.data);
        if (statsRes.status === 'fulfilled') setErpMetrics(statsRes.value.data);
        if (orderRes.status === 'fulfilled') setRecentOrders(orderRes.value.data);
        if (invRes.status === 'fulfilled') setRecentInvoices(invRes.value.data);
        if (prodRes.status === 'fulfilled') setProducts(prodRes.value.data);
        if (clientRes.status === 'fulfilled') {
          const list = clientRes.value.data || [];
          setClientsMap(Object.fromEntries(list.map((c) => [c.id, c.nom])));
        }
        if (docRes.status === 'fulfilled') setDocumentsCount((docRes.value.data || []).length);
      } catch (err) {
        setError("Impossible de charger les donnees");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-xl p-6 flex items-center gap-3">
        <ExclamationTriangleIcon className="w-6 h-6 text-red-500 dark:text-red-400" />
        <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
      </div>
    );
  }

  const s = erpMetrics || {};
  const clients = s.clients || {};
  const productsM = s.products || {};
  const ordersM = s.orders || {};
  const suppliers = s.suppliers || {};
  const quotes = s.quotes || {};
  const invoicesM = s.invoices || {};
  const paymentsM = s.payments || {};
  const warehouses = s.warehouses || {};
  const shipments = s.shipments || {};

  const fmt = (n) =>
    n === undefined || n === null ? '—' : n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
  const fmtMoney = (n) =>
    n === undefined || n === null ? '—' : `${fmt(n)} €`;

  const cards = [
    {
      title: 'Clients',
      value: clients.total ?? '—',
      to: '/erp/products',
      icon: UsersIcon,
      gradient: 'from-[#3B4BA8] to-[#5469D4]',
      sub: `${clients.actifs ?? 0} actifs`,
    },
    {
      title: 'Produits',
      value: productsM.total ?? '—',
      to: '/erp/products',
      icon: CubeIcon,
      gradient: 'from-emerald-500 to-teal-600',
      sub: `${fmt(productsM.stockTotal ?? 0)} en stock`,
    },
    {
      title: 'Commandes',
      value: ordersM.total ?? '—',
      to: '/erp/orders',
      icon: ShoppingCartIcon,
      gradient: 'from-violet-500 to-purple-600',
      sub: `${ordersM.enCours ?? 0} en cours · ${fmtMoney(ordersM.totalVentes)}`,
    },
    {
      title: 'Fournisseurs',
      value: suppliers.total ?? '—',
      to: '/erp/suppliers',
      icon: TruckIcon,
      gradient: 'from-amber-500 to-orange-600',
      sub: `${warehouses.total ?? 0} entrepôts`,
    },
  ];

  const financial = [
    {
      label: 'Devis',
      value: quotes.total ?? 0,
      detail: `${quotes.enAttente ?? 0} en attente`,
      icon: DocumentTextIcon,
      color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/40',
    },
    {
      label: 'Factures',
      value: invoicesM.total ?? 0,
      detail: `${fmtMoney(invoicesM.totalFacture)}`,
      icon: DocumentTextIcon,
      color: 'text-violet-600 bg-violet-100 dark:text-violet-400 dark:bg-violet-900/40',
    },
    {
      label: 'Payé',
      value: fmtMoney(invoicesM.totalPaye),
      detail: `${paymentsM.total ?? 0} paiements`,
      icon: CurrencyEuroIcon,
      color: 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/40',
    },
    {
      label: 'En retard',
      value: invoicesM.enRetard ?? 0,
      detail: `factures`,
      icon: ExclamationTriangleIcon,
      color: 'text-rose-600 bg-rose-100 dark:text-rose-400 dark:bg-rose-900/40',
    },
  ];

  const productBars = products.slice(0, 6).map((p) => ({
    label: p.label,
    value: p.stock,
    pct: Math.min(100, Math.round((p.stock / productsM.stockTotal) * 100) || 0),
  }));

  const maxStock = productsM.stockTotal || 1;

  const statusCounts = Object.entries(
    recentOrders.reduce((acc, o) => {
      const k = o.status || 'UNKNOWN';
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {})
  ).map(([status, count]) => ({ status, count }));

  const statusLabels = {
    DRAFT: 'Brouillon',
    PROCESSING: 'En cours',
    VALIDATED: 'Validée',
    SHIPPED: 'Livrée',
    EN_ATTENTE: 'En attente',
    EN_COURS: 'En cours',
    CONFIRMEE: 'Confirmée',
    LIVREE: 'Livrée',
    PAYEE: 'Payée',
    BROUILLON: 'Brouillon',
    ABANDONNEE: 'Abandonée',
    ANNULEE: 'Annulée',
    TERMINE: 'Terminé',
    UNKNOWN: 'Inconnu',
  };
  const clientName = (id) => clientsMap[id] || id;
  const displayedOrders = recentOrders.slice(0, 5);
  const displayedInvoices = recentInvoices.slice(0, 5);

  const statRows = [
    {
      label: 'Moteur',
      value: automation?.engine?.status ?? 'UP',
      ok: (automation?.engine?.status ?? 'UP') === 'UP',
      right: true,
    },
    { label: 'Règles actives', value: `${automation?.rules?.active ?? 0} / ${automation?.rules?.total ?? 0}` },
    { label: 'Workflows actifs', value: `${automation?.workflows?.active ?? 0} / ${automation?.workflows?.total ?? 0}` },
    { label: 'Expéditions en cours', value: `${shipments.enLivraison ?? 0} / ${shipments.total ?? 0}` },
  ];

  const moneyBar = () => {
    const max = Math.max(1, invoicesM.totalFacture || 0);
    const paidPct = Math.round(((invoicesM.totalPaye || 0) / max) * 100);
    const overduePct = Math.round(((invoicesM.enRetard || 0) / Math.max(1, invoicesM.total || 1)) * 100);
    return { paidPct: Math.min(100, paidPct), overduePct: Math.min(100, overduePct) };
  };
  const bar = moneyBar();

  const STATUS_COLORS = {
    BROUILLON: '#94a3b8',
    DRAFT: '#94a3b8',
    EN_ATTENTE: '#f59e0b',
    EN_COURS: '#3b82f6',
    CONFIRMEE: '#8b5cf6',
    PROCESSING: '#3b82f6',
    VALIDATED: '#10b981',
    VALIDE: '#10b981',
    LIVREE: '#10b981',
    PAYEE: '#10b981',
    ANNULEE: '#ef4444',
    ABANDONNEE: '#f43f5e',
    SHIPPED: '#14b8a6',
    TERMINE: '#10b981',
    UNKNOWN: '#94a3b8',
  };

  const orderPieData = Object.entries(
    recentOrders.reduce((acc, o) => {
      const k = o.status || 'AUTRE';
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name: statusLabels[name] || name, value, color: STATUS_COLORS[name] || '#6366f1' }));

  const invoicePieData = Object.entries(
    recentInvoices.reduce((acc, i) => {
      const k = i.status || 'AUTRE';
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name: statusLabels[name] || name, value, color: STATUS_COLORS[name] || '#6366f1' }));

  const productChartData = products.slice(0, 8).map((p) => ({
    name: p.label || p.ref,
    stock: Number(p.stock) || 0,
  }));

  const orderTrend = recentOrders
    .filter((o) => o.createdAt)
    .map((o) => {
      const ts = typeof o.createdAt === 'number' ? o.createdAt * 1000 : Date.parse(o.createdAt);
      const d = new Date(Number.isNaN(ts) ? Date.now() : ts);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      return { key, total: Number(o.total) || 0 };
    })
    .reduce((acc, o) => {
      acc[o.key] = (acc[o.key] || 0) + o.total;
      return acc;
    }, {});
  const orderTrendData = Object.entries(orderTrend)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, total]) => ({ month, total }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">Tableau de bord ERP</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Vue d'ensemble des activités ERP : clients, produits, commandes, factures, stocks.
          </p>
        </div>
        <span className={`self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full font-medium ${healthState === 'CONNECTED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : healthState === 'DEGRADED' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : healthState === 'UNAVAILABLE' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${healthState === 'CONNECTED' ? 'bg-emerald-500' : healthState === 'DEGRADED' ? 'bg-amber-500' : healthState === 'UNAVAILABLE' ? 'bg-red-500' : 'bg-slate-400'} animate-pulse`} />
          Adapter {erpHealth?.mode ?? 'DOLIBARR'} {healthState === 'CONNECTED' ? 'connecté' : healthState === 'DEGRADED' ? 'dégradé' : healthState === 'UNAVAILABLE' ? 'indisponible' : healthState === 'NOT_CONFIGURED' ? 'non configuré' : 'inconnu'} · données réelles
        </span>
      </div>

      <ErpErrorPanel errors={widgetErrors} />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              to={card.to}
              className="group relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600 transition-all overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{card.title}</p>
                  <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-2">{card.value}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{card.sub}</p>
                </div>
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-md shrink-0`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <ArrowTopRightOnSquareIcon className="absolute bottom-4 right-4 w-4 h-4 text-slate-300 group-hover:text-[#5469D4] transition-colors" />
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/60">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <CurrencyEuroIcon className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
              Finance
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {financial.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.label} className="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-xl">
                    <div className={`w-8 h-8 rounded-lg ${f.color} flex items-center justify-center mb-2`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{f.label}</p>
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{f.value}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">{f.detail}</p>
                  </div>
                );
              })}
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Paiements sur factures émises</p>
              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${bar.paidPct}%` }} />
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                {fmt(bar.paidPct)}% payé · {invoicesM.enRetard ?? 0} facture(s) en retard
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/60">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <ArchiveBoxIcon className="w-5 h-5 text-orange-500 dark:text-orange-400" />
              Stock par produit
            </h3>
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">{fmt(productsM.stockTotal ?? 0)} unités</span>
          </div>
          <div className="p-6 space-y-3">
            {productBars.length === 0 ? (
              <p className="text-slate-400 dark:text-slate-500 text-sm">Aucun produit</p>
            ) : (
              productBars.map((p) => (
                <div key={p.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">{p.label}</span>
                    <span className="text-slate-400 dark:text-slate-500">{fmt(p.value)}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#3B4BA8] to-[#5469D4] rounded-full"
                      style={{ width: `${Math.round((p.value / maxStock) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex justify-between text-xs text-slate-400 dark:text-slate-500">
              <span>Valeur du stock</span>
              <span className="font-semibold text-slate-600 dark:text-slate-300">{fmtMoney(productsM.valeurStock)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/60">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <ShoppingCartIcon className="w-5 h-5 text-violet-500 dark:text-violet-400" />
              Commandes par statut
            </h3>
            <Link to="/erp/orders" className="text-xs text-[#5469D4] hover:text-[#4355B9] font-medium">Voir tout</Link>
          </div>
          <div className="p-6 space-y-3">
            {statusCounts.map((it) => (
              <div key={it.status} className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">{statusLabels[it.status] || it.status.replace(/_/g, ' ')}</span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{it.count}</span>
              </div>
            ))}
            <div className="pt-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Volume de ventes</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{fmtMoney(ordersM.totalVentes)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/60">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <ShoppingCartIcon className="w-5 h-5 text-violet-500 dark:text-violet-400" />
              Répartition commandes par statut
            </h3>
            <Link to="/erp/orders" className="text-xs text-[#5469D4] hover:text-[#4355B9] font-medium">Voir tout</Link>
          </div>
          <div className="p-6 h-72">
            {orderPieData.length === 0 ? (
              <p className="text-slate-400 dark:text-slate-500 text-sm">Aucune commande</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={orderPieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="name" label>
                    {orderPieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} commande(s)`, '']} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#e2e8f0' }} labelStyle={{ color: '#cbd5e1' }} itemStyle={{ color: '#e2e8f0' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/60">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              Répartition factures par statut
            </h3>
            <Link to="/erp/invoices" className="text-xs text-[#5469D4] hover:text-[#4355B9] font-medium">Voir tout</Link>
          </div>
          <div className="p-6 h-72">
            {invoicePieData.length === 0 ? (
              <p className="text-slate-400 dark:text-slate-500 text-sm">Aucune facture</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={invoicePieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="name" label>
                    {invoicePieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} facture(s)`, '']} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#e2e8f0' }} labelStyle={{ color: '#cbd5e1' }} itemStyle={{ color: '#e2e8f0' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/60">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <CubeIcon className="w-5 h-5 text-teal-500 dark:text-teal-400" />
              Stock par produit (réel)
            </h3>
            <Link to="/erp/products" className="text-xs text-[#5469D4] hover:text-[#4355B9] font-medium">Voir tout</Link>
          </div>
          <div className="p-6 h-72">
            {productChartData.length === 0 ? (
              <p className="text-slate-400 dark:text-slate-500 text-sm">Aucun produit</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productChartData} layout="vertical" margin={{ left: 16, right: 16 }}>
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip formatter={(v) => [`${v}`, 'Stock']} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#e2e8f0' }} labelStyle={{ color: '#cbd5e1' }} itemStyle={{ color: '#e2e8f0' }} />
                  <Bar dataKey="stock" fill="#14b8a6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/60">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <CurrencyEuroIcon className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
              Évolution du CA (commandes, €)
            </h3>
            <Link to="/erp/orders" className="text-xs text-[#5469D4] hover:text-[#4355B9] font-medium">Voir tout</Link>
          </div>
          <div className="p-6 h-72">
            {orderTrendData.length === 0 ? (
              <p className="text-slate-400 dark:text-slate-500 text-sm">Aucune donnée</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={orderTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip formatter={(v) => [`${fmt(v)} €`, 'CA']} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#e2e8f0' }} labelStyle={{ color: '#cbd5e1' }} itemStyle={{ color: '#e2e8f0' }} />
                  <Area type="monotone" dataKey="total" stroke="#3B4BA8" fill="#5469D4" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/60">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <ShoppingCartIcon className="w-5 h-5 text-violet-500 dark:text-violet-400" />
              Dernières commandes
            </h3>
            <Link to="/erp/orders" className="text-sm text-[#5469D4] hover:text-[#4355B9] font-medium">Voir tout</Link>
          </div>
          <div className="px-6 py-4">
            {displayedOrders.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-sm">Aucune commande</p>
            ) : (
              <div className="overflow-x-auto -mx-2 px-2">
                <table className="w-full min-w-[480px]">
                  <thead>
                    <tr className="text-left text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/60">
                      <th className="pb-3 font-semibold">Réf</th>
                      <th className="pb-3 font-semibold">Client</th>
                      <th className="pb-3 font-semibold">Statut</th>
                      <th className="pb-3 font-semibold text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedOrders.map((o) => (
                      <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50/50 dark:hover:bg-slate-700/40">
                        <td className="py-3 font-mono text-sm font-medium text-slate-700 dark:text-slate-200">{o.ref}</td>
                        <td className="py-3 text-sm text-slate-700 dark:text-slate-200">{clientName(o.clientId)}</td>
                        <td className="py-3">
                          <span className="px-2.5 py-1 text-xs rounded-full font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                            {o.status}
                          </span>
                        </td>
                        <td className="py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 text-right">{fmtMoney(o.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/60">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              Dernières factures
            </h3>
            <Link to="/erp/invoices" className="text-sm text-[#5469D4] hover:text-[#4355B9] font-medium">Voir tout</Link>
          </div>
          <div className="px-6 py-4">
            {displayedInvoices.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-sm">Aucune facture</p>
            ) : (
              <div className="overflow-x-auto -mx-2 px-2">
                <table className="w-full min-w-[480px]">
                  <thead>
                    <tr className="text-left text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/60">
                      <th className="pb-3 font-semibold">Réf</th>
                      <th className="pb-3 font-semibold">Client</th>
                      <th className="pb-3 font-semibold">Statut</th>
                      <th className="pb-3 font-semibold text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedInvoices.map((i) => (
                      <tr key={i.id} className="border-b border-slate-50 hover:bg-slate-50/50 dark:hover:bg-slate-700/40">
                        <td className="py-3 font-mono text-sm font-medium text-slate-700 dark:text-slate-200">{i.ref}</td>
                        <td className="py-3 text-sm text-slate-700 dark:text-slate-200">{clientName(i.clientId)}</td>
                        <td className="py-3">
                          <span className="px-2.5 py-1 text-xs rounded-full font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                            {i.status}
                          </span>
                        </td>
                        <td className="py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 text-right">{fmtMoney(i.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/60">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <BoltIcon className="w-5 h-5 text-violet-500 dark:text-violet-400" />
              Automation
            </h3>
            <Link to="/automation" className="text-sm text-[#5469D4] hover:text-[#4355B9] font-medium">
              Voir tout
            </Link>
          </div>
          <div className="p-6">
            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {statRows.map((row) => (
                <div key={row.label} className="flex justify-between items-center py-3">
                  <span className="text-sm text-slate-500 dark:text-slate-400">{row.label}</span>
                  {row.right ? (
                    <span
                      className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                        row.ok ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                      }`}
                    >
                      {row.value}
                    </span>
                  ) : (
                    <span className={`font-semibold text-sm ${row.warn ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-100'}`}>
                      {row.value}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/60">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheckIcon className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
              État ERP Adapter
            </h3>
          </div>
          <div className="p-6">
            {erpHealth ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Statut global</span>
                  <span
                    className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                      healthState === 'CONNECTED'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : healthState === 'DEGRADED'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                          : healthState === 'UNAVAILABLE'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                            : healthState === 'NOT_CONFIGURED'
                              ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                    }`}
                  >
                    {erpHealth.status ?? 'INCONNU'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-xl">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Mode</p>
                    <p className="font-semibold text-slate-700 dark:text-slate-200">{erpHealth.mode ?? 'MOCK'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-xl">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Horodatage</p>
                    <p className="font-semibold text-slate-700 dark:text-slate-200 text-xs">{new Date(erpHealth.timestamp ?? Date.now()).toLocaleString('fr-FR')}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 dark:text-slate-500 text-sm">Indisponible</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/60">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ServerStackIcon className="w-5 h-5 text-[#5469D4]" />
            Derniers ERP ajoutés
          </h3>
          <Link to="/erps" className="text-sm text-[#5469D4] hover:text-[#4355B9] font-medium">
            Voir tout
          </Link>
        </div>
        <div className="px-6 py-4">
          {recentErps.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm">Aucun ERP enregistré</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/60">
                    <th className="pb-3 font-semibold">Code</th>
                    <th className="pb-3 font-semibold">Nom</th>
                    <th className="pb-3 font-semibold">Statut</th>
                    <th className="pb-3 font-semibold">Santé</th>
                  </tr>
                </thead>
                <tbody>
                  {recentErps.map((erp) => (
                    <tr key={erp.id} className="border-b border-slate-50 hover:bg-slate-50/50 dark:hover:bg-slate-700/40">
                      <td className="py-3 font-mono text-sm font-medium text-slate-700 dark:text-slate-200">{erp.code}</td>
                      <td className="py-3 text-slate-700 dark:text-slate-200">{erp.nom}</td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-medium ${
                            erp.status === 'active'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${erp.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {erp.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                            erp.healthStatus === 'healthy'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                              : erp.healthStatus === 'unknown'
                              ? 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                          }`}
                        >
                          {erp.healthStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { icon: ScaleIcon, label: 'Devis', value: quotes.total ?? '—', to: '/erp/quotes' },
          { icon: FolderOpenIcon, label: 'Documents', value: documentsCount ?? '—', to: '/erp/documents' },
          { icon: TruckIcon, label: 'Expéditions', value: shipments.total ?? '—', to: '/erp/shipments' },
          { icon: ArchiveBoxIcon, label: 'Entrepôts', value: warehouses.total ?? '—', to: '/erp/warehouses' },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <Link key={m.label} to={m.to} className="group flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-all">
              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 group-hover:bg-[#5469D4]/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-[#5469D4]" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{m.label}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{m.value} éléments</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default Dashboard;
