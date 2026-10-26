import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { UiRenderer } from './Renderer.jsx';
const tree = { root: 'root', nodes: {
  root: { id: 'root', type: 'Container', props: {}, children: ['title', 'text'] },
  title: { id: 'title', type: 'Heading', props: { text: 'Clients' }, children: [] },
  text: { id: 'text', type: 'Text', props: { text: 'Description' }, responsive: { MOBILE: { visible: 'hidden' } }, children: [] },
} };
describe('snapshot preview/runtime rendering contract', () => {
  it.each(['DESKTOP', 'TABLET', 'MOBILE'])('renders identical static structure on %s', (device) => {
    const preview = render(<UiRenderer tree={tree} mode="preview" device={device} />);
    const html = preview.container.innerHTML;
    preview.unmount();
    const runtime = render(<UiRenderer tree={tree} mode="runtime" device={device} />);
    expect(runtime.container.innerHTML).toBe(html);
  });
});

describe('editor renderer adapter', () => {
  it('adds editing overlays without replacing shared component semantics', () => {
    const { container } = render(<UiRenderer tree={tree} device="DESKTOP" decorateNode={(node, content) => <div data-editor-node={node.id}>{content}</div>} />);
    expect(container.querySelectorAll('[data-editor-node]')).toHaveLength(3);
    expect(container.querySelector('h2')?.textContent).toBe('Clients');
    expect(tree.nodes.root.children).toEqual(['title', 'text']);
  });
});

describe('shared renderer design tokens', () => {
  it('applies persisted site tokens to preview and runtime with bounded values', () => {
    const theme = {
      colors: { primary: '#6258D7', surface: '#F8FAFF', text: '#111827' },
      typography: { fontFamily: 'Georgia', baseSize: 16 },
      spacing: { unit: 6, container: 960 },
      radius: { sm: 4, md: 12, lg: 18 },
      shadow: { card: '0 10px 28px rgba(16,28,72,0.12)' },
    };
    const preview = render(<UiRenderer tree={tree} theme={theme} mode="preview" />);
    const renderer = preview.container.querySelector('.ui-renderer');

    expect(renderer.style.getPropertyValue('--ui-primary')).toBe('#6258D7');
    expect(renderer.style.getPropertyValue('--ui-font-family')).toBe('Georgia, serif');
    expect(renderer.style.getPropertyValue('--ui-container-width')).toBe('960px');
    expect(preview.container.querySelector('.ui-renderer > div').style.padding).toBe('24px');
    const html = preview.container.innerHTML;
    preview.unmount();

    const runtime = render(<UiRenderer tree={tree} theme={theme} mode="runtime" />);
    expect(runtime.container.innerHTML).toBe(html);
  });

  it('falls back instead of applying unsafe theme values', () => {
    const { container } = render(<UiRenderer
      tree={tree}
      theme={{
        colors: { primary: 'url(javascript:alert(1))' },
        typography: { fontFamily: 'url(evil)', baseSize: 500 },
        shadow: { card: 'url(https://example.invalid)' },
      }}
    />);
    const renderer = container.querySelector('.ui-renderer');

    expect(renderer.style.getPropertyValue('--ui-primary')).toBe('#0866F5');
    expect(renderer.style.getPropertyValue('--ui-font-family')).toBe('Inter, system-ui, sans-serif');
    expect(renderer.style.getPropertyValue('--ui-font-size')).toBe('72px');
    expect(renderer.style.getPropertyValue('--ui-shadow-card')).toBe('0 2px 12px rgba(16,28,72,0.05)');
  });
});
