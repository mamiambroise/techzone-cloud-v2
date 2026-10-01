import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import ErpErrorPanel from './ErpErrorPanel.jsx';

const axiosError = (data) => ({ response: { status: data.statusCode, data } });

function renderPanel(errors) {
  return render(
    <MemoryRouter>
      <ErpErrorPanel errors={errors} />
    </MemoryRouter>,
  );
}

describe('ErpErrorPanel', () => {
  it('renders nothing when there is no error', () => {
    const { container } = renderPanel({});
    expect(container.firstChild).toBeNull();
  });

  it('renders a single deduplicated panel for identical errors across resources', () => {
    const err = axiosError({
      statusCode: 503,
      code: 'ERP_UNAVAILABLE',
      message: 'ERP actuellement indisponible',
      traceId: 'trace-1',
    });
    renderPanel({
      clients: err,
      products: err,
      orders: err,
      invoices: err,
    });
    expect(
      screen.getAllByText('ERP actuellement indisponible'),
    ).toHaveLength(1);
    expect(screen.getByText('Clients')).toBeInTheDocument();
    expect(screen.getByText('Produits')).toBeInTheDocument();
    expect(screen.getByText('Commandes')).toBeInTheDocument();
    expect(screen.getByText('Factures')).toBeInTheDocument();
    expect(screen.getByText(/trace-1/)).toBeInTheDocument();
  });

  it('shows the UNCONFIGURED state with the connection CTA', () => {
    renderPanel({
      clients: axiosError({
        statusCode: 503,
        code: 'ERP_INSTANCE_NOT_CONFIGURED',
        message: 'ERP non configure pour ce tenant',
        traceId: 'trace-2',
      }),
    });
    expect(
      screen.getByText('ERP non configuré — connexion à rétablir'),
    ).toBeInTheDocument();
    const cta = screen.getByRole('link', { name: /Configurer la connexion/ });
    expect(cta).toHaveAttribute('href', '/settings/erp');
  });

  it('renders one panel per distinct error signature', () => {
    renderPanel({
      clients: axiosError({
        statusCode: 503,
        code: 'ERP_INSTANCE_NOT_CONFIGURED',
        message: 'ERP non configure pour ce tenant',
      }),
      orders: axiosError({
        statusCode: 504,
        code: 'ERP_UNAVAILABLE',
        message: 'Delai depasse',
      }),
    });
    expect(
      screen.getByText('ERP non configuré — connexion à rétablir'),
    ).toBeInTheDocument();
    expect(screen.getByText('Delai depasse')).toBeInTheDocument();
  });
});
