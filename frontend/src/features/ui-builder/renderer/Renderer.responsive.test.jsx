import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { UiRenderer } from './Renderer.jsx';

const tree = {
  root: 'root',
  nodes: {
    root: { id: 'root', type: 'Container', props: {}, children: ['heading'] },
    heading: {
      id: 'heading',
      type: 'Heading',
      props: { text: 'Visible sur desktop' },
      responsive: { MOBILE: { visible: 'hidden' } },
      children: [],
    },
  },
};

describe('UiRenderer responsive visibility', () => {
  it('hides a component for the selected device', () => {
    render(<UiRenderer tree={tree} device="MOBILE" />);

    expect(screen.queryByText('Visible sur desktop')).not.toBeInTheDocument();
  });

  it('keeps the component visible when the selected device has no hidden override', () => {
    render(<UiRenderer tree={tree} device="DESKTOP" />);

    expect(screen.getByText('Visible sur desktop')).toBeInTheDocument();
  });
});
