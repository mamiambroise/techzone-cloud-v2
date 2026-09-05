import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const menuSections = [
  {
    title: 'DASHBOARD',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: 'home' },
      { path: '/todos', label: 'À faire', icon: 'home', badge: '6' },
    ],
  },
  {
    title: 'PLATEFORME',
    groups: [
      {
        title: 'Platform Foundation',
        items: [
          { path: '/platform/overview', label: 'Vue d\'ensemble', disabled: true },
          { path: '/platform/apps', label: 'Applications & Versions', disabled: true },
          { path: '/platform/envs', label: 'Environnements', disabled: true },
          { path: '/platform/contracts', label: 'Contrats', disabled: true },
          { path: '/platform/config', label: 'Configuration', disabled: true },
          { path: '/platform/snapshots', label: 'Snapshots & Historique', disabled: true },
        ],
      },
      {
        title: 'Auth + IAM + Context',
        defaultOpen: true,
        items: [
          { path: '/iam/overview', label: "Vue d'ensemble" },
          {
            title: 'Utilisateurs & Identités',
            defaultOpen: true,
            items: [
              { path: '/users', label: 'Utilisateurs' },
              { path: '/identities', label: 'Identités' },
              { path: '/identity-links', label: 'Liaisons Identité ERP' },
              { path: '/identity-groups', label: "Groupes d'identités" },
            ],
          },
          {
            title: 'Organisations & Tenants',
            defaultOpen: false,
            items: [
              { path: '/organisations', label: 'Organisations' },
              { path: '/tenants', label: 'Tenants' },
            ],
          },
          { path: '/roles', label: 'Rôles & Permissions' },
          { path: '/policies', label: 'Accès & Policies' },
          { path: '/sessions', label: 'Sessions & Sécurité' },
          { path: '/contexts', label: 'Contextes' },
        ],
      },
      {
        title: 'Observability & Security',
        items: [
          { path: '/obs/overview', label: 'Vue d\'ensemble', disabled: true },
          { path: '/obs/logs', label: 'Logs', disabled: true },
          { path: '/obs/metrics', label: 'Métriques', disabled: true },
        ],
      },
    ],
  },
  {
    title: 'CONCEPTION',
    groups: [
      {
        title: 'Business Manager',
        items: [
          { path: '/conception/business', label: 'Business Manager', disabled: true },
        ],
      },
      {
        title: 'Pack Manager',
        items: [
          { path: '/conception/packs', label: 'Pack Manager', disabled: true },
        ],
      },
    ],
  },
  {
    title: 'ERP & RUNTIME',
    groups: [
      {
        title: 'ERP Adapter',
        items: [
          { path: '/erps', label: 'ERP Adapter', disabled: true },
        ],
      },
      {
        title: 'Runtime',
        items: [
          { path: '/runtime', label: 'Runtime', disabled: true },
        ],
      },
    ],
  },
  {
    title: 'AUTOMATION',
    groups: [
      {
        title: 'Rules & Workflows',
        items: [
          { path: '/automation/rules', label: 'Rules & Workflows', disabled: true },
        ],
      },
    ],
  },
  {
    title: 'LIVRAISON',
    groups: [
      {
        title: 'Integrations',
        items: [
          { path: '/delivery/integrations', label: 'Integrations', disabled: true },
        ],
      },
      {
        title: 'Publication & Deployment',
        items: [
          { path: '/delivery/publication', label: 'Publication & Deployment', disabled: true },
        ],
      },
    ],
  },
];

function GroupIcon({ name, size = 16 }) {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (name === 'platform') {
    return (
      <svg {...props}>
        <rect x="2" y="3" width="20" height="6" rx="1" />
        <rect x="2" y="11" width="20" height="6" rx="1" />
      </svg>
    );
  }
  if (name === 'platform-foundation') {
    return (
      <svg {...props}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    );
  }
  if (name === 'iam') {
    return (
      <svg {...props}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    );
  }
  if (name === 'observability') {
    return (
      <svg {...props}>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  if (name === 'conception') {
    return (
      <svg {...props}>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
      </svg>
    );
  }
  if (name === 'business') {
    return (
      <svg {...props}>
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
      </svg>
    );
  }
  if (name === 'pack') {
    return (
      <svg {...props}>
        <path d="M16.5 9.5l-9-5L3 7v10l4.5 2.5 9-5V7l-4.5-2.5z" />
        <path d="M12 17l4.5-2.5" />
        <path d="M12 17v-7" />
        <path d="M7.5 14.5L12 17" />
      </svg>
    );
  }
  if (name === 'erp') {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l-.06-.06a1.65 1.65 0 004.68 15a1.65 1.65 0 001.51-1H3a2 2 0 01-2-2h.09a1.65 1.65 0 001.51 1z" />
      </svg>
    );
  }
  if (name === 'runtime') {
    return (
      <svg {...props}>
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    );
  }
  if (name === 'automation') {
    return (
      <svg {...props}>
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    );
  }
  if (name === 'workflows') {
    return (
      <svg {...props}>
        <line x1="6" y1="3" x2="6" y2="15" />
        <circle cx="18" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <path d="M18 9a9 9 0 01-9 9" />
      </svg>
    );
  }
  if (name === 'delivery') {
    return (
      <svg {...props}>
        <path d="M4.5 16.5c-1.5 1.26-2 2-2 2s3.5-.5 6-3.5c1.5-1.5 2.5-3 2.5-3s3 1 4.5 3.5c1 1.5 1.5 3 1.5 3" />
        <path d="M12 15l-3-3" />
        <path d="M15 12l3-3" />
      </svg>
    );
  }
  if (name === 'integrations') {
    return (
      <svg {...props}>
        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
      </svg>
    );
  }
  if (name === 'publication') {
    return (
      <svg {...props}>
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    );
  }
  return null;
}

function Icon({ name, size = 16 }) {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (name === 'home') {
    return (
      <svg {...props}>
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    );
  }
  if (name === 'chevron-down') {
    return (
      <svg {...props}>
        <polyline points="6 9 12 15 18 9" />
      </svg>
    );
  }
  if (name === 'chevron-right') {
    return (
      <svg {...props}>
        <polyline points="9 18 15 12 9 6" />
      </svg>
    );
  }
  return null;
}

function Sidebar({ isOpen, onToggle }) {
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState(() => {
    const initial = {};
    menuSections.forEach((section) => {
      section.groups?.forEach((group) => {
        if (group.defaultOpen) initial[group.title] = true;
      });
    });
    return initial;
  });

  const toggleGroup = (title) => {
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const groupIconName = (title) => {
    const normalized = title.toLowerCase();
    if (normalized.includes('plateforme') || normalized.includes('platform')) return 'platform';
    if (normalized.includes('platform foundation')) return 'platform-foundation';
    if (normalized.includes('auth')) return 'iam';
    if (normalized.includes('observability') || normalized.includes('security')) return 'observability';
    if (normalized.includes('conception')) return 'conception';
    if (normalized.includes('business manager')) return 'business';
    if (normalized.includes('pack manager')) return 'pack';
    if (normalized.includes('erp') && normalized.includes('runtime')) return 'erp';
    if (normalized.includes('erp adapter')) return 'erp';
    if (normalized.includes('runtime')) return 'runtime';
    if (normalized.includes('automation')) return 'automation';
    if (normalized.includes('rules')) return 'workflows';
    if (normalized.includes('livraison')) return 'delivery';
    if (normalized.includes('integrations')) return 'integrations';
    if (normalized.includes('publication')) return 'publication';
    return null;
  };

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          {isOpen && (
            <div className="sidebar-brand-text">
              <span className="sidebar-title">TECHZONE CLOUD</span>
              <span className="sidebar-subtitle">ADMIN</span>
            </div>
          )}
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuSections.map((section) => (
          <div key={section.title} className="sidebar-section">
            {isOpen && <div className="sidebar-section-title">{section.title}</div>}
            {section.items && !section.groups && (
              <div className="sidebar-items">
                {section.items.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`sidebar-item ${isActive(item.path) ? 'sidebar-item-active' : ''}`}
                    title={item.label}
                  >
                    <span className="sidebar-item-icon"><Icon name={item.icon} /></span>
                    {isOpen && <span className="sidebar-item-label">{item.label}</span>}
                    {item.badge && isOpen && <span className="sidebar-badge">{item.badge}</span>}
                  </Link>
                ))}
              </div>
            )}
            {section.groups && (
              <div className="sidebar-groups">
                {section.groups.map((group) => (
                  <div key={group.title} className="sidebar-group">
                    <button
                      type="button"
                      className={`sidebar-group-title ${openGroups[group.title] ? 'sidebar-group-open' : ''}`}
                      onClick={() => toggleGroup(group.title)}
                      title={isOpen ? group.title : ''}
                    >
                      {isOpen && <span className="sidebar-group-icon"><GroupIcon name={groupIconName(group.title)} size={16} /></span>}
                      {isOpen && <span className="sidebar-group-label">{group.title}</span>}
                      {isOpen && <span className={`sidebar-group-chevron ${openGroups[group.title] ? 'sidebar-group-chevron-open' : ''}`}><Icon name="chevron-down" size={14} /></span>}
                      {!isOpen && <span className="sidebar-item-icon"><Icon name={group.title === 'Dashboard' ? 'home' : 'chevron-right'} /></span>}
                    </button>
                    {openGroups[group.title] && isOpen && (
                      <div className="sidebar-group-items">
                        {group.items.map((item) => {
                          if (item.items) {
                            return (
                              <div key={item.title} className="sidebar-group">
                                <button
                                  type="button"
                                  className={`sidebar-group-title sidebar-group-title-nested ${openGroups[item.title] ? 'sidebar-group-open' : ''}`}
                                  onClick={() => toggleGroup(item.title)}
                                  title={isOpen ? item.title : ''}
                                >
                                  {isOpen && <span className="sidebar-group-icon"><GroupIcon name={groupIconName(item.title)} size={16} /></span>}
                                  {isOpen && <span className="sidebar-group-label">{item.title}</span>}
                                  {isOpen && <span className={`sidebar-group-chevron ${openGroups[item.title] ? 'sidebar-group-chevron-open' : ''}`}><Icon name="chevron-down" size={14} /></span>}
                                  {!isOpen && <span className="sidebar-item-icon"><Icon name="chevron-right" /></span>}
                                </button>
                                {openGroups[item.title] && isOpen && (
                                  <div className="sidebar-group-items">
                                    {item.items.map((subItem) => (
                                      <Link
                                        key={subItem.path}
                                        to={subItem.disabled ? '#' : subItem.path}
                                        className={`sidebar-item sidebar-item-sub ${isActive(subItem.path) ? 'sidebar-item-active' : ''} ${subItem.disabled ? 'sidebar-item-disabled' : ''}`}
                                        title={subItem.label}
                                        onClick={(e) => subItem.disabled && e.preventDefault()}
                                      >
                                        <span className="sidebar-item-dot" />
                                        <span className="sidebar-item-label">{subItem.label}</span>
                                        {subItem.badge && isOpen && <span className="sidebar-badge">{subItem.badge}</span>}
                                      </Link>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return (
                            <Link
                              key={item.path}
                              to={item.disabled ? '#' : item.path}
                              className={`sidebar-item sidebar-item-sub ${isActive(item.path) ? 'sidebar-item-active' : ''} ${item.disabled ? 'sidebar-item-disabled' : ''}`}
                              title={item.label}
                              onClick={(e) => item.disabled && e.preventDefault()}
                            >
                              <span className="sidebar-item-dot" />
                              <span className="sidebar-item-label">{item.label}</span>
                              {item.badge && isOpen && <span className="sidebar-badge">{item.badge}</span>}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button type="button" className="sidebar-collapse-btn" onClick={onToggle} title={isOpen ? 'Réduire le menu' : 'Développer le menu'}>
          <Icon name="chevron-right" size={16} />
          {isOpen && <span>Réduire le menu</span>}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;