import { describe, it, expect } from 'vitest';
import { pageDefinitions, groupEntries } from './navigationConfig.js';
import { canAccess } from './navigationAccess.js';

/**
 * Parité UI permissions <-> permissions API.
 *
 * L'API Integration Hub n'autorise plus sur `erp:read` : chaque route doit donc
 * déclarer la permission que l'endpoint sous-jacent vérifie réellement.
 * Un masquage frontend n'est pas une sécurité, mais une divergence ici est un
 * signal d'alerte : l'utilisateur voit (ou ne voit pas) une surface que l'API
 * refuse autrement.
 */

const INTEGRATION_PERMISSIONS = [
  'integration:read',
  'integration:write',
  'integration:execute',
  'integration:credential:read',
  'integration:credential:write',
  'integration:diagnostic:read',
];

describe('parité des permissions — API & Intégrations', () => {
  // `groupEntries` ne renvoie que les entrées de menu : on travaille ici sur
  // toutes les routes du groupe, y compris celles accessibles par deep link.
  const apiGroup = () => pageDefinitions.filter((p) => p.group === 'api');

  it('expose au moins une entrée du groupe api', () => {
    expect(apiGroup().length).toBeGreaterThan(0);
  });

  it('ne déclare plus erp:read sur aucune route du groupe api', () => {
    const offenders = apiGroup().filter((e) => e.permission === 'erp:read');
    expect(offenders.map((e) => e.id)).toEqual([]);
  });

  it('n’utilise que des permissions du registre Integration Hub', () => {
    apiGroup().forEach((entry) => {
      expect(INTEGRATION_PERMISSIONS).toContain(entry.permission);
    });
  });

  it('aligne chaque route sur la permission servie par son endpoint', () => {
    const expected = {
      // GET /api/integrations/** (cockpit, connecteurs, APIs, webhooks, specs)
      settingsIntegrations: 'integration:read',
      'integrations-connectors': 'integration:read',
      'integrations-apis': 'integration:read',
      'integrations-webhooks': 'integration:read',
      'integrations-specifications': 'integration:read',
      'integrations-sync': 'integration:read',
      // GET /api/integrations/credentials -> secrets : permission distincte
      'integrations-credentials': 'integration:credential:read',
      // GET /api/integrations/diagnostics/** -> journaux tenant-scoped
      'integrations-diagnostics': 'integration:diagnostic:read',
    };
    const byId = Object.fromEntries(apiGroup().map((e) => [e.id, e.permission]));
    expect(byId).toEqual(expected);
  });
});

describe('parité des permissions — ERP reste séparé de l’Integration Hub', () => {
  it('les routes ERP conservent erp:read', () => {
    const erp = groupEntries('erp');
    expect(erp.length).toBeGreaterThan(0);
    erp.forEach((entry) => {
      expect(entry.permission).toBe('erp:read');
    });
  });

  it('aucune permission ERP n’est exigée sur une route api', () => {
    pageDefinitions
      .filter((p) => p.group === 'api')
      .forEach((entry) => {
        expect(entry.permission.startsWith('erp:')).toBe(false);
      });
  });
});

describe('comportement de filtre — rôles simulés', () => {
  const menuApi = () => groupEntries('api');

  it('un profil sans permission integration ne voit aucune route api', () => {
    const user = { permissions: ['automation:read'] };
    const visible = menuApi().filter((e) => canAccess(e, user));
    expect(visible).toEqual([]);
  });

  it('un profil lecteur integration voit le cockpit et les diagnostics', () => {
    const user = { permissions: ['integration:read', 'integration:diagnostic:read'] };
    const visible = menuApi().filter((e) => canAccess(e, user)).map((e) => e.id);
    expect(visible).toContain('settingsIntegrations');
    expect(visible).toContain('integrations-diagnostics');
  });

  it('un profil admin voit toutes les entrées de menu api', () => {
    const user = { permissions: INTEGRATION_PERMISSIONS };
    const visible = menuApi().filter((e) => canAccess(e, user)).map((e) => e.id);
    expect(visible).toHaveLength(menuApi().length);
  });
});

describe('cohérence du registre sur les surfaces auditées', () => {
  it('toutes les routes api et erp déclarent une permission', () => {
    const audited = pageDefinitions.filter(
      (p) => p.group === 'api' || p.group === 'erp',
    );
    expect(audited.length).toBeGreaterThan(0);
    const missing = audited
      .filter((p) => !(typeof p.permission === 'string' && p.permission.length > 0))
      .map((p) => p.id);
    expect(missing).toEqual([]);
  });
});