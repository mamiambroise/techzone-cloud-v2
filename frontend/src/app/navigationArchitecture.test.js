import { describe, it, expect } from 'vitest';
import { navigationSections, navigationGroups, groupEntries, groupDestination, pageDefinitions, activeNavigation, resolveRoute, effectiveNavigation, redirects } from './navigationConfig.js';
import { ROUTES } from './routes.js';

const labelsOf = id => groupEntries(id).map(e => e.label);

describe('Global architecture (CDC §50)', () => {
  it('exposes exactly the five target sections in the target order', () => {
    expect(navigationSections.map(s => s.id)).toEqual([
      'accueil', 'construction', 'execution', 'integrations', 'platform',
    ]);
  });

  it('renders the modules of every section in the CDC order', () => {
    const rendered = navigationSections.map(section => ({
      section: section.id,
      modules: navigationGroups.filter(g => !g.hidden && g.section === section.id).map(g => g.id),
    }));
    expect(rendered).toEqual([
      { section: 'accueil', modules: ['dashboard'] },
      { section: 'construction', modules: ['bm', 'ui', 'automation', 'packs'] },
      { section: 'execution', modules: ['runtime'] },
      { section: 'integrations', modules: ['data', 'erp', 'api'] },
      { section: 'platform', modules: ['registry', 'environments', 'deployments', 'iam', 'observability', 'billing', 'admin'] },
    ]);
  });

  it('maps each module to its target section', () => {
    const expected = {
      dashboard: 'accueil',
      bm: 'construction', ui: 'construction', automation: 'construction', packs: 'construction',
      runtime: 'execution',
      data: 'integrations', erp: 'integrations', api: 'integrations',
      registry: 'platform', environments: 'platform', deployments: 'platform',
      iam: 'platform', observability: 'platform', billing: 'platform', admin: 'platform',
    };
    Object.entries(expected).forEach(([id, section]) => {
      expect(navigationGroups.find(g => g.id === id)?.section).toBe(section);
    });
  });

  it('keeps Registry as the first module of the platform section', () => {
    const platform = navigationGroups.filter(g => g.section === 'platform').map(g => g.id);
    expect(platform[0]).toBe('registry');
  });
});

describe('Stable ordering per module (RG-NAV-025)', () => {
  it.each([
    ['bm', ['Vue d’ensemble', 'Applications', 'Modèles de données', 'Fonctionnalités', 'Navigation', 'Configuration', 'Validation']],
    ['ui', ['Vue d’ensemble', 'Pages', 'Éditeur visuel', 'Composants', 'Formulaires', 'Navigation', 'Thème', 'Aperçu & Test']],
    ['automation', ['Vue d’ensemble', 'Workflows', 'Déclencheurs', 'Actions', 'Planifications', 'Exécutions', 'Modèles', 'Diagnostics', 'Règles', 'Formules']],
    ['packs', ['Vue d’ensemble', 'Packs', 'Versions', 'Modules', 'Fonctionnalités', 'Capacités', 'Dépendances', 'Règles', 'Validation & Manifest', 'Publication']],
    ['runtime', ['Vue d’ensemble', 'Contextes', 'Manifest', 'Résolution', 'Configuration effective', 'Cache', 'Diagnostics']],
    ['data', ['Vue d’ensemble', 'Sources', 'Modèles & Contrats', 'Requêtes', 'Politiques', 'Diagnostics', 'Historique']],
    ['erp', ['Vue d’ensemble', 'Ressources', 'Mappings', 'Synchronisations', 'Paramètres & diagnostics']],
    ['api', ['Vue d’ensemble', 'Connecteurs', 'Webhooks', 'Diagnostics']],
    ['deployments', ['Vue d’ensemble', 'Historique']],
    ['billing', ['Vue d’ensemble', 'Plans', 'Abonnements', 'Entitlements', 'Quotas', 'Facturation']],
    ['admin', ['Vue d’ensemble', 'Paramètres généraux', 'Profil']],
  ])('orders %s children as specified by the CDC', (group, expected) => {
    expect(labelsOf(group)).toEqual(expected);
  });
});

describe('No duplicated navigation (RG-NAV-010 à RG-NAV-016)', () => {
  it('never repeats a visible label inside a module', () => {
    navigationGroups.filter(g => !g.hidden).forEach(group => {
      const labels = labelsOf(group.id);
      expect(new Set(labels).size).toBe(labels.length);
    });
  });

  it('never repeats a route across the whole navigation definition', () => {
    const routes = pageDefinitions.map(p => p.route);
    expect(new Set(routes).size).toBe(routes.length);
  });

  it('does not expose Pack Runtime and keeps a single global Runtime', () => {
    expect(labelsOf('packs').some(l => /runtime/i.test(l))).toBe(false);
    const runtimeModules = navigationGroups.filter(g =>
      groupEntries(g.id).some(e => /runtime/i.test(e.label)) && g.id !== 'runtime');
    expect(runtimeModules).toEqual([]);
    expect(labelsOf('runtime')[0]).toBe('Vue d’ensemble');
  });

  it('does not split Data Platform and Data Runtime into two modules', () => {
    expect(navigationGroups.filter(g => /Donn/i.test(g.label))).toHaveLength(1);
    expect(navigationGroups.find(g => g.id === 'data').label).toBe('Données');
  });

  it('does not show Dolibarr twice', () => {
    const visible = navigationGroups.filter(g => !g.hidden).flatMap(g => [g.label, ...labelsOf(g.id)]);
    expect(visible.filter(l => /dolibarr/i.test(l))).toEqual(['ERP / Dolibarr']);
  });

  it('keeps publication in Pack Manager and out of Business Manager', () => {
    expect(labelsOf('packs')).toContain('Publication');
    expect(labelsOf('bm').some(l => /publication/i.test(l))).toBe(false);
  });

  it('keeps ERP functional screens inside the workspace instead of the global sidebar', () => {
    const menu = groupEntries('erp').map(e => e.route);
    ['/erp/clients', '/erp/products', '/erp/orders', '/erp/invoices', '/erp/stocks'].forEach(route => {
      expect(menu).not.toContain(route);
    });
    // Les routes existent toujours et restent protégées par erp:read.
    ['/erp/clients', '/erp/products', '/erp/orders', '/erp/invoices', '/erp/stocks'].forEach(route => {
      const metadata = resolveRoute(route);
      expect(metadata?.permission).toBe('erp:read');
      expect(metadata?.menu).toBe(false);
    });
  });
});

describe('Active route and parent route (RG-NAV-019, RG-NAV-020)', () => {
  it.each([
    ['/packs', 'packs'],
    ['/packs/packs', 'pmpacks'],
    ['/packs/packs?pack=pack-1', 'pmpacks'],
    ['/packs/validation?pack=pack-1&version=v1', 'pmvalidation'],
    ['/packs/publication', 'pmpublication'],
    ['/runtime/cache', 'runtimecache'],
    ['/runtime', 'runtime'],
    ['/business-manager', 'bm'],
    ['/business-manager/applications/app-1', 'bmApplications'],
    ['/business-manager/applications/app-1/versions', 'bmApplications'],
    ['/business-manager/applications/app-1/versions/v1', 'bmApplications'],
    ['/business-manager/applications/app-1/versions/v1/validation', 'bmQuality'],
    ['/erp', 'erp'],
    ['/erp/clients', 'erpResources'],
    ['/erp/orders', 'erpResources'],
    ['/erp/invoices', 'erpResources'],
    ['/erp/anything-else', 'erpResources'],
    ['/erp/mappings', 'erpMapping'],
    ['/erp/ressources', 'erpResources'],
    ['/erps/create', 'erpRegistry'],
    ['/erps/edit/connector-1', 'erpRegistry'],
    ['/data-runtime', 'dataRuntime'],
    ['/data-runtime/query', 'dataQuery'],
    ['/data-runtime/history', 'data-runtime-history'],
    ['/ui', 'ui'],
    ['/ui/pages', 'uiPages'],
    ['/ui/builder/page-7', 'uiBuilder'],
    ['/automation', 'automation'],
    ['/automation/workflows', 'automationWorkflows'],
    ['/automation/executions', 'automationExecutions'],
    ['/automation/conditions', 'automationRules'],
  ])('resolves the active entry of %s', (path, id) => {
    expect(activeNavigation(path)?.id).toBe(id);
  });

  it('keeps the deep route resolvable and grouped for every registered deep link', () => {
    ['/packs/validation', '/erp/clients', '/business-manager/applications/a/versions/v1/validation', '/ui/builder/p', '/erps/edit/x']
      .forEach(path => {
        const resolved = resolveRoute(path);
        expect(resolved).toBeDefined();
        expect(navigationGroups.find(g => g.id === resolved.group)).toBeDefined();
        expect(activeNavigation(path).group).toBe(resolved.group);
      });
  });

  it('returns undefined for an unknown route so 404 can be rendered', () => {
    expect(resolveRoute('/nope/nowhere')).toBeUndefined();
    expect(activeNavigation('/nope/nowhere')).toBeUndefined();
  });
});

describe('Deep-link aliases for renamed parent routes', () => {
  it.each([
    ['/packs/manager', '/packs/packs'],
    ['/packs/runtime', '/runtime'],
    ['/automation/history', '/automation/executions'],
    ['/data', '/data-runtime'],
    ['/', '/dashboard'],
  ])('redirects %s to %s', (from, to) => {
    expect(redirects).toContainEqual({ from, to });
  });
});

describe('Module availability (RG-NAV-017, RG-NAV-018)', () => {
  it('renders every unimplemented menu entry through ComingSoon', () => {
    pageDefinitions.filter(p => p.menu && p.implemented === false).forEach(page => {
      expect(page.component).toBe('ComingSoon');
      expect(page.status).toBe('NOT_IMPLEMENTED');
    });
  });

  it('never invents a status outside the supported set', () => {
    const supported = ['PARTIAL', 'REAL', 'NOT_IMPLEMENTED'];
    pageDefinitions.forEach(page => {
      expect(supported).toContain(page.status);
    });
  });

  it('gives every ComingSoon entry an explicit description', () => {
    pageDefinitions.filter(p => p.component === 'ComingSoon').forEach(page => {
      expect(page.description).toBeTruthy();
    });
  });

  it('never sends a ComingSoon page back to another ComingSoon page', () => {
    const dashboard = ROUTES.dashboard;
    const backTargetOf = groupId => {
      const home = groupDestination(groupId);
      const real = Boolean(home) && resolveRoute(home)?.implemented === true;
      return real ? home : dashboard;
    };

    pageDefinitions
      .filter(p => p.component === 'ComingSoon')
      .forEach(page => {
        const target = backTargetOf(page.group);
        // The target must be a real, reachable page — never another placeholder.
        expect(resolveRoute(target)?.implemented).toBe(true);
      });
  });

  it('uses the module home as ComingSoon back-link when that home is implemented', () => {
    [
      ['erp', '/erp'],
      ['automation', '/automation'],
      ['data', '/data-runtime'],
      ['ui', '/ui'],
      ['billing', '/billing/overview'],
    ].forEach(([id, route]) => {
      expect(groupDestination(id)).toBe(route);
      expect(resolveRoute(route).implemented).toBe(true);
    });
  });

  it('falls back to the dashboard for fully planned modules', () => {
    ['admin'].forEach(id => {
      expect(resolveRoute(groupDestination(id))?.implemented).toBe(false);
      expect(resolveRoute(ROUTES.dashboard).implemented).toBe(true);
    });
  });
});

describe('IAM filtering of the navigation', () => {
  it('hides a module whose permission the user lacks', () => {
    const navigation = effectiveNavigation({ permissions: ['automation:read'] }, { tenantId: 't1' });
    const ids = navigation.map(g => g.id);
    expect(ids).toContain('automation');
    expect(ids).not.toContain('packs');
    expect(ids).not.toContain('runtime');
  });

  it('never returns a module with zero visible entries', () => {
    effectiveNavigation({ permissions: ['erp:read'] }, { tenantId: 't1' }).forEach(group => {
      expect(group.entries.length).toBeGreaterThan(0);
    });
  });
});
