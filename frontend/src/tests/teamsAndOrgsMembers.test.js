import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import { store } from '../store';
import { MemoryRouter } from 'react-router-dom';

import { Members, JoinRequests } from '../components/teamsAndOrgs/members';

const Wrapper = ({ children }) => (
  <Provider store={store}>
    <IntlProvider locale="en">
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </IntlProvider>
  </Provider>
);

describe('Members component', () => {
  const defaultProps = {
    addMembers: jest.fn(),
    removeMembers: jest.fn(),
    saveMembersFn: jest.fn(),
    resetMembersFn: jest.fn(),
    members: [{ username: 'user1', pictureUrl: '' }],
    type: 'members',
    totalMembersOnTeam: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders members correctly', () => {
    render(<Members {...defaultProps} />, { wrapper: Wrapper });
    expect(screen.getByText('Members')).toBeInTheDocument();
    expect(screen.getByText('user1')).toBeInTheDocument();
  });

  it('toggles edit mode', async () => {
    render(<Members {...defaultProps} />, { wrapper: Wrapper });
    const toggleButton = screen.getByRole('checkbox');
    fireEvent.click(toggleButton);
    await waitFor(() => {
      expect(screen.getByText('Done')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  it('displays no members message when array is empty', () => {
    render(<Members {...defaultProps} members={[]} />, { wrapper: Wrapper });
    expect(screen.getByText(/There are no members yet/i)).toBeInTheDocument();
  });
});

describe('JoinRequests component', () => {
  const defaultProps = {
    requests: [{ username: 'user1', pictureUrl: '' }],
    teamId: 1,
    addMembers: jest.fn(),
    updateRequests: jest.fn(),
    managers: [{ username: 'admin', function: 'MANAGER' }],
    updateTeam: jest.fn(),
    joinMethod: 'BY_REQUEST',
    members: [],
  };

  it('renders requests correctly', () => {
    render(<JoinRequests {...defaultProps} />, { wrapper: Wrapper });
    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.getByText('Accept')).toBeInTheDocument();
    expect(screen.getByText('Reject')).toBeInTheDocument();
  });

  it('displays no requests message when array is empty', () => {
    render(<JoinRequests {...defaultProps} requests={[]} />, { wrapper: Wrapper });
    expect(screen.getByText(/No join requests for this team/i)).toBeInTheDocument();
  });
});
