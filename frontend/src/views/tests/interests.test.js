import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import toast from 'react-hot-toast';

import {
  createComponentWithMemoryRouter,
  ReduxIntlProviders,
  renderWithRouter,
} from '../../utils/testWithIntl';
import { ListInterests, CreateInterest, EditInterest } from '../interests';
import { setupFaultyHandlers } from '../../network/tests/server';

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
}));

describe('List Interests', () => {
  const setup = () => {
    const { container, history } = renderWithRouter(
      <ReduxIntlProviders>
        <ListInterests />
      </ReduxIntlProviders>,
      {
        route: '/manage/interests',
      },
    );
    return {
      container,
      history,
    };
  };

  it('should show loading placeholder when interests are being fetched', () => {
    const { container } = setup();
    expect(container.getElementsByClassName('show-loading-animation').length).toBe(4);
  });

  it('should list interests fetched', async () => {
    const { container } = setup();
    await waitFor(() =>
      expect(container.getElementsByClassName('show-loading-animation').length).toBe(0),
    );
    expect(screen.getByRole('heading', { name: /Interest Name 1/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Interest Name Two/i })).toBeInTheDocument();
  });

  it('should navigate to interest edit page when clicked on the interest card', async () => {
    const { user, container, router } = createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <ListInterests />
      </ReduxIntlProviders>,
      {
        route: '/manage/interests',
      },
    );
    await waitFor(() =>
      expect(container.getElementsByClassName('show-loading-animation').length).toBe(0),
    );
    await user.click(
      screen.getByRole('link', {
        name: /Interest Name 1/i,
      }),
    );
    await waitFor(() => expect(router.state.location.pathname).toBe('/manage/interests/1/'));
  });
});

describe('Create Interest', () => {
  const setup = () => {
    const { user, history } = renderWithRouter(
      <ReduxIntlProviders>
        <CreateInterest />
      </ReduxIntlProviders>,
    );
    const createButton = screen.getByRole('button', { name: /create category/i });
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

  it('should disable create interest button by default', async () => {
    const { createButton } = setup();
    expect(createButton).toBeDisabled();
  });

  it('should enable create interest button when the value is changed', async () => {
    const { user, createButton } = setup();
    const nameInput = screen.getByRole('textbox');
    await user.clear(nameInput);
    await user.type(nameInput, 'New interest Name');
    expect(createButton).toBeEnabled();
  });

  it('should navigate to the newly created interest detail page on creation success', async () => {
    const { user, router } = createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <CreateInterest />
      </ReduxIntlProviders>,
    );
    const createButton = screen.getByRole('button', { name: /create category/i });
    const nameInput = screen.getByRole('textbox');
    await user.clear(nameInput);
    await user.type(nameInput, 'New interest Name');
    await user.click(createButton);
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledTimes(1);
      expect(router.state.location.pathname).toBe('/manage/categories/123');
    });
  });

  it('should display callout alert with error has occured message', async () => {
    setupFaultyHandlers();
    const { user } = createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <CreateInterest />
      </ReduxIntlProviders>,
    );
    const createButton = screen.getByRole('button', { name: /create category/i });
    const nameInput = screen.getByRole('textbox');
    await user.clear(nameInput);
    await user.type(nameInput, 'New interest Name');
    await user.click(createButton);
    await waitFor(() => {
      expect(screen.getByText(/Failed to create category. Please try again./i)).toBeInTheDocument();
    });
  });

  // TODO: When cancel button is clicked, the app should navigate to a previous relative path
});

describe('Edit Interest', () => {
  const setup = () => {
    const { user } = createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <EditInterest />
      </ReduxIntlProviders>,
      {
        route: '/interests/:id',
        entryRoute: '/interests/1',
      },
    );
    const nameInput = screen.getByRole('textbox');

    return {
      user,
      nameInput,
    };
  };

  it('should display the interest name by default', async () => {
    const { nameInput } = setup();
    await waitFor(() => expect(nameInput.value).toBe('Interest Name 123'));
  });

  it('should display save button when interest name is changed', async () => {
    const { user, nameInput } = setup();
    await waitFor(() => expect(nameInput.value).toBe('Interest Name 123'));
    await user.clear(nameInput);
    await user.type(nameInput, 'Changed Interest Name');
    const saveButton = screen.getByRole('button', {
      name: /save/i,
    });
    expect(saveButton).toBeInTheDocument();
  });

  it('should also display cancel button when project name is changed', async () => {
    const { user, nameInput } = setup();
    await waitFor(() => expect(nameInput.value).toBe('Interest Name 123'));
    await user.clear(nameInput);
    await user.type(nameInput, 'Changed Interest Name');
    const cancelButton = screen.getByRole('button', {
      name: /cancel/i,
    });
    expect(cancelButton).toBeInTheDocument();
  });

  it('should return input text value to default when cancel button is clicked', async () => {
    const { user, nameInput } = setup();
    await waitFor(() => expect(nameInput.value).toBe('Interest Name 123'));
    await user.clear(nameInput);
    await user.type(nameInput, 'Changed Interest Name');
    const cancelButton = screen.getByRole('button', {
      name: /cancel/i,
    });
    await user.click(cancelButton);
    expect(nameInput.value).toBe('Interest Name 123');
  });

  it('should hide the save button on click', async () => {
    const { user, nameInput } = setup();
    await waitFor(() => expect(nameInput.value).toBe('Interest Name 123'));
    await user.clear(nameInput);
    await user.type(nameInput, 'Changed Interest Name');
    const saveButton = screen.getByRole('button', { name: /save/i });
    const cancelButton = screen.getByRole('button', {
      name: /cancel/i,
    });
    await user.click(saveButton);
    await waitFor(() => expect(saveButton).not.toBeInTheDocument());
    expect(cancelButton).not.toBeInTheDocument();
  });
});
