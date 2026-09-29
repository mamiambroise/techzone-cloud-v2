import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { PageHeader, BackLink } from '../ui/PageHeader.jsx';

describe('PageHeader', () => {
  it('renders title and subtitle', () => {
    render(<PageHeader title="Test Title" subtitle="Test subtitle" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test subtitle')).toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    render(<PageHeader title="Test" action={{ label: 'Click Me', onClick: () => {} }} />);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('renders breadcrumbs when provided', () => {
    render(
      <PageHeader
        title="Test"
        breadcrumb={[
          { label: 'Home', onClick: () => {} },
          { label: 'Current' },
        ]}
      />
    );
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
  });
});

describe('BackLink', () => {
  it('renders with default label', () => {
    render(<BackLink onClick={() => {}} />);
    expect(screen.getByText('Retour')).toBeInTheDocument();
  });

  it('renders with custom label', () => {
    render(<BackLink onClick={() => {}} label="Go Back" />);
    expect(screen.getByText('Go Back')).toBeInTheDocument();
  });
});
