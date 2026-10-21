import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BmSearchInput, BmSelect } from './ui.jsx';

describe('Shared control value callbacks', () => {
  it('emits select values and the empty selection, never DOM events', () => {
    const onChange = vi.fn();
    const { rerender } = render(<BmSelect label="Page" value="" onChange={onChange} options={[{ value: '', label: 'Choisir' }, { value: 'products', label: 'Produits' }]} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'products' } });
    expect(onChange).toHaveBeenLastCalledWith('products');
    rerender(<BmSelect label="Page" value="products" onChange={onChange} options={[{ value: '', label: 'Choisir' }, { value: 'products', label: 'Produits' }]} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '' } });
    expect(onChange).toHaveBeenLastCalledWith('');
  });
  it('emits search text and an empty string when cleared', () => {
    const onChange = vi.fn();
    const { rerender } = render(<BmSearchInput value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'produit' } });
    expect(onChange).toHaveBeenLastCalledWith('produit');
    rerender(<BmSearchInput value="produit" onChange={onChange} />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '' } });
    expect(onChange).toHaveBeenLastCalledWith('');
  });
  it('normalizes null controlled values to empty strings', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      render(<><BmSearchInput value={null} onChange={() => {}} /><BmSelect label="Page" value={null} onChange={() => {}} options={[{ value: '', label: 'Choisir' }]} /></>);
      expect(screen.getByRole('searchbox')).toHaveValue('');
      expect(screen.getByRole('combobox')).toHaveValue('');
      expect(error).not.toHaveBeenCalled();
    } finally { error.mockRestore(); }
  });
});
