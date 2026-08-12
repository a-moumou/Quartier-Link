import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';

// Mock de l'API axios
vi.mock('../services/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

import api from '../services/api';

// Composant helper pour accéder au contexte dans les tests
function AuthConsumer() {
  const { user, loading, logout } = useAuth();
  if (loading) return <div>loading</div>;
  return (
    <div>
      <span data-testid="user">{user ? user.email : 'null'}</span>
      <span data-testid="role">{user?.role ?? ''}</span>
      <span data-testid="verified">{user?.isVerified ? 'yes' : 'no'}</span>
      <button onClick={logout}>logout</button>
    </div>
  );
}

function renderWithAuth() {
  return render(
    <AuthProvider>
      <AuthConsumer />
    </AuthProvider>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ── État initial ──────────────────────────────────────────────

  it('user est null au départ sans token', async () => {
    renderWithAuth();
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('null'));
  });

  it('loading passe à false après l\'initialisation', async () => {
    renderWithAuth();
    await waitFor(() => expect(screen.queryByText('loading')).toBeNull());
  });

  it('restaure le user depuis localStorage au montage', async () => {
    const storedUser = {
      email: 'alice@test.com',
      roles: ['ROLE_USER'],
      statutVerification: 'VERIFIE',
      isVerified: true,
      role: 'user',
    };
    localStorage.setItem('token', 'fake-jwt');
    localStorage.setItem('user', JSON.stringify(storedUser));

    renderWithAuth();
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('alice@test.com'));
  });

  // ── normalizeUser ─────────────────────────────────────────────

  it('login normalise ROLE_USER → role "user"', async () => {
    api.post.mockResolvedValue({
      data: {
        token: 'jwt-token',
        user: {
          email: 'user@test.com',
          roles: ['ROLE_USER'],
          statutVerification: 'NON_VERIFIE',
        },
      },
    });

    let loginFn;
    function Grabber() {
      const auth = useAuth();
      loginFn = auth.login;
      return <AuthConsumer />;
    }

    render(<AuthProvider><Grabber /></AuthProvider>);
    await waitFor(() => expect(screen.queryByText('loading')).toBeNull());

    await act(async () => {
      await loginFn('user@test.com', 'password123');
    });

    expect(screen.getByTestId('role').textContent).toBe('user');
    expect(screen.getByTestId('verified').textContent).toBe('no');
  });

  it('login normalise ROLE_ADMIN_GENERAL → role "super_admin"', async () => {
    api.post.mockResolvedValue({
      data: {
        token: 'jwt-token',
        user: {
          email: 'admin@test.com',
          roles: ['ROLE_ADMIN_GENERAL', 'ROLE_ADMIN_QUARTIER', 'ROLE_USER'],
          statutVerification: 'VERIFIE',
        },
      },
    });

    let loginFn;
    function Grabber() {
      const auth = useAuth();
      loginFn = auth.login;
      return <AuthConsumer />;
    }

    render(<AuthProvider><Grabber /></AuthProvider>);
    await waitFor(() => expect(screen.queryByText('loading')).toBeNull());

    await act(async () => {
      await loginFn('admin@test.com', 'Admin1234!');
    });

    expect(screen.getByTestId('role').textContent).toBe('super_admin');
  });

  it('login normalise ROLE_ADMIN_QUARTIER → role "admin"', async () => {
    api.post.mockResolvedValue({
      data: {
        token: 'jwt-token',
        user: {
          email: 'quartier@test.com',
          roles: ['ROLE_ADMIN_QUARTIER', 'ROLE_USER'],
          statutVerification: 'VERIFIE',
        },
      },
    });

    let loginFn;
    function Grabber() {
      const auth = useAuth();
      loginFn = auth.login;
      return <AuthConsumer />;
    }

    render(<AuthProvider><Grabber /></AuthProvider>);
    await waitFor(() => expect(screen.queryByText('loading')).toBeNull());

    await act(async () => {
      await loginFn('quartier@test.com', 'Pass1234!');
    });

    expect(screen.getByTestId('role').textContent).toBe('admin');
  });

  // ── logout ────────────────────────────────────────────────────

  it('logout vide user et supprime localStorage', async () => {
    const storedUser = {
      email: 'alice@test.com',
      roles: ['ROLE_USER'],
      statutVerification: 'VERIFIE',
      isVerified: true,
      role: 'user',
    };
    localStorage.setItem('token', 'fake-jwt');
    localStorage.setItem('user', JSON.stringify(storedUser));

    renderWithAuth();
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('alice@test.com'));

    const { fireEvent } = await import('@testing-library/react');
    await act(async () => {
      fireEvent.click(screen.getByText('logout'));
    });

    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});
