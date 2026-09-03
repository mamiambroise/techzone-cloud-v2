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
          { path: '/iam/overview', label: "Vue d'ensemble", disabled: true },
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
          { path: '/organisations', label: 'Organisations & Tenants', disabled: true },
          { path: '/roles', label: 'Rôles & Permissions', disabled: true },
          { path: '/policies', label: 'Accès & Policies', disabled: true },
          { path: '/sessions', label: 'Sessions & Sécurité', disabled: true },
          { path: '/contexts', label: 'Contextes', disabled: true },
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

function Icon({ name, size = 18 }) {
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