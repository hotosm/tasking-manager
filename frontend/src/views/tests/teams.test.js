import '@testing-library/jest-dom';
import { screen, waitFor, within, act } from '@testing-library/react';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';
import { QueryParamProvider } from 'use-query-params';
import toast from 'react-hot-toast';

import {
  createComponentWithMemoryRouter,
  QueryClientProviders,
  ReduxIntlProviders,
  renderWithRouter,
} from '../../utils/testWithIntl';
import { ManageTeams, EditTeam, CreateTeam, MyTeams } from '../teams';
import { store } from '../../store';
import { setupFaultyHandlers } from '../../network/tests/server';

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

describe('List Teams', () => {
  it('should show loading placeholder when teams are being fetched', async () => {
    const { container } = renderWithRouter(
      <QueryClientProviders>
        <QueryParamProvider adapter={ReactRouter6Adapter}>
          <ReduxIntlProviders>
            <ManageTeams />
          </ReduxIntlProviders>
        </QueryParamProvider>
      </QueryClientProviders>,
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
      <QueryClientProviders>
        <QueryParamProvider adapter={ReactRouter6Adapter}>
          <ReduxIntlProviders>
            <ManageTeams />
          </ReduxIntlProviders>
        </QueryParamProvider>
      </QueryClientProviders>,
    );
    await waitFor(() =>
      expect(container.getElementsByClassName('show-loading-animation').length).toBe(0),
    );

    expect(screen.getByRole('heading', { name: /team test/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /test kll team/i })).toBeInTheDocument();
  });

  it('should navigate to team detail page on team article click', async () => {
    const { user, router, container } = createComponentWithMemoryRouter(
      <QueryClientProviders>
        <QueryParamProvider adapter={ReactRouter6Adapter}>
          <ReduxIntlProviders>
            <ManageTeams />
          </ReduxIntlProviders>
        </QueryParamProvider>
      </QueryClientProviders>,
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

describe('Edit Team', () => {
  it('should display default details of the team before editing', async () => {
    await act(() => {
      store.dispatch({
        type: 'SET_USER_DETAILS',
        userDetails: { id: 122, username: 'test_user', role: 'ADMIN' },
      });
      store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
    });
    renderWithRouter(
      <ReduxIntlProviders>
        <EditTeam id={123} />
      </ReduxIntlProviders>,
    );
    const nameInput = screen.getAllByRole('textbox')[0];
    await waitFor(() => expect(nameInput).toHaveValue('Team Test'));
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
    <QueryClientProviders>
      <QueryParamProvider adapter={ReactRouter6Adapter}>
        <ReduxIntlProviders>
          <MyTeams />
        </ReduxIntlProviders>
      </QueryParamProvider>
    </QueryClientProviders>,
  );
  expect(
    screen.getByRole('heading', {
      name: /my teams/i,
    }),
  ).toBeInTheDocument();
});
