import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import {
  createComponentWithMemoryRouter,
  ReduxIntlProviders,
  renderWithRouter,
} from '../../utils/testWithIntl';
import { ListInterests, CreateInterest, EditInterest } from '../interests';

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
    const { container, router } = createComponentWithMemoryRouter(
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
    fireEvent.click(
      screen.getByRole('link', {
        name: /Interest Name 1/i,
      }),
    );
    await waitFor(() => expect(router.state.location.pathname).toBe('/manage/interests/1/'));
  });
});

describe('Create Interest', () => {
  const setup = () => {
    const { history } = renderWithRouter(
      <ReduxIntlProviders>
        <CreateInterest />
      </ReduxIntlProviders>,
    );
    const createButton = screen.getByRole('button', { name: /create category/i });
    const cancelButton = screen.getByRole('button', {
      name: /cancel/i,
    });
    return {
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
    const { createButton } = setup();
    const nameInput = screen.getByRole('textbox');
    fireEvent.change(nameInput, { target: { value: 'New interest Name' } });
    expect(createButton).toBeEnabled();
  });

  it('should navigate to the newly created interest detail page on creation success', async () => {
    const { router } = createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <CreateInterest />
      </ReduxIntlProviders>,
    );
    const createButton = screen.getByRole('button', { name: /create category/i });
    const nameInput = screen.getByRole('textbox');
    fireEvent.change(nameInput, { target: { value: 'New interest Name' } });
    fireEvent.click(createButton);
    await waitFor(() => expect(router.state.location.pathname).toBe('/manage/categories/123'));
  });

  // TODO: When cancel button is clicked, the app should navigate to a previous relative path
});

describe('Edit Interest', () => {
  const setup = () => {
    const { history } = renderWithRouter(
      <ReduxIntlProviders>
        <EditInterest id={1} />
      </ReduxIntlProviders>,
    );
    const nameInput = screen.getByRole('textbox');

    return {
      nameInput,
      history,
    };
  };

  it('should display the interest name by default', async () => {
    const { nameInput } = setup();
    await waitFor(() => expect(nameInput.value).toBe('Interest Name 123'));
  });

  it('should display save button when interest name is changed', async () => {
    const { nameInput } = setup();
    await waitFor(() => expect(nameInput.value).toBe('Interest Name 123'));
    fireEvent.change(nameInput, { target: { value: 'Changed Interest Name' } });
    const saveButton = screen.getByRole('button', {
      name: /save/i,
    });
    expect(saveButton).toBeInTheDocument();
  });

  it('should also display cancel button when project name is changed', async () => {
    const { nameInput } = setup();
    await waitFor(() => expect(nameInput.value).toBe('Interest Name 123'));
    fireEvent.change(nameInput, { target: { value: 'Changed Interest Name' } });
    const cancelButton = screen.getByRole('button', {
      name: /cancel/i,
    });
    expect(cancelButton).toBeInTheDocument();
  });

  it('should return input text value to default when cancel button is clicked', async () => {
    const { nameInput } = setup();
    await waitFor(() => expect(nameInput.value).toBe('Interest Name 123'));
    fireEvent.change(nameInput, { target: { value: 'Changed Interest Name' } });
    const cancelButton = screen.getByRole('button', {
      name: /cancel/i,
    });
    fireEvent.click(cancelButton);
    expect(nameInput.value).toBe('Interest Name 123');
  });

  it('should hide the save button on click', async () => {
    const { nameInput } = setup();
    await waitFor(() => expect(nameInput.value).toBe('Interest Name 123'));
    fireEvent.change(nameInput, { target: { value: 'Changed Interest Name' } });
    const saveButton = screen.getByRole('button', { name: /save/i });
    const cancelButton = screen.getByRole('button', {
      name: /cancel/i,
    });
    fireEvent.click(saveButton);
    expect(saveButton).not.toBeInTheDocument();
    expect(cancelButton).not.toBeInTheDocument();
  });
});
