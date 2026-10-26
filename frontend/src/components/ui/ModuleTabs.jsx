import React from 'react';
import { Link } from 'react-router-dom';
import { resolveNavigationIcon } from '../../app/navigationIcons.js';

/** Shared, route-backed second-level navigation for Techzone modules. */
export default function ModuleTabs({ tabs, activeId, ariaLabel, className = '' }) {
  if (!tabs?.length) return null;

  return (
    <nav aria-label={ariaLabel} className={`tz-module-tabs tz-scroll-x ${className}`}>
      <div className="tz-module-tabs__list" role="list">
        {tabs.map((tab, index) => {
          const Icon = tab.icon ? resolveNavigationIcon(tab.icon) : null;
          const active = tab.id === activeId;
          return (
            <Link
              key={tab.id}
              to={tab.route}
              aria-current={active ? 'page' : undefined}
              className={`tz-module-tab ${active ? 'is-active' : ''}`}
              style={{ '--tab-accent': tab.accent || `var(--accent-${(index % 7) + 1})` }}
            >
              {Icon ? <Icon size={16} aria-hidden="true" /> : null}
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
