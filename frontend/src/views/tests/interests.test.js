import React from 'react';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ReduxIntlProviders, renderWithRouter } from '../../utils/testWithIntl';
import { ListInterests, CreateInterest, EditInterest } from '../interests';

describe('List Interests', () => {
  const setup = () => {
    const { container, history } = renderWithRouter(
      <ReduxIntlProviders path="/manage/interest">
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
    const { container, history } = setup();
    await waitFor(() =>
      expect(container.getElementsByClassName('show-loading-animation').length).toBe(0),
    );
    fireEvent.click(
      screen.getByRole('link', {
        name: /Interest Name 1/i,
      }),
    );
    await waitFor(() => expect(history.location.pathname).toBe('/1'));
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
    const { history, createButton } = setup();
    const nameInput = screen.getByRole('textbox');
    fireEvent.change(nameInput, { target: { value: 'New interest Name' } });
    fireEvent.click(createButton);
    await waitFor(() => expect(history.location.pathname).toBe('/manage/categories/123'));
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

describe('Delete Interest', () => {
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

  it('should ask for confirmation when user tries to delete an interest', async () => {
    setup();
    expect(await screen.findByText('NRCS_Duduwa Mapping')).toBeInTheDocument();
    const deleteButton = screen.getByRole('button', {
      name: /delete/i,
    });
    fireEvent.click(deleteButton);
    expect(screen.getByText('Are you sure you want to delete this category?')).toBeInTheDocument();
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
      screen.queryByRole('heading', {
        name: 'Are you sure you want to delete this category?',
      }),
    ).not.toBeInTheDocument();
  });

  it('should direct to interests list page on successful deletion of an interest', async () => {
    const { history } = setup();
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
    expect(
      await screen.findByRole('heading', { name: /interest deleted successfully./i }),
    ).toBeInTheDocument();
    await waitFor(() => expect(history.location.pathname).toBe('/manage/interests'));
  });
});
