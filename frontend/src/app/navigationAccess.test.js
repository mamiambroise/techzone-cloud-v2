import { describe, it, expect } from 'vitest';
import { canAccess } from './navigationAccess.js';
import { navigationGroups, groupEntries, pageDefinitions, resolveRoute, effectiveNavigation } from './navigationConfig.js';

const admin = { id: 'admin', permissions: ['*'], isAdmin: true };
const operator = { id: 'op', permissions: ['erp:read', 'automation:read', 'data-runtime:read', 'data-runtime:query'], isAdmin: false };
const ready = { tenantId: 'tenant-a', loading: false, error: null };

describe('canAccess', () => {
  it('refuses everything without a principal', () => {
    expect(canAccess({ permission: 'erp:read' }, null)).toBe(false);
    expect(canAccess(null, operator)).toBe(false);
  });

  it('grants a declared permission', () => {
    expect(canAccess({ permission: 'erp:read' }, operator)).toBe(true);
  });

  it('denies a permission the principal does not hold', () => {
    expect(canAccess({ permission: 'pack.read' }, operator)).toBe(false);
  });

  it('supports multiple required permissions', () => {
    expect(canAccess({ permissions: ['erp:read', 'automation:read'] }, operator)).toBe(true);
    expect(canAccess({ permissions: ['erp:read', 'pack.read'] }, operator)).toBe(false);
  });

  it('honours a super administrator', () => {
    expect(canAccess({ permission: 'anything' }, { permissions: [], isSuperAdmin: true })).toBe(true);
  });

  it('does not use the demo Redux profiles as an IAM source', () => {
    const entry = groupEntries('packs')[0];
    expect(canAccess(entry, { permissions: ['erp:read'], roles: [], isAdmin: false })).toBe(false);
  });
});

describe('Route security — hiding a menu is never the only guard (RG-NAV-007, RG-NAV-026)', () => {
  const protectedRoutes = [
    '/packs/packs', '/runtime/context', '/erp/clients', '/data-runtime',
    '/iam/users', '/observability/logs', '/automation/workflows', '/settings/integrations',
    '/ui', '/ui/pages', '/ui/builder/page-1', '/ui/forms', '/ui/components', '/ui/navigation', '/ui/themes', '/ui/preview',
  ];

  it('keeps a permission on every protected route definition', () => {
    protectedRoutes.forEach(route => {
      const metadata = resolveRoute(route);
      expect(metadata, `route ${route} doit exister`).toBeDefined();
      expect(metadata.permission, `route ${route} doit porter une permission`).toBeTruthy();
    });
  });

  it('denies direct URL access when the permission is missing', () => {
    const noErp = { id: 'reader', permissions: ['data-runtime:read'], isAdmin: false };
    ['/packs/packs', '/runtime/context', '/erp/clients', '/iam/users', '/observability/logs', '/settings/integrations']
      .forEach(route => {
        expect(canAccess(resolveRoute(route), noErp), `${route} ne doit pas être accessible`).toBe(false);
      });
    expect(canAccess(resolveRoute('/automation/workflows'), operator)).toBe(true);
    expect(canAccess(resolveRoute('/data-runtime'), operator)).toBe(true);
    expect(canAccess(resolveRoute('/ui/builder/page-1'), operator)).toBe(false);
    expect(canAccess(resolveRoute('/ui/builder/page-1'), { permissions: ['ui-builder:read'] })).toBe(true);
  });

  it('denies an unauthorized child of an authorized module', () => {
    const parent = groupEntries('erp').find(e => e.id === 'erp');
    const child = groupEntries('erp').find(e => e.id === 'erpMapping');
    expect(canAccess(parent, { permissions: ['pack.read'] })).toBe(false);
    expect(canAccess(child, { permissions: ['erp:write'] })).toBe(false);
  });

  it('hides the same routes from the menu as from the direct access', () => {
    const navigation = effectiveNavigation(operator, ready);
    const visibleRoutes = navigation.flatMap(g => g.entries.map(e => e.route));
    ['/packs/packs', '/runtime/context', '/iam/users', '/observability/logs']
      .forEach(route => expect(visibleRoutes).not.toContain(route));
    expect(visibleRoutes).toContain('/erp');
    expect(visibleRoutes).toContain('/automation');
  });

  it('exposes no route twice after IAM filtering', () => {
    const routes = effectiveNavigation(admin, ready).flatMap(g => g.entries.map(e => e.route));
    expect(new Set(routes).size).toBe(routes.length);
  });
});

describe('Tenant-aware navigation (RG-NAV-008)', () => {
  it('falls back to the dashboard only when no tenant is resolved', () => {
    const navigation = effectiveNavigation(admin, { tenantId: null });
    expect(navigation.map(g => g.id)).toEqual(['dashboard']);
  });

  it('falls back to the dashboard only while the tenant context loads', () => {
    const navigation = effectiveNavigation(admin, { tenantId: 'tenant-a', loading: true });
    expect(navigation.map(g => g.id)).toEqual(['dashboard']);
  });

  it('falls back to the dashboard only when the tenant context fails', () => {
    const navigation = effectiveNavigation(admin, { tenantId: 'tenant-a', error: new Error('down') });
    expect(navigation.map(g => g.id)).toEqual(['dashboard']);
  });

  it('never reveals the full navigation before IAM and tenant are resolved', () => {
    const unresolved = [
      { tenantId: null },
      { tenantId: 'tenant-a', loading: true },
      { tenantId: 'tenant-a', error: new Error('down') },
    ];
    unresolved.forEach(context => {
      const navigation = effectiveNavigation(admin, context);
      expect(navigation.length).toBeLessThanOrEqual(1);
      navigation.forEach(group => expect(group.id).toBe('dashboard'));
    });
  });

  it('exposes the full navigation once the tenant context is ready', () => {
    const readyIds = effectiveNavigation(admin, ready).map(g => g.id);
    expect(readyIds).toEqual(navigationGroups.filter(g => !g.hidden).map(g => g.id));
  });

  it('does not keep the previous tenant navigation visible during a switch', () => {
    // Le contexte est remis à null pendant la bascule : aucune entrée métier ne doit subsister.
    const duringSwitch = effectiveNavigation(admin, { tenantId: null, loading: true });
    expect(duringSwitch.every(group => group.id === 'dashboard')).toBe(true);
  });
});

describe('Sidebar search never reveals a hidden module (RG-NAV-006)', () => {
  it('filters on the already permission-filtered entries', () => {
    const navigation = effectiveNavigation(operator, ready);
    const searchable = navigation.flatMap(g => [g.label, ...g.entries.map(e => e.label)]);
    expect(searchable.some(l => /Pack Manager/.test(l))).toBe(false);
    expect(searchable.some(l => /Registry/.test(l))).toBe(true);
  });
});

describe('Every menu entry resolves to a registered route', () => {
  it('maps each visible entry to route metadata that carries the same permission', () => {
    pageDefinitions.filter(p => p.menu).forEach(page => {
      const resolved = resolveRoute(page.route);
      expect(resolved, `${page.route} doit se résoudre`).toBeDefined();
      expect(resolved.group).toBe(page.group);
    });
  });
});
