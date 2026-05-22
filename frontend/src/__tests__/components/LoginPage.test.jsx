import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../../pages/LoginPage';
import { useApp } from '../../context/AppContext';

// Mock context
vi.mock('../../context/AppContext', () => ({
  useApp: vi.fn(),
}));

const mockLogin = vi.fn();
const mockRegister = vi.fn();
const mockShowToast = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const renderLogin = () =>
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useApp.mockReturnValue({ login: mockLogin, register: mockRegister, showToast: mockShowToast });
  });

  it('renders sign in form by default', () => {
    renderLogin();
    expect(screen.getByText('SettleUp')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('priya@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('switches to register mode', async () => {
    renderLogin();
    await userEvent.click(screen.getByText('Create Account'));
    expect(screen.getByPlaceholderText('Priya Sharma')).toBeInTheDocument();
  });

  it('calls login with email and password on submit', async () => {
    mockLogin.mockResolvedValue();
    renderLogin();

    await userEvent.type(screen.getByPlaceholderText('priya@example.com'), 'alice@example.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('alice@example.com', 'password123'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('shows error toast on login failure', async () => {
    mockLogin.mockRejectedValue({ response: { data: { error: 'Invalid credentials' } } });
    renderLogin();

    await userEvent.type(screen.getByPlaceholderText('priya@example.com'), 'bad@example.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('Invalid credentials', 'error'));
  });

  it('calls register with name, email, password', async () => {
    mockRegister.mockResolvedValue();
    renderLogin();

    await userEvent.click(screen.getByText('Create Account'));
    await userEvent.type(screen.getByPlaceholderText('Priya Sharma'), 'New User');
    await userEvent.type(screen.getByPlaceholderText('priya@example.com'), 'new@example.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() =>
      expect(mockRegister).toHaveBeenCalledWith('New User', 'new@example.com', 'password123')
    );
  });

  it('disables submit button while loading', async () => {
    mockLogin.mockImplementation(() => new Promise((r) => setTimeout(r, 2000)));
    renderLogin();

    await userEvent.type(screen.getByPlaceholderText('priya@example.com'), 'alice@example.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    const btn = screen.getByRole('button', { name: /please wait/i });
    expect(btn).toBeDisabled();
  });
});
