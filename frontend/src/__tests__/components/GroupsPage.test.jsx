import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import GroupsPage from '../../pages/GroupsPage';
import { useApp } from '../../context/AppContext';
import { groupsApi } from '../../api/client';

vi.mock('../../context/AppContext', () => ({
  useApp: vi.fn(),
}));

const mockShowToast = vi.fn();

const mockGroups = [
  {
    id: 'g1',
    name: 'Goa Trip',
    description: 'Beach vacation',
    currency: 'INR',
    members: [{ user: { id: 'u1', name: 'Alice' } }],
    _count: { expenses: 3 },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'g2',
    name: 'Office Lunch',
    description: '',
    currency: 'INR',
    members: [{ user: { id: 'u1', name: 'Alice' } }, { user: { id: 'u2', name: 'Bob' } }],
    _count: { expenses: 10 },
    createdAt: new Date().toISOString(),
  },
];

const renderPage = () =>
  render(<MemoryRouter><GroupsPage /></MemoryRouter>);

describe('GroupsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useApp.mockReturnValue({ showToast: mockShowToast });
    groupsApi.list.mockResolvedValue({ data: mockGroups });
  });

  it('renders group list', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Goa Trip')).toBeInTheDocument());
    expect(screen.getByText('Office Lunch')).toBeInTheDocument();
  });

  it('shows member and expense counts', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Goa Trip')).toBeInTheDocument());
    expect(screen.getByText(/1 members/)).toBeInTheDocument();
    expect(screen.getByText(/3 expenses/)).toBeInTheDocument();
  });

  it('shows empty state when no groups', async () => {
    groupsApi.list.mockResolvedValue({ data: [] });
    renderPage();
    await waitFor(() => expect(screen.getByText(/No groups yet/)).toBeInTheDocument());
  });

  it('shows create form when button clicked', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Goa Trip'));
    await userEvent.click(screen.getByText('+ New Group'));
    expect(screen.getByPlaceholderText('Goa Trip 2025')).toBeInTheDocument();
  });

  it('creates a group and refreshes list', async () => {
    groupsApi.create.mockResolvedValue({ data: { id: 'g3', name: 'New Group' } });
    renderPage();
    await waitFor(() => screen.getByText('Goa Trip'));

    await userEvent.click(screen.getByText('+ New Group'));
    await userEvent.type(screen.getByPlaceholderText('Goa Trip 2025'), 'Weekend Hike');
    await userEvent.click(screen.getByRole('button', { name: /create group/i }));

    await waitFor(() => expect(groupsApi.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Weekend Hike' })
    ));
    expect(mockShowToast).toHaveBeenCalledWith('Group created!');
  });

  it('handles create failure gracefully', async () => {
    groupsApi.create.mockRejectedValue({ response: { data: { error: 'Server error' } } });
    renderPage();
    await waitFor(() => screen.getByText('Goa Trip'));

    await userEvent.click(screen.getByText('+ New Group'));
    await userEvent.type(screen.getByPlaceholderText('Goa Trip 2025'), 'Failing Group');
    await userEvent.click(screen.getByRole('button', { name: /create group/i }));

    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('Server error', 'error'));
  });
});
