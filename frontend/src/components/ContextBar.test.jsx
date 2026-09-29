import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ContextBar } from './ContextBar.jsx';

describe('ContextBar', () => {
  it('renders all context values', () => {
    render(
      <ContextBar
        application="App-001"
        version="v1.2.3"
        status="brouillon"
        environment="dev"
        tenant="acme-corp"
      />
    );
    expect(screen.getByText('App-001')).toBeInTheDocument();
    expect(screen.getByText('v1.2.3')).toBeInTheDocument();
    expect(screen.getByText('brouillon')).toBeInTheDocument();
    expect(screen.getByText('dev')).toBeInTheDocument();
    expect(screen.getByText('acme-corp')).toBeInTheDocument();
  });

  it('renders placeholder when values are missing', () => {
    render(<ContextBar />);
    const placeholders = screen.getAllByText('Non sélectionné');
    expect(placeholders.length).toBeGreaterThanOrEqual(3);
  });
});
