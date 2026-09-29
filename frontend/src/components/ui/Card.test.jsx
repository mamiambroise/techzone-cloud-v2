import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Card } from './Card.jsx';

describe('Card', () => {
  it('renders title and description', () => {
    render(<Card title="Card Title" description="Card description" />);
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card description')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(<Card title="Test"><div data-testid="child">Child content</div></Card>);
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders footer', () => {
    render(<Card title="Test" footer="Footer text" />);
    expect(screen.getByText('Footer text')).toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    render(<Card title="Test" action={{ label: 'Action', onClick: vi.fn() }} />);
    expect(screen.getByText('Action')).toBeInTheDocument();
  });
});
