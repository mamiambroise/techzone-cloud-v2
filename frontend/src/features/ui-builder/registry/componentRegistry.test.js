/**
 * Tests UI Builder — Registry + modèle + resolver bindings (CDC UI-BUILDER V1).
 * Données de test = fixtures locales (autorisées : tests uniquement).
 */
import { describe, it, expect } from 'vitest';

import {
  componentRegistry,
  getComponentDefinition,
  isKnownComponent,
  componentsByCategory,
  defaultProps,
} from './componentRegistry.js';
import {
  createDefaultTree,
  createNode,
  BINDING_KINDS,
  ACTION_TYPES,
} from '../model/uiDefinition.js';
import { createBindingResolver } from '../renderer/bindingResolver.js';

describe('Component Registry', () => {
  it('expose un catalogue contrôlé non vide', () => {
    expect(componentRegistry.length).toBeGreaterThanOrEqual(20);
    for (const component of componentRegistry) {
      expect(component.key).toBeTruthy();
      expect(component.category).toBeTruthy();
      expect(component.propertiesSchema).toBeTypeOf('object');
      expect(Array.isArray(component.bindingCapabilities)).toBe(true);
      expect(Array.isArray(component.supportedActions)).toBe(true);
    }
  });

  it('regroupe les composants par catégories connues', () => {
    const groups = componentsByCategory();
    const categories = groups.map((g) => g.category);
    expect(categories).toContain('LAYOUT');
    expect(categories).toContain('TYPOGRAPHY');
    expect(categories).toContain('FORMS');
    expect(categories).toContain('ACTIONS');
  });

  it('isKnownComponent fail-closed sur un type inconnu', () => {
    expect(isKnownComponent('Container')).toBe(true);
    expect(isKnownComponent('EvalHacker')).toBe(false);
    expect(getComponentDefinition('EvalHacker')).toBeNull();
  });

  it('defaultProps dérive du propertiesSchema', () => {
    const button = defaultProps('Button');
    expect(button.variant).toBe('primary');
    expect(defaultProps('Heading').level).toBe(2);
  });
});

describe('UI Definition model', () => {
  it('crée un arbre par défaut avec racine Container', () => {
    const tree = createDefaultTree();
    expect(tree.root).toBe('root');
    expect(tree.nodes.root.type).toBe('Container');
    expect(tree.nodes.root.children).toEqual([]);
  });

  it('crée un node avec id unique', () => {
    const a = createNode('Button');
    const b = createNode('Button');
    expect(a.id).not.toBe(b.id);
    expect(a.bindings).toEqual({});
    expect(a.actions).toEqual([]);
  });

  it('allowlists bindings/actions alignées backend', () => {
    expect(BINDING_KINDS).toContain('ENTITY_FIELD');
    expect(BINDING_KINDS).not.toContain('ARBITRARY_JS');
    expect(ACTION_TYPES).toContain('TRIGGER_AUTOMATION');
    expect(ACTION_TYPES).not.toContain('EVAL');
  });
});

describe('bindingResolver', () => {
  const node = (bindings) => ({ id: 'n1', type: 'Text', bindings, props: {} });

  it('STATIC renvoie la valeur déclarée', () => {
    const resolve = createBindingResolver({});
    expect(resolve(node({ text: { kind: 'STATIC', value: 'Bonjour' } }), 'text', 'x')).toBe('Bonjour');
  });

  it('CONTEXT résout le tenant réel passé par la console', () => {
    const resolve = createBindingResolver({ tenantName: 'Acme SA', userName: 'Ranja' });
    expect(resolve(node({ text: { kind: 'CONTEXT', context: 'currentTenant' } }), 'text')).toBe('Acme SA');
    expect(resolve(node({ text: { kind: 'CONTEXT', context: 'currentUser' } }), 'text')).toBe('Ranja');
  });

  it('CONTEXT inconnu → null (jamais interpolé)', () => {
    const resolve = createBindingResolver({});
    expect(resolve(node({ text: { kind: 'CONTEXT', context: 'evilContext' } }), 'text')).toBeNull();
  });

  it('ENTITY_FIELD référencé depuis le business context BM', () => {
    const resolve = createBindingResolver({
      businessContext: { entities: [{ code: 'customer', name: 'Clients', fields: [{ code: 'email', label: 'E-mail' }] }] },
    });
    const result = resolve(node({ text: { kind: 'ENTITY_FIELD', entity: 'customer', field: 'email' } }), 'text');
    expect(result).toContain('customer.email');
  });

  it('ENTITY_FIELD inconnu → référence marquée (pas de crash, pas de donnée inventée)', () => {
    const resolve = createBindingResolver({ businessContext: { entities: [] } });
    const result = resolve(node({ text: { kind: 'ENTITY_FIELD', entity: 'ghost', field: 'nope' } }), 'text');
    expect(result).toContain('ghost.nope');
  });

  it('sans binding, renvoie le fallback statique', () => {
    const resolve = createBindingResolver({});
    expect(resolve(node({}), 'text', 'statique')).toBe('statique');
  });

  it('kind inconnu → null (fail-closed)', () => {
    const resolve = createBindingResolver({});
    expect(resolve(node({ text: { kind: 'WILDCARD', value: '<script>' } }), 'text')).toBeNull();
  });
});
