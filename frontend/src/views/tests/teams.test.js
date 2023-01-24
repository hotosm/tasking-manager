import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ReduxIntlProviders, renderWithRouter } from '../../utils/testWithIntl';
import { ManageTeams, EditTeam, CreateTeam, MyTeams } from '../teams';
import { store } from '../../store';

describe('List Teams', () => {
  it('should show loading placeholder when teams are being fetched', async () => {
    const { container } = renderWithRouter(
      <ReduxIntlProviders>
        <ManageTeams />
      </ReduxIntlProviders>,
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
    const { container } = render(
      <ReduxIntlProviders>
        <ManageTeams />
      </ReduxIntlProviders>,
    );
    await waitFor(() =>
      expect(container.getElementsByClassName('show-loading-animation').length).toBe(0),
    );

    expect(screen.getByRole('heading', { name: /team test/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /test kll team/i })).toBeInTheDocument();
  });

  it('should navigate to team detail page on team article click', async () => {
    const { history, container } = renderWithRouter(
      <ReduxIntlProviders>
        <ManageTeams />
      </ReduxIntlProviders>,
    );
    await waitFor(() =>
      expect(container.getElementsByClassName('show-loading-animation').length).toBe(0),
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole('heading', { name: /team test/i }));
    await waitFor(() => expect(history.location.pathname).toBe('/teams/1/membership/'));
  });
});

describe('Create Team', () => {
  const setup = () => {
    const { history } = renderWithRouter(
      <ReduxIntlProviders>
        <CreateTeam />
      </ReduxIntlProviders>,
    );
    const user = userEvent.setup();
    const createButton = screen.getByRole('button', {
      name: /create team/i,
    });

    return {
      user,
      createButton,
      history,
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
    const { createButton, history, user } = setup();
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
    await waitFor(() => expect(history.location.pathname).toBe('/manage/teams/123'));
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
    renderWithRouter(
      <ReduxIntlProviders>
        <EditTeam id={123} />
      </ReduxIntlProviders>,
    );
    const nameInput = screen.getAllByRole('textbox')[0];
    await waitFor(() => expect(nameInput.value).toBe('Team Test'));
    fireEvent.change(nameInput, { target: { value: 'Changed Team Test' } });
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
    renderWithRouter(
      <ReduxIntlProviders>
        <EditTeam id={123} />
      </ReduxIntlProviders>,
    );
    const user = userEvent.setup();
    const nameInput = screen.getAllByRole('textbox')[0];
    await waitFor(() => expect(nameInput.value).toBe('Team Test'));
    fireEvent.change(nameInput, { target: { value: 'Changed Team Test' } });
    const saveButton = screen.getByRole('button', {
      name: /save/i,
    });
    await user.click(saveButton);
    expect(saveButton).not.toBeInTheDocument();
  });
});

describe('Delete Team', () => {
  const setup = () => {
    const { history } = renderWithRouter(
      <ReduxIntlProviders>
        <EditTeam id={123} />
      </ReduxIntlProviders>,
    );

    const deleteButton = screen.getByRole('button', {
      name: /delete/i,
    });

    fireEvent.click(deleteButton);
    return {
      history,
      deleteButton,
    };
  };

  it('should ask for confirmation when user tries to delete a team', async () => {
    setup();
    const deleteDialog = screen.getByRole('dialog');
    expect(
      within(deleteDialog).getByRole('heading', {
        name: 'Are you sure you want to delete this team?',
      }),
    ).toBeInTheDocument();
  });

  it('should close the confirmation dialog when cancel is clicked', async () => {
    setup();
    const cancelButton = screen.getByRole('button', {
      name: /cancel/i,
    });
    fireEvent.click(cancelButton);
    expect(
      screen.queryByText('Are you sure you want to delete this team?'),
    ).not.toBeInTheDocument();
  });

  it('should direct to teams list page on successful deletion of a team', async () => {
    const { history } = setup();
    const dialog = screen.getByRole('dialog');
    const deleteConfirmationButton = within(dialog).getByRole('button', {
      name: /delete/i,
    });
    fireEvent.click(deleteConfirmationButton);
    expect(await screen.findByText('Team deleted successfully.')).toBeInTheDocument();
    await waitFor(() => expect(history.location.pathname).toBe('/manage/teams'));
  });
});

test('MyTeams Component renders its child component', () => {
  render(
    <ReduxIntlProviders>
      <MyTeams />
    </ReduxIntlProviders>,
  );
  expect(
    screen.getByRole('heading', {
      name: /my teams/i,
    }),
  ).toBeInTheDocument();
});
