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
