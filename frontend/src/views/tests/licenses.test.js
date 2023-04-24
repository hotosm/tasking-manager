import { screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import toast from 'react-hot-toast';

import {
  createComponentWithMemoryRouter,
  ReduxIntlProviders,
  renderWithRouter,
} from '../../utils/testWithIntl';
import { ListLicenses, CreateLicense, EditLicense } from '../licenses';
import { setupFaultyHandlers } from '../../network/tests/server';

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
}));

describe('List Licenses', () => {
  const setup = () => {
    const { container, history } = renderWithRouter(
      <ReduxIntlProviders path="/manage/licenses">
        <ListLicenses />
      </ReduxIntlProviders>,
      {
        route: '/manage/licenses',
      },
    );
    return {
      container,
      history,
    };
  };

  it('should show loading placeholder when licenses are being fetched', () => {
    const { container } = setup();
    expect(container.getElementsByClassName('show-loading-animation').length).toBe(4);
  });

  it('should list licenses fetched', async () => {
    const { container } = setup();
    await waitFor(() =>
      expect(container.getElementsByClassName('show-loading-animation').length).toBe(0),
    );
    expect(screen.getByRole('heading', { name: /license 1/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /license second/i })).toBeInTheDocument();
  });

  it('should navigate to license edit page when clicked on the license card', async () => {
    const { user, container, router } = createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <ListLicenses />
      </ReduxIntlProviders>,
      {
        route: '/manage/licenses',
      },
    );
    await waitFor(() =>
      expect(container.getElementsByClassName('show-loading-animation').length).toBe(0),
    );
    await user.click(
      screen.getByRole('link', {
        name: /license 1/i,
      }),
    );
    await waitFor(() => expect(router.state.location.pathname).toBe('/manage/licenses/1/'));
  });
});

describe('Create License', () => {
  const setup = () => {
    const { user, history } = renderWithRouter(
      <ReduxIntlProviders>
        <CreateLicense />
      </ReduxIntlProviders>,
    );
    const createButton = screen.getByRole('button', { name: /create license/i });
    const cancelButton = screen.getByRole('button', {
      name: /cancel/i,
    });
    return {
      user,
      createButton,
      cancelButton,
      history,
    };
  };

  it('should disable create license button by default', async () => {
    const { createButton } = setup();
    expect(createButton).toBeDisabled();
  });

  it('should enable create license button when the value is changed', async () => {
    const { user, createButton } = setup();
    const nameInput = screen.getAllByRole('textbox')[0];
    await user.clear(nameInput);
    await user.type(nameInput, 'New license Name');
    expect(createButton).toBeEnabled();
  });

  it('should navigate to the newly created license detail page on creation success', async () => {
    const { user, router } = createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <CreateLicense />
      </ReduxIntlProviders>,
    );
    const createButton = screen.getByRole('button', { name: /create license/i });
    const nameInput = screen.getAllByRole('textbox')[0];
    await user.clear(nameInput);
    await user.type(nameInput, 'New license Name');
    const descriptionInput = screen.getAllByRole('textbox')[1];
    await user.clear(descriptionInput);
    await user.type(descriptionInput, 'New license description');
    const plainTextInput = screen.getAllByRole('textbox')[2];
    await user.clear(plainTextInput);
    await user.type(plainTextInput, 'New license plain text');
    await user.click(createButton);
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledTimes(1);
      expect(router.state.location.pathname).toBe('/manage/licenses/123');
    });
  });

  it('should display toast with error has occured message', async () => {
    setupFaultyHandlers();
    const { user } = createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <CreateLicense />
      </ReduxIntlProviders>,
    );
    const createButton = screen.getByRole('button', { name: /create license/i });
    const nameInput = screen.getAllByRole('textbox')[0];
    await user.clear(nameInput);
    await user.type(nameInput, 'New license Name');
    const descriptionInput = screen.getAllByRole('textbox')[1];
    await user.clear(descriptionInput);
    await user.type(descriptionInput, 'New license description');
    const plainTextInput = screen.getAllByRole('textbox')[2];
    await user.clear(plainTextInput);
    await user.type(plainTextInput, 'New license plain text');
    await user.click(createButton);
    await waitFor(() =>
      expect(screen.getByText(/Failed to create license. Please try again./i)).toBeInTheDocument(),
    );
  });

  // TODO: When cancel button is clicked, the app should navigate to a previous relative path
});

describe('Edit License', () => {
  const setup = () => {
    const { user, history } = renderWithRouter(
      <ReduxIntlProviders>
        <EditLicense id={1} />
      </ReduxIntlProviders>,
    );
    const nameInput = screen.getAllByRole('textbox')[0];
    const descriptionInput = screen.getAllByRole('textbox')[1];
    const plainTextInput = screen.getAllByRole('textbox')[2];

    return {
      user,
      nameInput,
      descriptionInput,
      plainTextInput,
      history,
    };
  };

  it('should display the license name by default', async () => {
    const { nameInput, descriptionInput, plainTextInput } = setup();
    await waitFor(() => expect(nameInput.value).toBe('Sample License'));
    expect(descriptionInput.value).toBe('Sample license description for sample license');
    expect(plainTextInput.value).toBe(
      'Sample license plainText for sample description for sample license',
    );
  });

  it('should display save button when project name is changed', async () => {
    const { user, nameInput } = setup();
    await waitFor(() => expect(nameInput.value).toBe('Sample License'));
    await user.clear(nameInput);
    await user.type(nameInput, 'Changed License Name');
    const saveButton = screen.getByRole('button', {
      name: /save/i,
    });
    expect(saveButton).toBeInTheDocument();
  });

  it('should also display cancel button when project name is changed', async () => {
    const { user, nameInput } = setup();
    await waitFor(() => expect(nameInput.value).toBe('Sample License'));
    await user.clear(nameInput);
    await user.type(nameInput, 'Changed License Name');
    const cancelButton = screen.getByRole('button', {
      name: /cancel/i,
    });
    expect(cancelButton).toBeInTheDocument();
  });

  it('should return input text value to default when cancel button is clicked', async () => {
    const { user, nameInput } = setup();
    await waitFor(() => expect(nameInput.value).toBe('Sample License'));
    await user.clear(nameInput);
    await user.type(nameInput, 'Changed License Name');
    const cancelButton = screen.getByRole('button', {
      name: /cancel/i,
    });
    await user.click(cancelButton);
    expect(nameInput.value).toBe('Sample License');
  });

  it('should hide the save button on click', async () => {
    const { user, nameInput } = setup();
    await waitFor(() => expect(nameInput.value).toBe('Sample License'));
    await user.clear(nameInput);
    await user.type(nameInput, 'Changed License Name');
    const saveButton = screen.getByRole('button', { name: /save/i });
    const cancelButton = screen.getByRole('button', {
      name: /cancel/i,
    });
    await user.click(saveButton);
    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1));
    expect(saveButton).not.toBeInTheDocument();
    expect(cancelButton).not.toBeInTheDocument();
  });

  it('should display toast with error has occured message', async () => {
    setupFaultyHandlers();
    const { user, nameInput } = setup();
    await waitFor(() => expect(nameInput.value).toBe('Sample License'));
    await user.clear(nameInput);
    await user.type(nameInput, 'Changed License Name');
    const saveButton = screen.getByRole('button', { name: /save/i });
    const cancelButton = screen.getByRole('button', {
      name: /cancel/i,
    });
    await user.click(saveButton);
    await waitFor(() =>
      expect(
        screen.getByText(/Failed to update license information. Please try again/i),
      ).toBeInTheDocument(),
    );
    expect(saveButton).not.toBeInTheDocument();
    expect(cancelButton).not.toBeInTheDocument();
  });
});

describe('Delete License', () => {
  const setup = () => {
    const { user, history } = renderWithRouter(
      <ReduxIntlProviders>
        <EditLicense id={1} />
      </ReduxIntlProviders>,
    );
    const nameInput = screen.getAllByRole('textbox')[0];
    const descriptionInput = screen.getAllByRole('textbox')[1];
    const plainTextInput = screen.getAllByRole('textbox')[2];

    return {
      user,
      nameInput,
      descriptionInput,
      plainTextInput,
      history,
    };
  };

  it('should ask for confirmation when user tries to delete a license', async () => {
    const { user, nameInput } = setup();
    await waitFor(() => expect(nameInput.value).toBe('Sample License'));
    const deleteButton = screen.getByRole('button', {
      name: /delete/i,
    });
    await user.click(deleteButton);
    expect(screen.getByText('Are you sure you want to delete this license?')).toBeInTheDocument();
  });

  it('should close the confirmation popup when cancel is clicked', async () => {
    const { user, nameInput } = setup();
    await waitFor(() => expect(nameInput.value).toBe('Sample License'));
    const deleteButton = screen.getByRole('button', {
      name: /delete/i,
    });
    await user.click(deleteButton);
    const cancelButton = screen.getByRole('button', {
      name: /cancel/i,
    });
    await user.click(cancelButton);
    expect(
      screen.queryByText('Are you sure you want to delete this license?'),
    ).not.toBeInTheDocument();
  });

  it('should direct to licenses list page on successful deletion of a license', async () => {
    const { user, router } = createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <EditLicense id={1} />
      </ReduxIntlProviders>,
    );
    const nameInput = screen.getAllByRole('textbox')[0];
    await waitFor(() => expect(nameInput.value).toBe('Sample License'));
    const deleteButton = screen.getByRole('button', {
      name: /delete/i,
    });
    await user.click(deleteButton);
    const dialog = screen.getByRole('dialog');
    const deleteConfirmationButton = within(dialog).getByRole('button', {
      name: /delete/i,
    });
    await user.click(deleteConfirmationButton);
    expect(await screen.findByText('License deleted successfully.')).toBeInTheDocument();
    await waitFor(() => expect(router.state.location.pathname).toBe('/manage/licenses'));
  });
});
