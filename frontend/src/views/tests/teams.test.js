import '@testing-library/jest-dom';
import { screen, waitFor, within, act } from '@testing-library/react';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';
import { QueryParamProvider } from 'use-query-params';
import userEvent from '@testing-library/user-event';
import toast from 'react-hot-toast';

import {
  createComponentWithMemoryRouter,
  ReduxIntlProviders,
  renderWithRouter,
} from '../../utils/testWithIntl';
import { ManageTeams, EditTeam, CreateTeam, MyTeams } from '../teams';
import { store } from '../../store';
import { setupFaultyHandlers } from '../../network/tests/server';
import * as config from '../../config';

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

// Set OSM_TEAMS_CLIENT_ID to be able to test OSM Teams integration components
Object.defineProperty(config, 'OSM_TEAMS_CLIENT_ID', {
  value: () => '123abc',
  writable: true,
});

describe('List Teams', () => {
  it('should show loading placeholder when teams are being fetched', async () => {
    const { container } = renderWithRouter(
      <QueryParamProvider adapter={ReactRouter6Adapter}>
        <ReduxIntlProviders>
          <ManageTeams />
        </ReduxIntlProviders>
      </QueryParamProvider>,
    );
    act(() => {
      store.dispatch({
        type: 'SET_USER_DETAILS',
        userDetails: { id: 122, username: 'test_user', role: 'ADMIN' },
      });
      store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
    });
    expect(container.getElementsByClassName('show-loading-animation').length).toBe(4 * 9);
  });

  it('should fetch and list teams', async () => {
    const { container } = renderWithRouter(
      <QueryParamProvider adapter={ReactRouter6Adapter}>
        <ReduxIntlProviders>
          <ManageTeams />
        </ReduxIntlProviders>
      </QueryParamProvider>,
    );
    await waitFor(() =>
      expect(container.getElementsByClassName('show-loading-animation').length).toBe(0),
    );

    expect(screen.getByRole('heading', { name: /team test/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /test kll team/i })).toBeInTheDocument();
  });

  it('should navigate to team detail page on team article click', async () => {
    const { user, router, container } = createComponentWithMemoryRouter(
      <QueryParamProvider adapter={ReactRouter6Adapter}>
        <ReduxIntlProviders>
          <ManageTeams />
        </ReduxIntlProviders>
      </QueryParamProvider>,
    );
    await waitFor(() =>
      expect(container.getElementsByClassName('show-loading-animation').length).toBe(0),
    );
    await user.click(screen.getByRole('heading', { name: /team test/i }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/teams/1/membership/'));
  });
});

describe('Create Team', () => {
  const setup = () => {
    const { user, router } = createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <CreateTeam />
      </ReduxIntlProviders>,
    );
    const createButton = screen.getByRole('button', {
      name: /create team/i,
    });

    return {
      user,
      createButton,
      router,
    };
  };

  it('should disable create team button by default', () => {
    const { createButton } = setup();
    expect(createButton).toBeDisabled();
  });

  it('should fill the default manager list by the current user', () => {
    setup();
    const link = screen.getByRole('link', {
      name: /test_user/i,
    });
    expect(within(link).getByTitle(/test_user/i)).toBeInTheDocument();
  });

  it('should navigate to the newly created team detail page on creation success', async () => {
    const { createButton, router, user } = setup();
    const nameInput = screen.getAllByRole('textbox')[0];
    const orgSelect = screen.getByRole('combobox');
    const joinMethodOption = screen.getAllByRole('radio')[0];
    await user.type(nameInput, 'New Team Name');
    await user.click(orgSelect);
    const orgOption = await screen.findByText('American Red Cross');
    await user.click(orgOption);
    expect(createButton).toBeEnabled();
    await user.click(joinMethodOption);
    await user.click(createButton);
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledTimes(1);
      expect(router.state.location.pathname).toBe('/manage/teams/123');
    });
  });
});

describe('Create Team with OSM Teams integration', () => {
  it('Sync with OSM Teams section is present', () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <CreateTeam />
      </ReduxIntlProviders>,
    );
    act(() => {
      store.dispatch({
        type: 'SET_USER_DETAILS',
        userDetails: { id: 122, username: 'test_user', role: 'ADMIN' },
      });
      store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
    });
    expect(screen.getByText('Sync with OSM Teams')).toBeInTheDocument();
    expect(screen.getByText('Authenticate OSM Teams')).toBeInTheDocument();
  });
  it('Setting osmteams_token enables team selection', async () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <CreateTeam />
      </ReduxIntlProviders>,
    );
    act(() => {
      store.dispatch({
        type: 'SET_USER_DETAILS',
        userDetails: { id: 122, username: 'test_user', role: 'ADMIN' },
      });
      store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
      store.dispatch({
        type: 'SET_OSM_TEAMS_TOKEN',
        osmteams_token: 'abc123',
      });
    });
    expect(screen.queryByText('Authenticate OSM Teams')).not.toBeInTheDocument();
    expect(screen.getByText('Select a team from OSM Teams')).toBeInTheDocument();
    // Open OSM Teams selection modal
    await userEvent.click(screen.getByText('Select a team from OSM Teams'));
    await waitFor(() => expect(screen.getByText('OSM Teams Developers')).toBeInTheDocument());
    expect(screen.getByText('SOTMUS 2023')).toBeInTheDocument();
    expect(screen.getByText('My Friends')).toBeInTheDocument();
    expect(screen.getAllByText('Cancel').length).toBe(2);
    // Select a team
    await userEvent.click(screen.getByText('OSM Teams Developers'));
    await waitFor(() => expect(screen.getByTitle('geohacker')).toBeInTheDocument());
    expect(screen.getByText('Selected team')).toBeInTheDocument();
    expect(screen.getByText('Back')).toBeInTheDocument();
    expect(screen.getAllByText('Managers').length).toBe(2);
    expect(screen.getAllByText('Members').length).toBe(2);
    await userEvent.click(screen.getByText('Confirm selection'));
    // Modal closes
    await waitFor(() =>
      expect(screen.getByTitle('Open on OSM Teams').href.endsWith('/teams/1')).toBeTruthy()
    );
    expect(screen.queryByText('Selected team')).not.toBeInTheDocument();
    expect(screen.getByTitle('kamicut')).toBeInTheDocument();
    expect(screen.getByTitle('geohacker')).toBeInTheDocument();
    expect(screen.getByTitle('wille')).toBeInTheDocument();
    expect(screen.getByTitle('sanjayb')).toBeInTheDocument();
    expect(screen.getByText('OSM Teams Developers')).toBeInTheDocument();
    const radios = screen.getAllByRole('radio');
    expect(radios.length).toBe(6);
    // OSM Teams join method is checked and disabled
    expect(radios.slice(0, 2).filter((i) => i.checked)).toEqual([]);
    expect(radios[3].checked).toBeTruthy();
    expect(radios[3].disabled).toBeTruthy();
    // Privacy options are enabled and public is selected
    expect(radios[4].checked).toBeTruthy();
    expect(radios[4].disabled).toBeFalsy();
    expect(radios[5].disabled).toBeFalsy();
  });
});

describe('Edit Team', () => {
  it('should display default details of the team before editing', async () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <EditTeam id={123} />
      </ReduxIntlProviders>,
    );
    const nameInput = screen.getAllByRole('textbox')[0];
    await waitFor(() => expect(nameInput.value).toBe('Team Test'));
    expect(screen.getAllByRole('textbox')[1].value).toBe('Dummy team test');

    await waitFor(() => expect(screen.getByText('Organisation Name 123')).toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'sample_user' })).toBeInTheDocument();
  });

  it('should display save and cancel button when project details are changed', async () => {
    const { user } = renderWithRouter(
      <ReduxIntlProviders>
        <EditTeam id={123} />
      </ReduxIntlProviders>,
    );
    const nameInput = screen.getAllByRole('textbox')[0];
    await waitFor(() => expect(nameInput.value).toBe('Team Test'));
    await user.clear(nameInput);
    await user.type(nameInput, 'Changed Team Test');
    const saveButton = screen.getByRole('button', {
      name: /save/i,
    });
    const cancelButton = screen.getByRole('button', {
      name: /cancel/i,
    });
    expect(saveButton).toBeInTheDocument();
    expect(cancelButton).toBeInTheDocument();
  });

  it('should hide the save button on successful updation of team details', async () => {
    const { user } = renderWithRouter(
      <ReduxIntlProviders>
        <EditTeam id={123} />
      </ReduxIntlProviders>,
    );
    const nameInput = screen.getAllByRole('textbox')[0];
    await waitFor(() => expect(nameInput.value).toBe('Team Test'));
    await user.clear(nameInput);
    await user.type(nameInput, 'Changed Team Test');
    const saveButton = screen.getByRole('button', {
      name: /save/i,
    });
    await user.click(saveButton);
    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1));
    expect(saveButton).not.toBeInTheDocument();
  });

  it('should display callout alert error when team info cannot be updated', async () => {
    setupFaultyHandlers();
    const { user } = renderWithRouter(
      <ReduxIntlProviders>
        <EditTeam id={123} />
      </ReduxIntlProviders>,
    );
    const nameInput = screen.getAllByRole('textbox')[0];
    await waitFor(() => expect(nameInput.value).toBe('Team Test'));
    await user.clear(nameInput);
    await user.type(nameInput, 'Changed Team Test');
    const saveButton = screen.getByRole('button', {
      name: /save/i,
    });
    await user.click(saveButton);
    await waitFor(() =>
      expect(
        screen.getByText(/Failed to update team information. Please try again/i),
      ).toBeInTheDocument(),
    );
  });

  it('Enable OSM Teams sync', async () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <EditTeam id={123} />
      </ReduxIntlProviders>,
    );
    act(() => {
      store.dispatch({
        type: 'SET_USER_DETAILS',
        userDetails: { id: 122, username: 'test_user', role: 'ADMIN' },
      });
      store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
      store.dispatch({
        type: 'SET_OSM_TEAMS_TOKEN',
        osmteams_token: 'abc123',
      });
    });
    // Open OSM Teams selection modal
    await userEvent.click(screen.getByText('Select a team from OSM Teams'));
    await waitFor(() => expect(screen.getByText('OSM Teams Developers')).toBeInTheDocument());
    expect(screen.getByText('SOTMUS 2023')).toBeInTheDocument();
    expect(screen.getByText('My Friends')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    // Select a team
    await userEvent.click(screen.getByText('OSM Teams Developers'));
    await waitFor(() => expect(screen.getByTitle('geohacker')).toBeInTheDocument());
    expect(screen.getByText('Selected team')).toBeInTheDocument();
    expect(screen.getByText('Back')).toBeInTheDocument();
    expect(screen.getAllByText('Managers').length).toBe(2);
    expect(screen.getAllByText('Members').length).toBe(2);
    await userEvent.click(screen.getByText('Confirm selection'));
    // Modal closes
    await waitFor(() =>
      expect(screen.getByTitle('Open on OSM Teams').href.endsWith('/teams/1')).toBeTruthy()
    );
    expect(screen.queryByText('Selected team')).not.toBeInTheDocument();
    expect(screen.getByTitle('kamicut')).toBeInTheDocument();
    expect(screen.getByTitle('geohacker')).toBeInTheDocument();
    expect(screen.getByTitle('wille')).toBeInTheDocument();
    expect(screen.getByTitle('sanjayb')).toBeInTheDocument();
    expect(screen.getByText('OSM Teams Developers')).toBeInTheDocument();
  });
});

describe('Delete Team', () => {
  const setup = async () => {
    const { user, history } = renderWithRouter(
      <ReduxIntlProviders>
        <EditTeam id={123} />
      </ReduxIntlProviders>,
    );

    const deleteButton = screen.getByRole('button', {
      name: /delete/i,
    });

    await user.click(deleteButton);
    return {
      user,
      history,
      deleteButton,
    };
  };

  it('should ask for confirmation when user tries to delete a team', async () => {
    await setup();
    const deleteDialog = screen.getByRole('dialog');
    expect(
      within(deleteDialog).getByRole('heading', {
        name: 'Are you sure you want to delete this team?',
      }),
    ).toBeInTheDocument();
  });

  it('should close the confirmation dialog when cancel is clicked', async () => {
    const { user } = await setup();
    const cancelButton = screen.getByRole('button', {
      name: /cancel/i,
    });
    await user.click(cancelButton);
    expect(
      screen.queryByText('Are you sure you want to delete this team?'),
    ).not.toBeInTheDocument();
  });

  it('should direct to teams list page on successful deletion of a team', async () => {
    const { user, router } = createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <EditTeam id={123} />
      </ReduxIntlProviders>,
      {
        route: '/manage/teams/123',
      },
    );

    const deleteButton = screen.getByRole('button', {
      name: /delete/i,
    });
    await user.click(deleteButton);
    const dialog = await screen.findByRole('dialog');
    const deleteConfirmationButton = within(dialog).getByRole('button', {
      name: /delete/i,
    });
    await user.click(deleteConfirmationButton);
    expect(await screen.findByText('Team deleted successfully.')).toBeInTheDocument();
    await waitFor(() => expect(router.state.location.pathname).toBe('/manage/teams'));
  });

  it('should display toast message if the team deletion fails', async () => {
    setupFaultyHandlers();
    const { user } = createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <EditTeam id={123} />
      </ReduxIntlProviders>,
      {
        route: '/manage/teams/123',
      },
    );

    const deleteButton = screen.getByRole('button', {
      name: /delete/i,
    });
    await user.click(deleteButton);
    const dialog = await screen.findByRole('dialog');
    const deleteConfirmationButton = within(dialog).getByRole('button', {
      name: /delete/i,
    });
    await user.click(deleteConfirmationButton);
    await waitFor(() =>
      expect(
        screen.getByText(/An error occurred when trying to delete this team./i),
      ).toBeInTheDocument(),
    );
  });
});

test('MyTeams Component renders its child component', () => {
  renderWithRouter(
    <QueryParamProvider adapter={ReactRouter6Adapter}>
      <ReduxIntlProviders>
        <MyTeams />
      </ReduxIntlProviders>
    </QueryParamProvider>,
  );
  expect(
    screen.getByRole('heading', {
      name: /my teams/i,
    }),
  ).toBeInTheDocument();
});
