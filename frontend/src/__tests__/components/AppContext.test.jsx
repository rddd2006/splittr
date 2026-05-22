import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProvider, useApp } from '../../context/AppContext';
import { authApi } from '../../api/client';

// Test consumer component
const TestConsumer = ({ action }) => {
  const ctx = useApp();
  return (
    <div>
      <span data-testid="auth">{String(ctx.isAuthenticated)}</span>
      <span data-testid="loading">{String(ctx.loading)}</span>
      <span data-testid="user">{ctx.user?.name || 'none'}</span>
      <span data-testid="toast">{ctx.toast?.message || 'none'}</span>
      {action && <button onClick={action(ctx)}>trigger</button>}
    </div>
  );
};

const renderWithProvider = (ui) => render(<AppProvider>{ui}</AppProvider>);

describe('AppContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('starts unauthenticated when no token in localStorage', async () => {
    authApi.me.mockRejectedValue(new Error('no token'));
    renderWithProvider(<TestConsumer />);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('auth').textContent).toBe('false');
    expect(screen.getByTestId('user').textContent).toBe('none');
  });

  it('authenticates user when valid token exists', async () => {
    localStorage.setItem('accessToken', 'valid-token');
    authApi.me.mockResolvedValue({ data: { id: '1', name: 'Alice Kumar', email: 'alice@test.com' } });
    renderWithProvider(<TestConsumer />);
    await waitFor(() => expect(screen.getByTestId('auth').textContent).toBe('true'));
    expect(screen.getByTestId('user').textContent).toBe('Alice Kumar');
  });

  it('login sets user and stores tokens', async () => {
    authApi.login.mockResolvedValue({
      data: {
        user: { id: '1', name: 'Bob Singh' },
        accessToken: 'access123',
        refreshToken: 'refresh456',
      },
    });
    authApi.me.mockRejectedValue(new Error());

    const action = (ctx) => () => ctx.login('bob@test.com', 'password123');
    renderWithProvider(<TestConsumer action={action} />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    await userEvent.click(screen.getByText('trigger'));

    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('Bob Singh'));
    expect(localStorage.getItem('accessToken')).toBe('access123');
    expect(localStorage.getItem('refreshToken')).toBe('refresh456');
  });

  it('logout clears user and tokens', async () => {
    localStorage.setItem('accessToken', 'tok');
    authApi.me.mockResolvedValue({ data: { id: '1', name: 'Carol' } });
    authApi.logout.mockResolvedValue({});

    const action = (ctx) => () => ctx.logout();
    renderWithProvider(<TestConsumer action={action} />);

    await waitFor(() => expect(screen.getByTestId('auth').textContent).toBe('true'));
    await userEvent.click(screen.getByText('trigger'));

    await waitFor(() => expect(screen.getByTestId('auth').textContent).toBe('false'));
    expect(localStorage.getItem('accessToken')).toBeNull();
  });

  it('showToast sets and auto-clears toast', async () => {
    vi.useFakeTimers();
    authApi.me.mockRejectedValue(new Error());

    const action = (ctx) => () => ctx.showToast('Test message', 'success');
    renderWithProvider(<TestConsumer action={action} />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    await userEvent.click(screen.getByText('trigger'));

    expect(screen.getByTestId('toast').textContent).toBe('Test message');

    act(() => vi.advanceTimersByTime(4000));
    expect(screen.getByTestId('toast').textContent).toBe('none');
    vi.useRealTimers();
  });

  it('throws when useApp is used outside provider', () => {
    const BadConsumer = () => { useApp(); return null; };
    expect(() => render(<BadConsumer />)).toThrow('useApp must be used within AppProvider');
  });
});
