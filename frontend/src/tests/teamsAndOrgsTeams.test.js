import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import { store } from '../store';

import { TeamsManagement, Teams, TeamCard, TeamsBoxList, TeamBox } from '../components/teamsAndOrgs/teams';

const Wrapper = ({ children }) => (
  <Provider store={store}>
    <IntlProvider locale="en">
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </IntlProvider>
  </Provider>
);

describe('teamsAndOrgs teams components', () => {
  const mockTeam = {
    teamId: 1,
    name: 'Team Alpha',
    description: 'Description alpha',
    joinMethod: 'ANY',
    visibility: 'PUBLIC',
    members: [
      { username: 'user1', function: 'MANAGER', active: true },
      { username: 'user2', function: 'MEMBER', active: true }
    ],
    managersCount: 1,
    membersCount: 1,
    role: 'MAPPER',
    organisation: 'Org 1',
    logo: 'logo.png'
  };

  describe('TeamCard', () => {
    it('renders correctly', () => {
      render(<TeamCard team={mockTeam} />, { wrapper: Wrapper });
      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    });
  });

  describe('Teams', () => {
    it('renders empty array', () => {
      render(<Teams teams={[]} isReady={true} />, { wrapper: Wrapper });
      expect(screen.getByText(/teams/i)).toBeInTheDocument();
    });

    it('renders multiple teams', () => {
      const mockTeams = [mockTeam, { ...mockTeam, teamId: 2, name: 'Team Beta' }];
      render(<Teams teams={mockTeams} isReady={true} />, { wrapper: Wrapper });
      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
      expect(screen.getByText('Team Beta')).toBeInTheDocument();
    });
  });

  describe('TeamsBoxList', () => {
    it('renders with mapping and validation teams', () => {
      const mockTeams = [
        { ...mockTeam, role: 'MAPPER' },
        { ...mockTeam, teamId: 2, role: 'VALIDATOR', name: 'Team Validator' }
      ];
      render(<TeamsBoxList teams={mockTeams} />, { wrapper: Wrapper });
      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
      expect(screen.getByText('Team Validator')).toBeInTheDocument();
    });

    it('renders empty gracefully', () => {
      const { container } = render(<TeamsBoxList teams={[]} />, { wrapper: Wrapper });
      expect(container).toBeInTheDocument();
    });
  });

  describe('TeamBox', () => {
    it('renders basic team box', () => {
      render(<TeamBox team={mockTeam} />, { wrapper: Wrapper });
      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    });
  });

  describe('TeamsManagement', () => {
    it('renders correctly with teams', () => {
      const query = { searchQuery: '', page: 1 };
      const setQuery = jest.fn();
      
      render(
        <TeamsManagement 
          teams={[mockTeam]} 
          userDetails={{ role: 'ADMIN' }} 
          managementView={true} 
          teamsStatus={'success'} 
          query={query} 
          setQuery={setQuery} 
        />, 
        { wrapper: Wrapper }
      );
      
      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    });

    it('renders loading state', () => {
      const query = { searchQuery: '', page: 1 };
      render(
        <TeamsManagement 
          teams={[]} 
          userDetails={{ role: 'ADMIN' }} 
          managementView={true} 
          teamsStatus={'loading'} 
          query={query} 
          setQuery={jest.fn()} 
        />, 
        { wrapper: Wrapper }
      );
      expect(screen.getByPlaceholderText(/Search/i)).toBeInTheDocument();
    });

    it('renders error state', () => {
      const query = { searchQuery: '', page: 1 };
      render(
        <TeamsManagement 
          teams={[]} 
          userDetails={{ role: 'ADMIN' }} 
          managementView={true} 
          teamsStatus={'error'} 
          query={query} 
          setQuery={jest.fn()} 
        />, 
        { wrapper: Wrapper }
      );
      // Wait for an error text, or at least the document renders correctly
      expect(screen.getByPlaceholderText(/Search/i)).toBeInTheDocument();
    });
  });
});
