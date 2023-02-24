import '@testing-library/jest-dom';
import React from 'react';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { act } from '@testing-library/react-hooks';
import userEvent from '@testing-library/user-event';

import {
  createComponentWithMemoryRouter,
  ReduxIntlProviders,
  renderWithRouter,
} from '../../utils/testWithIntl';
import { ListOrganisations, CreateOrganisation, EditOrganisation } from '../organisationManagement';
import { store } from '../../store/';

describe('List Interests', () => {
  const setup = () => {
    const userDetails = { id: 1, role: 'ADMIN' };
    act(() => {
      store.dispatch({ type: 'SET_USER_DETAILS', userDetails: userDetails });
      store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
    });
    const { container } = createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <ListOrganisations />
      </ReduxIntlProviders>,
    );
    return {
      container,
    };
  };

  it('should show loading placeholder when interests are being fetched', () => {
    const { container } = setup();
    expect(container.getElementsByClassName('show-loading-animation').length).toBe(4 * 5);
  });

  it('should fetch and list campaigns', async () => {
    const { container } = setup();
    await waitFor(() =>
      expect(container.getElementsByClassName('show-loading-animation').length).toBe(0),
    );
    expect(screen.getByRole('heading', { name: 'American Red Cross' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Organisation Name 123' })).toBeInTheDocument();
  });

  it('should only display relevant organizations when they are searched', async () => {
    const { container } = setup();
    await waitFor(() =>
      expect(container.getElementsByClassName('show-loading-animation').length).toBe(0),
    );
    const searchBox = screen.getByRole('textbox');
    const user = userEvent.setup();
    await user.type(searchBox, 'red');
    expect(screen.getByRole('heading', { name: 'American Red Cross' })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Organisation Name 123' }),
    ).not.toBeInTheDocument();
  });
});

describe('Create Organization', () => {
  const setup = () => {
    const { router } = createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <CreateOrganisation />
      </ReduxIntlProviders>,
    );
    const createButton = screen.getByRole('button', {
      name: /create organization/i,
    });
    const cancelButton = screen.getByRole('button', {
      name: /cancel/i,
    });
    return {
      createButton,
      cancelButton,
      router,
    };
  };

  it('should disable create organization button by default', async () => {
    const { createButton } = setup();
    expect(createButton).toBeDisabled();
  });

  it('should enable create organization button when the value is changed', async () => {
    const { createButton } = setup();
    const nameInput = screen.getAllByRole('textbox')[0];
    const user = userEvent.setup();
    await user.type(nameInput, 'New Organization Name');
    expect(createButton).toBeEnabled();
  });

  it('should navigate to the newly created campaign detail page on creation success', async () => {
    const { router, createButton } = setup();
    const nameInput = screen.getAllByRole('textbox')[0];
    const user = userEvent.setup();
    await user.type(nameInput, 'New Organization Name');
    const subscriptionType = screen.getByRole('combobox');
    fireEvent.mouseDown(subscriptionType);
    user.click(screen.getByText('Free'));
    user.click(createButton);
    await waitFor(() => expect(router.state.location.pathname).toBe('/manage/organisations/123'));
  });

  // TODO: When cancel button is clicked, the app should navigate to a previous relative path
});

describe('EditCampaign', () => {
  const setup = () => {
    const { container, history } = renderWithRouter(
      <ReduxIntlProviders>
        <EditOrganisation id={123} />
      </ReduxIntlProviders>,
    );

    return {
      container,
      history,
    };
  };

  it('should display the campaign name by default', async () => {
    setup();
    await waitFor(() => expect(screen.getByText('Manage organization')).toBeInTheDocument());
    const nameInput = screen.getAllByRole('textbox')[0];
    expect(nameInput.value).toBe('Organisation Name 123');
  });

  it('should display save button when project name is changed', async () => {
    setup();
    await waitFor(() => expect(screen.getByText('Manage organization')).toBeInTheDocument());
    const nameInput = screen.getAllByRole('textbox')[0];
    fireEvent.change(nameInput, { target: { value: 'Changed Organisation Name' } });
    const saveButton = screen.getByRole('button', {
      name: /save/i,
    });
    expect(saveButton).toBeInTheDocument();
  });

  it('should also display cancel button when project name is changed', async () => {
    setup();
    await waitFor(() => expect(screen.getByText('Manage organization')).toBeInTheDocument());
    const nameInput = screen.getAllByRole('textbox')[0];
    fireEvent.change(nameInput, { target: { value: 'Changed Organisation Name' } });
    const cancelButton = screen.getByRole('button', {
      name: /cancel/i,
    });
    expect(cancelButton).toBeInTheDocument();
  });

  it('should return input text value to default when cancel button is clicked', async () => {
    setup();
    await waitFor(() => expect(screen.getByText('Manage organization')).toBeInTheDocument());
    const nameInput = screen.getAllByRole('textbox')[0];
    fireEvent.change(nameInput, { target: { value: 'Changed Organisation Name' } });
    const cancelButton = screen.getByRole('button', {
      name: /cancel/i,
    });
    fireEvent.click(cancelButton);
    expect(nameInput.value).toBe('Organisation Name 123');
  });

  it('should display project cards under the organisation', async () => {
    setup();
    expect(
      await screen.findByRole('heading', {
        name: 'NRCS_Khajura Mapping',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'NRCS_Duduwa Mapping',
      }),
    ).toBeInTheDocument();
  });

  it('should hide the save button after organisation edit is successful', async () => {
    setup();
    await waitFor(() => expect(screen.getByText('Manage organization')).toBeInTheDocument());
    const nameInput = screen.getAllByRole('textbox')[0];
    fireEvent.change(nameInput, { target: { value: 'Changed Organisation Name' } });
    const saveButton = screen.getByRole('button', { name: /save/i });
    const cancelButton = screen.getByRole('button', {
      name: /cancel/i,
    });
    fireEvent.click(saveButton);
    expect(saveButton).not.toBeInTheDocument();
    expect(cancelButton).not.toBeInTheDocument();
  });
});

describe('Delete Campaign', () => {
  const setup = () => {
    const { router } = createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <EditOrganisation id={123} />
      </ReduxIntlProviders>,
    );

    return {
      router,
    };
  };

  it('should ask for confirmation when user tries to delete a organization', async () => {
    setup();
    expect(await screen.findByText('NRCS_Duduwa Mapping')).toBeInTheDocument();
    const deleteButton = screen.getByRole('button', {
      name: /delete/i,
    });
    fireEvent.click(deleteButton);
    expect(
      screen.getByText('Are you sure you want to delete this organization?'),
    ).toBeInTheDocument();
  });

  it('should close the confirmation popup when cancel is clicked', async () => {
    setup();
    expect(await screen.findByText('NRCS_Duduwa Mapping')).toBeInTheDocument();
    const deleteButton = screen.getByRole('button', {
      name: /delete/i,
    });
    fireEvent.click(deleteButton);
    const cancelButton = screen.getByRole('button', {
      name: /cancel/i,
    });
    fireEvent.click(cancelButton);
    expect(
      screen.queryByText('Are you sure you want to delete this organization?'),
    ).not.toBeInTheDocument();
  });

  it('should direct to organizations list page on successful deletion of a organization', async () => {
    const { router } = setup();
    expect(await screen.findByText('NRCS_Duduwa Mapping')).toBeInTheDocument();
    const deleteButton = screen.getByRole('button', {
      name: /delete/i,
    });
    fireEvent.click(deleteButton);
    const dialog = screen.getByRole('dialog');
    const deleteConfirmationButton = within(dialog).getByRole('button', {
      name: /delete/i,
    });
    fireEvent.click(deleteConfirmationButton);
    await waitFor(() =>
      expect(screen.getByText('Organisation deleted successfully.')).toBeInTheDocument(),
    );
    await waitFor(() => expect(router.state.location.pathname).toEqual('/manage/organisations'));
  });
});
