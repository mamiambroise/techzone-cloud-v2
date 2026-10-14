import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import MfaChallenge from './MfaChallenge.jsx';

const challenge = { token: 'opaque-server-token', expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() };

describe('MfaChallenge', () => {
  it('submits only a six-digit code and never exposes the challenge token', async () => {
    const onVerify = vi.fn().mockResolvedValue(undefined);
    render(<MfaChallenge challenge={challenge} onVerify={onVerify} onBack={vi.fn()} />);

    const input = screen.getByLabelText('Code de vérification');
    fireEvent.change(input, { target: { value: '12a34567' } });
    expect(input.value).toBe('123456');
    fireEvent.click(screen.getByRole('button', { name: 'Vérifier et continuer' }));

    await waitFor(() => expect(onVerify).toHaveBeenCalledWith({ code: '123456' }));
    expect(screen.queryByText(challenge.token)).toBeNull();
  });

  it('shows a controlled error instead of a backend error payload', async () => {
    const onVerify = vi.fn().mockRejectedValue({ normalized: { code: 'MFA_INVALID_CODE', statusCode: 401, message: 'internal detail' } });
    render(<MfaChallenge challenge={challenge} onVerify={onVerify} onBack={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Code de vérification'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Vérifier et continuer' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Le code est invalide ou la vérification n’est plus disponible.');
    expect(screen.queryByText('internal detail')).toBeNull();
  });
});
