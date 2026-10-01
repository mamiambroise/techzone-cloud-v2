import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './LoginPage.jsx';
const auth = vi.hoisted(() => ({ login:vi.fn(),isAuthenticated:false }));
vi.mock('../auth/AuthProvider.jsx',() => ({ useAuth:() => auth }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
const mount = () => render(<MemoryRouter><LoginPage/></MemoryRouter>);
describe('Login',() => {
  it('supports password visibility with accessible labels',() => {
    mount(); const password = screen.getByLabelText('Mot de passe');
    expect(password.type).toBe('password'); fireEvent.click(screen.getByRole('button',{ name:'Afficher le mot de passe' }));
    expect(password.type).toBe('text'); expect(screen.getByRole('button',{ name:'Masquer le mot de passe' }).getAttribute('aria-pressed')).toBe('true');
  });
  it('prevents concurrent form submission and displays the API failure',async () => {
    let reject; auth.login.mockImplementation(() => new Promise((_,r) => { reject = r; }));
    mount(); fireEvent.change(screen.getByLabelText('Identifiant ou email'),{ target:{ value:'test' } }); fireEvent.change(screen.getByLabelText('Mot de passe'),{ target:{ value:'invalid' } });
    const form = screen.getByRole('button',{ name:'Se connecter' }).closest('form');
    fireEvent.submit(form); fireEvent.submit(form); expect(auth.login).toHaveBeenCalledTimes(1);
    reject({ normalized:{ code:'INVALID_CREDENTIALS' } });
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Identifiants invalides'));
    expect(screen.getByRole('button',{ name:'Se connecter' }).disabled).toBe(false);
  });
});
