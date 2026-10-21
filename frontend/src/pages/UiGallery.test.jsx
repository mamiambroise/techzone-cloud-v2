import React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import UiGallery from './UiGallery.jsx';

describe('UiGallery', () => {
  it('composes the shared tab, card and confirmation primitives', () => {
    render(<MemoryRouter><UiGallery /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Galerie UI/UX' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Vue d’ensemble' })).toHaveAttribute('aria-current', 'page');
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir la confirmation' }));
    expect(screen.getByRole('dialog', { name: 'Exemple de confirmation' })).toBeInTheDocument();
  });
});
