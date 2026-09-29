import { describe, it, expect } from 'vitest';
import { ROUTES } from './routes.js';
import { navigationSections, navigationGroups, pageDefinitions, legacyRedirects, resolveRoute, groupEntries } from './navigationConfig.js';

describe('ROUTES', () => {
  it('has all BM routes defined', () => {
    expect(ROUTES.bm).toBe('/business-manager');
    expect(ROUTES.bmApplications).toBe('/business-manager/applications');
    expect(ROUTES.bmApplicationNew).toBe('/business-manager/applications/new');
    expect(ROUTES.bmApplicationDetail).toBe('/business-manager/applications/:applicationId');
    expect(ROUTES.bmVersions).toBe('/business-manager/applications/:applicationId/versions');
    expect(ROUTES.bmVersionDetail).toBe('/business-manager/applications/:applicationId/versions/:versionId');
    expect(ROUTES.bmDataModel).toBe('/business-manager/applications/:applicationId/versions/:versionId/data-model');
    expect(ROUTES.bmFeatures).toBe('/business-manager/applications/:applicationId/versions/:versionId/features');
    expect(ROUTES.bmNavigation).toBe('/business-manager/applications/:applicationId/versions/:versionId/navigation');
    expect(ROUTES.bmConfiguration).toBe('/business-manager/configuration');
    expect(ROUTES.bmRuntime).toBe('/business-manager/applications/:applicationId/versions/:versionId/runtime');
    expect(ROUTES.bmValidation).toBe('/business-manager/applications/:applicationId/versions/:versionId/validation');
  });
});

describe('navigationSections', () => {
  it('has accueil, construction, execution, integrations, platform sections', () => {
    const sectionIds = navigationSections.map(s => s.id);
    expect(sectionIds).toContain('accueil');
    expect(sectionIds).toHaveLength(5);
    expect(sectionIds).toContain('construction');
    expect(sectionIds).toContain('execution');
    expect(sectionIds).toContain('integrations');
    expect(sectionIds).toContain('platform');
  });
});

describe('navigationGroups', () => {
  it('has bm group mapped to construction section', () => {
    const bmGroup = navigationGroups.find(g => g.id === 'bm');
    expect(bmGroup).toBeDefined();
    expect(bmGroup.section).toBe('construction');
    expect(bmGroup.icon).toBe('BriefcaseBusiness');
  });

  it('has runtime group mapped to execution section', () => {
    const runtimeGroup = navigationGroups.find(g => g.id === 'runtime');
    expect(runtimeGroup).toBeDefined();
    expect(runtimeGroup.section).toBe('execution');
  });

  it('has data, erp, api groups mapped to integrations section', () => {
    ['data', 'erp', 'api'].forEach(id => {
      const group = navigationGroups.find(g => g.id === id);
      expect(group).toBeDefined();
      expect(group.section).toBe('integrations');
    });
  });

  it('has environments, deployments, iam, observability, billing, admin groups mapped to platform section', () => {
    ['environments', 'deployments', 'iam', 'observability', 'billing', 'admin'].forEach(id => {
      const group = navigationGroups.find(g => g.id === id);
      expect(group).toBeDefined();
      expect(group.section).toBe('platform');
    });
  });
});

describe('pageDefinitions', () => {
  it('includes BM route definitions', () => {
    const bmPages = pageDefinitions.filter(p => p.group === 'bm');
    expect(bmPages.length).toBeGreaterThan(0);

    const ids = bmPages.map(p => p.id);
    expect(ids).toContain('bm');
    expect(ids).toContain('bmApplications');
    expect(ids).toContain('bmApplicationNew');
    expect(ids).toContain('bmApplicationDetail');
    expect(ids).toContain('bmVersions');
    expect(ids).toContain('bmVersionDetail');
  });

  it('phase 4-9 routes are not yet implemented', () => {
    const notImpl = pageDefinitions.filter(p => p.phase && !p.implemented);
    notImpl.forEach(p => {
      expect(p.implemented).toBe(false);
    });
  });
});

describe('legacyRedirects', () => {
  it('maps /business paths to /business-manager paths', () => {
    const redirects = legacyRedirects.filter(r => r.from.startsWith('/business'));
    expect(redirects).toContainEqual({ from: '/business', to: '/business-manager' });
    expect(redirects).toContainEqual({ from: '/business/models', to: '/business-manager/models' });
    expect(redirects).toContainEqual({ from: '/business/configuration', to: '/business-manager/configuration' });
    expect(redirects).toContainEqual({ from: '/business/validation', to: '/business-manager/validation' });
  });
});

describe('resolveRoute', () => {
  it('resolves /business-manager to bm page', () => {
    const match = resolveRoute('/business-manager');
    expect(match).toBeDefined();
    expect(match.id).toBe('bm');
  });

  it('resolves /business-manager/applications to bmApplications page', () => {
    const match = resolveRoute('/business-manager/applications');
    expect(match).toBeDefined();
    expect(match.id).toBe('bmApplications');
  });

  it('returns undefined for unknown routes', () => {
    const match = resolveRoute('/nonexistent');
    expect(match).toBeUndefined();
  });
});

describe('groupEntries', () => {
  it('returns only menu-visible entries for bm group', () => {
    const entries = groupEntries('bm');
    expect(entries.length).toBeGreaterThan(0);
    entries.forEach(entry => {
      expect(entry.menu).toBe(true);
    });
  });
});
