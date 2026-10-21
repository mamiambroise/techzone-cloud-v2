import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { UiRenderer } from './Renderer.jsx';
import { rendererTreeError, safeUiHref } from './rendererSafety.js';

const node = (id, type = 'Container', children = []) => ({ id, type, children, props: {} });
describe('Shared Renderer — malformed UI and safe URLs', () => {
  it.each(['//evil.test', '/\\evil.test', 'javascript:alert(1)', 'data:text/html,test', 'https://user:pass@evil.test'])('blocks unsafe link %s', href => {
    render(<UiRenderer tree={{ root: 'a', nodes: { a: { ...node('a', 'Link'), props: { text: 'Lien', href } } } }} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '#');
  });
  it('accepts internal links and https image URLs', () => {
    expect(safeUiHref('/products')).toBe('/products');
    expect(safeUiHref('https://example.test/image.png', true)).toBeTruthy();
  });
  it.each([
    { root: 'a', nodes: { a: node('a', 'Container', ['a']) } },
    { root: 'a', nodes: { a: node('a', 'Form', ['b']), b: node('b', 'Container', ['a']) } },
    { root: 'a', nodes: { a: node('a', 'Container', ['missing']) } },
    { root: 'a', nodes: { a: { ...node('a'), actions: {} } } },
    { root: 'a', nodes: { a: { ...node('a', 'Text'), props: { text: { evil: 'object' } } } } },
  ])('shows a controlled error for malformed persisted definitions', tree => {
    expect(rendererTreeError(tree)).toBeTruthy();
    render(<UiRenderer tree={tree} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
  it('reports unsupported components without executing props or actions', () => {
    window.__uiProbe = false;
    render(<UiRenderer mode="runtime" tree={{ root: 'a', nodes: { a: { ...node('a', 'ArbitraryReact'), props: { onClick: 'window.__uiProbe=true' }, actions: [{ type: 'CALL_API', config: { url: 'https://evil.test' } }] } } }} />);
    fireEvent.click(screen.getByRole('alert'));
    expect(window.__uiProbe).toBe(false);
    delete window.__uiProbe;
  });
  it('renders markup as text rather than HTML', () => {
    const { container } = render(<UiRenderer tree={{ root: 'a', nodes: { a: { ...node('a', 'Text'), props: { text: '<script>alert(1)</script>' } } } }} />);
    expect(container.querySelector('script')).toBeNull();
    expect(screen.getByText('<script>alert(1)</script>')).toBeInTheDocument();
  });
});
