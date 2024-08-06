import '@testing-library/jest-dom';
import { act, screen } from '@testing-library/react';

import { store } from '../../store';
import { ManagementPageIndex } from '../management';
import { teams } from '../../network/tests/mockData/teams';
import { ReduxIntlProviders, renderWithRouter } from '../../utils/testWithIntl';
import { projects } from '../../network/tests/mockData/projects';

describe('Management Page Overview Section', () => {
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
