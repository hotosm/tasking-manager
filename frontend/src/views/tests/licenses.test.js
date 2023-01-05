import React from 'react';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ReduxIntlProviders, renderWithRouter } from '../../utils/testWithIntl';
import { ListLicenses, CreateLicense, EditLicense } from '../licenses';

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
    const { container, history } = setup();
    await waitFor(() =>
      expect(container.getElementsByClassName('show-loading-animation').length).toBe(0),
    );
    fireEvent.click(
      screen.getByRole('link', {
        name: /license 1/i,
      }),
    );
    await waitFor(() => expect(history.location.pathname).toBe('/1'));
  });
});

describe('Create License', () => {
  const setup = () => {
    const { history } = renderWithRouter(
      <ReduxIntlProviders>
        <CreateLicense />
      </ReduxIntlProviders>,
    );
    const createButton = screen.getByRole('button', { name: /create license/i });
    const cancelButton = screen.getByRole('button', {
      name: /cancel/i,
    });
    return {
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
    const { createButton } = setup();
    const nameInput = screen.getAllByRole('textbox')[0];
    fireEvent.change(nameInput, { target: { value: 'New license Name' } });
    expect(createButton).toBeEnabled();
  });

  it('should navigate to the newly created license detail page on creation success', async () => {
    const { history, createButton } = setup();
    const nameInput = screen.getAllByRole('textbox')[0];
    fireEvent.change(nameInput, { target: { value: 'New license Name' } });
    const descriptionInput = screen.getAllByRole('textbox')[1];
    fireEvent.change(descriptionInput, { target: { value: 'New license description' } });
    const plainTextInput = screen.getAllByRole('textbox')[2];
    fireEvent.change(plainTextInput, { target: { value: 'New license plain text' } });
    fireEvent.click(createButton);
    await waitFor(() => expect(history.location.pathname).toBe('/manage/licenses/123'));
  });

  // TODO: When cancel button is clicked, the app should navigate to a previous relative path
});

describe('Edit License', () => {
  const setup = () => {
    const { history } = renderWithRouter(
      <ReduxIntlProviders>
        <EditLicense id={1} />
      </ReduxIntlProviders>,
    );
    const nameInput = screen.getAllByRole('textbox')[0];
    const descriptionInput = screen.getAllByRole('textbox')[1];
    const plainTextInput = screen.getAllByRole('textbox')[2];

    return {
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
    const { nameInput } = setup();
    await waitFor(() => expect(nameInput.value).toBe('Sample License'));
    fireEvent.change(nameInput, { target: { value: 'Changed License Name' } });
    const saveButton = screen.getByRole('button', {
      name: /save/i,
    });
    expect(saveButton).toBeInTheDocument();
  });

  it('should also display cancel button when project name is changed', async () => {
    const { nameInput } = setup();
    await waitFor(() => expect(nameInput.value).toBe('Sample License'));
    fireEvent.change(nameInput, { target: { value: 'Changed License Name' } });
    const cancelButton = screen.getByRole('button', {
      name: /cancel/i,
    });
    expect(cancelButton).toBeInTheDocument();
  });

  it('should return input text value to default when cancel button is clicked', async () => {
    const { nameInput } = setup();
    await waitFor(() => expect(nameInput.value).toBe('Sample License'));
    fireEvent.change(nameInput, { target: { value: 'Changed License Name' } });
    const cancelButton = screen.getByRole('button', {
      name: /cancel/i,
    });
    fireEvent.click(cancelButton);
    expect(nameInput.value).toBe('Sample License');
  });

  it('should hide the save button on click', async () => {
    const { nameInput } = setup();
    await waitFor(() => expect(nameInput.value).toBe('Sample License'));
    fireEvent.change(nameInput, { target: { value: 'Changed License Name' } });
    const saveButton = screen.getByRole('button', { name: /save/i });
    const cancelButton = screen.getByRole('button', {
      name: /cancel/i,
    });
    fireEvent.click(saveButton);
    expect(saveButton).not.toBeInTheDocument();
    expect(cancelButton).not.toBeInTheDocument();
  });
});

describe('Delete License', () => {
  const setup = () => {
    const { history } = renderWithRouter(
      <ReduxIntlProviders>
        <EditLicense id={1} />
      </ReduxIntlProviders>,
    );
    const nameInput = screen.getAllByRole('textbox')[0];
    const descriptionInput = screen.getAllByRole('textbox')[1];
    const plainTextInput = screen.getAllByRole('textbox')[2];

    return {
      nameInput,
      descriptionInput,
      plainTextInput,
      history,
    };
  };

  it('should ask for confirmation when user tries to delete a license', async () => {
    const { nameInput } = setup();
    await waitFor(() => expect(nameInput.value).toBe('Sample License'));
    const deleteButton = screen.getByRole('button', {
      name: /delete/i,
    });
    fireEvent.click(deleteButton);
    expect(screen.getByText('Are you sure you want to delete this license?')).toBeInTheDocument();
  });

  it('should close the confirmation popup when cancel is clicked', async () => {
    const { nameInput } = setup();
    await waitFor(() => expect(nameInput.value).toBe('Sample License'));
    const deleteButton = screen.getByRole('button', {
      name: /delete/i,
    });
    fireEvent.click(deleteButton);
    const cancelButton = screen.getByRole('button', {
      name: /cancel/i,
    });
    fireEvent.click(cancelButton);
    expect(
      screen.queryByText('Are you sure you want to delete this license?'),
    ).not.toBeInTheDocument();
  });

  it('should direct to licenses list page on successful deletion of a license', async () => {
    const { history, nameInput } = setup();
    await waitFor(() => expect(nameInput.value).toBe('Sample License'));
    const deleteButton = screen.getByRole('button', {
      name: /delete/i,
    });
    fireEvent.click(deleteButton);
    const dialog = screen.getByRole('dialog');
    const deleteConfirmationButton = within(dialog).getByRole('button', {
      name: /delete/i,
    });
    fireEvent.click(deleteConfirmationButton);
    expect(await screen.findByText('License deleted successfully.')).toBeInTheDocument();
    await waitFor(() => expect(history.location.pathname).toBe('/manage/licenses'));
  });
});
