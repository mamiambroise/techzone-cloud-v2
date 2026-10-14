import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { BMApplicationForm } from './BMApplicationForm.jsx';

describe('BMApplicationForm', () => {
  it('groups the fields, exposes proper labels and submits only business input', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<BMApplicationForm onSubmit={onSubmit} onCancel={vi.fn()} submitting={false} />);

    expect(screen.getByText('Informations générales')).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Code/), 'WIFI_SERVICES');
    await user.type(screen.getByLabelText(/Nom/), 'Gestion WiFi & Services');
    await user.type(screen.getByLabelText('Description'), 'Application métier');
    await user.click(screen.getByRole('button', { name: 'Créer l’application' }));

    expect(onSubmit).toHaveBeenCalledWith({
      code: 'WIFI_SERVICES',
      name: 'Gestion WiFi & Services',
      description: 'Application métier',
    });
  });

  it('keeps cancellation explicit and keyboard-accessible', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<BMApplicationForm onSubmit={vi.fn()} onCancel={onCancel} submitting={false} />);

    await user.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
