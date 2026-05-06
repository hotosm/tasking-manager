import '@testing-library/jest-dom';
import { act, screen } from '@testing-library/react';

import { store } from '../../store';
import { ManagementPageIndex } from '../management';
import { teams } from '../../network/tests/mockData/teams';
import { ReduxIntlProviders, renderWithRouter } from '../../utils/testWithIntl';
import { projects } from '../../network/tests/mockData/projects';
import { useFetch } from '../../hooks/UseFetch';

jest.mock('../../hooks/UseFetch', () => ({
  useFetch: jest.fn(),
}));

describe('Management Page Overview Section', () => {
  beforeEach(() => {
    const teamsWithoutMemberLinks = {
      ...teams,
      teams: teams.teams.map((team) => ({
        ...team,
        members: [],
        managersCount: 0,
        membersCount: 0,
      })),
    };

    useFetch.mockImplementation((url) => {
      if (url.startsWith('projects/')) {
        return [null, false, projects];
      }

      if (url.startsWith('teams/')) {
        return [null, false, teamsWithoutMemberLinks];
      }

      return [null, false, {}];
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should list projects and teams fetched', async () => {
    act(() => {
      store.dispatch({
        type: 'SET_USER_DETAILS',
        userDetails: { id: 123, username: 'test_user' },
      });
    });

    renderWithRouter(
      <ReduxIntlProviders>
        <ManagementPageIndex />
      </ReduxIntlProviders>,
    );

    expect(
      await screen.findByRole('heading', {
        name: projects.results[0].name,
      }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', {
        name: teams.teams[0].name,
      }),
    ).toBeInTheDocument();
  });
});
