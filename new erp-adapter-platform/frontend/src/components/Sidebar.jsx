import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Squares2X2Icon,
  ServerStackIcon,
  CubeTransparentIcon,
  BoltIcon,
  FolderOpenIcon,
  ClockIcon,
  CpuChipIcon,
  ScaleIcon,
  ArrowPathRoundedSquareIcon,
  PuzzlePieceIcon,
  Cog6ToothIcon,
  XMarkIcon,
  Bars3Icon,
  UsersIcon,
  CubeIcon,
  ShoppingCartIcon,
  CurrencyEuroIcon,
  TruckIcon,
  DocumentTextIcon,
  ArchiveBoxIcon,
  ShieldCheckIcon,
  LinkIcon,
  UserCircleIcon,
  TagIcon,
  WrenchScrewdriverIcon,
  ArrowsRightLeftIcon,
  ClipboardDocumentListIcon,
  BellAlertIcon,
  ArrowPathIcon,
  PercentBadgeIcon,
  BanknotesIcon,
  CreditCardIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../auth/AuthContext';

const navGroups = [
  {
    label: 'Général',
    items: [
      { path: '/', label: 'Tableau de bord', icon: Squares2X2Icon, end: true },
      { path: '/erps', label: 'ERP Registry', icon: ServerStackIcon },
    ],
  },
  {
    label: 'ERP · Dolibarr',
    items: [
      { path: '/erp/clients', label: 'Clients', icon: UsersIcon },
      { path: '/erp/products', label: 'Produits', icon: CubeIcon },
      { path: '/erp/product-variants', label: 'Variantes', icon: TagIcon },
      { path: '/erp/services', label: 'Services', icon: WrenchScrewdriverIcon },
      { path: '/erp/orders', label: 'Commandes', icon: ShoppingCartIcon },
      { path: '/erp/quotes', label: 'Devis', icon: DocumentTextIcon },
      { path: '/erp/invoices', label: 'Factures', icon: CurrencyEuroIcon },
      { path: '/erp/payments', label: 'Paiements', icon: CurrencyEuroIcon },
      { path: '/erp/suppliers', label: 'Fournisseurs', icon: TruckIcon },
      { path: '/erp/warehouses', label: 'Entrepôts', icon: ArchiveBoxIcon },
      { path: '/erp/shipments', label: 'Expéditions', icon: TruckIcon },
      { path: '/erp/documents', label: 'Documents', icon: DocumentTextIcon },
      { path: '/erp/purchases', label: 'Achats', icon: ShoppingCartIcon },
      { path: '/erp/stock-movements', label: 'Mouvements de stock', icon: ArrowPathRoundedSquareIcon },
      { path: '/erp/stock-transfers', label: 'Transferts', icon: ArrowsRightLeftIcon },
      { path: '/erp/inventories', label: 'Inventaires', icon: ClipboardDocumentListIcon },
      { path: '/erp/stock-alerts', label: 'Alertes stock', icon: BellAlertIcon },
      { path: '/erp/returns', label: 'Retours', icon: ArrowPathIcon },
      { path: '/erp/promotions', label: 'Promotions', icon: PercentBadgeIcon },
      { path: '/erp/cash-registers', label: 'Caisses', icon: BanknotesIcon },
      { path: '/erp/expenses', label: 'Depenses', icon: CreditCardIcon },
      { path: '/erp/reservations', label: 'Reservations', icon: CalendarDaysIcon },
      { path: '/erp/projects', label: 'Projets', icon: FolderOpenIcon },
      { path: '/erp/agenda', label: 'Agenda', icon: ClockIcon },
    ],
  },
  {
    label: 'Intégration',
    items: [
      { path: '/adapters', label: 'Adapters', icon: CubeTransparentIcon },
      { path: '/mapping', label: 'Mapping', icon: BoltIcon },
    ],
  },
  {
    label: 'Data Runtime',
    items: [
      { path: '/data-runtime', label: 'Ressources', icon: FolderOpenIcon },
      { path: '/data-runtime/history', label: 'Historique', icon: ClockIcon },
    ],
  },
  {
    label: 'Automation',
    items: [
      { path: '/automation', label: 'Cockpit', icon: CpuChipIcon },
      { path: '/automation/rules', label: 'Règles', icon: ScaleIcon },
      { path: '/automation/workflows', label: 'Workflows', icon: ArrowPathRoundedSquareIcon },
      { path: '/automation/triggers', label: 'Triggers', icon: BoltIcon },
      { path: '/automation/conditions', label: 'Conditions', icon: PuzzlePieceIcon },
      { path: '/automation/history', label: 'Historique', icon: ClockIcon },
    ],
  },
  {
    label: 'IAM',
    items: [
      { path: '/iam', label: 'Vue d\'ensemble', icon: ShieldCheckIcon, end: true },
      { path: '/iam/users', label: 'Utilisateurs', icon: UsersIcon },
      { path: '/iam/sessions', label: 'Sessions', icon: LinkIcon },
      { path: '/iam/profile', label: 'Mon profil', icon: UserCircleIcon },
    ],
  },
  {
    label: 'Système',
    items: [{ path: '/settings', label: 'Paramètres', icon: Cog6ToothIcon }],
  },
];

function Sidebar({ isOpen, onToggle, mobileOpen = false }) {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (item) =>
    item.end
      ? location.pathname === item.path
      : location.pathname.startsWith(item.path);

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-[#0B132B] text-slate-300 shadow-xl z-50 flex flex-col transition-all duration-300 w-64 ${
        isOpen ? 'lg:w-64' : 'lg:w-[68px]'
      } ${
        mobileOpen
          ? 'translate-x-0'
          : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-slate-800/60 shrink-0">
        {isOpen ? (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3B4BA8] to-[#5469D4] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9.563C9 9.252 9.252 9 9.563 9h4.874c.311 0 .563.252.563.563v4.874c0 .311-.252.563-.563.563H9.564A.562.562 0 019 14.437V9.564z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">ERP ADAPTER</h1>
              <p className="text-[10px] text-slate-400">Plateforme de gestion</p>
            </div>
          </div>
        ) : null}
        <button
          onClick={onToggle}
          className="hidden lg:inline-flex text-slate-400 hover:text-white p-1 rounded transition-colors"
          title={isOpen ? 'Replier' : 'Déplier'}
        >
          {isOpen ? (
            <XMarkIcon className="w-5 h-5" />
          ) : (
            <Bars3Icon className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            {isOpen && (
              <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {group.label}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center rounded-lg px-3 py-2 text-sm transition-colors ${
                      active
                        ? 'bg-[#5469D4] text-white font-medium shadow-sm shadow-[#5469D4]/40'
                        : 'text-slate-300 hover:bg-white/5 hover:text-[#5469D4]'
                    }`}
                    title={isOpen ? undefined : item.label}
                  >
                    <Icon className={`w-5 h-5 mr-3 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                    {isOpen && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Profil */}
      {isOpen && (
        <div className="shrink-0 p-4 border-t border-slate-800/60">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3B4BA8] to-[#5469D4] flex items-center justify-center text-sm font-bold text-white">
              {((user?.firstName?.[0] || '') + (user?.lastName?.[0] || '') || user?.username?.[0] || 'A').toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.firstName || user?.username || 'Admin'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.primaryEmail || user?.username || 'admin@erp.local'}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
