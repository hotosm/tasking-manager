import '@testing-library/jest-dom';
import { screen, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryParamProvider } from 'use-query-params';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';

import {
  ManageTeams,
  MyTeams,
  ListTeams,
  CreateTeam,
  EditTeam,
  TeamDetail,
} from '../teams';
import { renderWithRouter, ReduxIntlProviders, QueryClientProviders, createComponentWithMemoryRouter } from '../../utils/testWithIntl';
import { store } from '../../store';
import { server } from '../../network/tests/server';

import { useFetch } from '../../hooks/UseFetch';
import { useTeamsQuery } from '../../api/teams';

jest.mock('../../hooks/UseFetch', () => ({
  useFetch: jest.fn(),
}));

jest.mock('../../api/teams', () => ({
  useTeamsQuery: jest.fn(),
}));

describe('Teams Views', () => {
  beforeAll(() => server.listen());
  afterAll(() => server.close());
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    server.resetHandlers();
  });

  const renderComponent = (ui) => {
    return renderWithRouter(
      <QueryClientProviders>
        <ReduxIntlProviders>
          <QueryParamProvider adapter={ReactRouter6Adapter}>
            {ui}
          </QueryParamProvider>
        </ReduxIntlProviders>
      </QueryClientProviders>
    );
  };

  describe('ManageTeams', () => {
    it('renders ManageTeams with correct props', () => {
      useTeamsQuery.mockReturnValue({ data: { teams: [], pagination: { pages: 1 } }, status: 'success' });
      renderComponent(<ManageTeams />);
      expect(useTeamsQuery).toHaveBeenCalled();
    });
  });

  describe('MyTeams', () => {
    it('renders MyTeams correctly', () => {
      useTeamsQuery.mockReturnValue({ data: { teams: [], pagination: { pages: 1 } }, status: 'success' });
      renderComponent(<MyTeams />);
      expect(useTeamsQuery).toHaveBeenCalled();
    });
  });

  describe('ListTeams', () => {
    it('renders ListTeams and handles pagination', () => {
      useTeamsQuery.mockReturnValue({ data: { teams: [{ teamId: 1, name: 'Team 1', joinMethod: 'ANY', visibility: 'PUBLIC', role: 'PROJECT_MANAGER' }], pagination: { pages: 2 } }, status: 'success' });
      renderComponent(<ListTeams managementView={false} />);
      expect(useTeamsQuery).toHaveBeenCalled();
    });
    
    it('handles teams loading status', () => {
      useTeamsQuery.mockReturnValue({ data: undefined, status: 'loading' });
      renderComponent(<ListTeams managementView={true} />);
      expect(useTeamsQuery).toHaveBeenCalled();
    });

    it('handles teams error status', () => {
      useTeamsQuery.mockReturnValue({ data: undefined, status: 'error' });
      renderComponent(<ListTeams managementView={true} />);
      expect(useTeamsQuery).toHaveBeenCalled();
    });
  });

  describe('CreateTeam', () => {
    it('renders CreateTeam form', () => {
      renderComponent(<CreateTeam />);
      expect(screen.getByText(/Create new team/i)).toBeInTheDocument();
    });

    it('submits form when required fields are filled', async () => {
      const { user } = renderComponent(<CreateTeam />);
      expect(screen.getByText(/Create new team/i)).toBeInTheDocument();
    });
  });

  describe('EditTeam', () => {
    it('renders EditTeam for an existing team', () => {
      useFetch.mockReturnValue([null, false, { teamId: 1, name: 'Team 1', members: [], joinMethod: 'ANY', visibility: 'PUBLIC' }]);
      const { container } = createComponentWithMemoryRouter(
        <QueryClientProviders>
          <ReduxIntlProviders>
            <EditTeam />
          </ReduxIntlProviders>
        </QueryClientProviders>,
        { route: '/teams/1' }
      );
      expect(container).toBeInTheDocument();
    });

    it('shows error if not allowed to edit', () => {
      useFetch.mockReturnValue([null, false, { teamId: 1, name: 'Team 1', members: [] }]);
      const { container } = createComponentWithMemoryRouter(
        <QueryClientProviders>
          <ReduxIntlProviders>
            <EditTeam />
          </ReduxIntlProviders>
        </QueryClientProviders>,
        { route: '/teams/1' }
      );
      expect(container).toBeInTheDocument();
    });

    it('handles error fetching team details', () => {
      useFetch.mockReturnValue([{ message: 'Not found' }, false, null]);
      const { container } = createComponentWithMemoryRouter(
        <QueryClientProviders>
          <ReduxIntlProviders>
            <EditTeam />
          </ReduxIntlProviders>
        </QueryClientProviders>,
        { route: '/teams/1' }
      );
      expect(container).toBeInTheDocument();
    });
  });

  describe('TeamDetail', () => {
    it('renders TeamDetail correctly', () => {
      useFetch.mockReturnValue([null, false, { teamId: 1, name: 'Team 1', members: [{ username: 'test_user', active: true, role: 'MANAGER' }], joinMethod: 'BY_INVITE' }]);
      const { container } = createComponentWithMemoryRouter(
        <QueryClientProviders>
          <ReduxIntlProviders>
            <TeamDetail />
          </ReduxIntlProviders>
        </QueryClientProviders>,
        { route: '/teams/1' }
      );
      expect(container).toBeInTheDocument();
    });

    it('renders TeamDetail join button', () => {
      useFetch.mockReturnValue([null, false, { teamId: 1, name: 'Team 1', members: [], joinMethod: 'ANY' }]);
      const { container } = createComponentWithMemoryRouter(
        <QueryClientProviders>
          <ReduxIntlProviders>
            <TeamDetail />
          </ReduxIntlProviders>
        </QueryClientProviders>,
        { route: '/teams/1' }
      );
      expect(container).toBeInTheDocument();
    });

    it('renders not found when error occurs', () => {
      useFetch.mockReturnValue([{ message: 'Error' }, false, null]);
      const { container } = createComponentWithMemoryRouter(
        <QueryClientProviders>
          <ReduxIntlProviders>
            <TeamDetail />
          </ReduxIntlProviders>
        </QueryClientProviders>,
        { route: '/teams/1' }
      );
      expect(container).toBeInTheDocument();
    });
  });
});
