import React from 'react';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ReduxIntlProviders, renderWithRouter } from '../../../utils/testWithIntl';
import { interest } from '../../../network/tests/mockData/management';
import { DeleteModal } from '../index';

describe('Delete Interest', () => {
  const setup = () => {
    const { history } = renderWithRouter(
      <ReduxIntlProviders>
        <DeleteModal id={interest.id} name={interest.name} type="interests" />
      </ReduxIntlProviders>,
    );
    const deleteButton = screen.getByRole('button', {
      name: 'Delete',
    });

    return {
      deleteButton,
      history,
    };
  };

  it('should ask for confirmation when user tries to delete an interest', () => {
    const { deleteButton } = setup();
    fireEvent.click(deleteButton);
    expect(screen.getByText('Are you sure you want to delete this category?')).toBeInTheDocument();
  });

  it('should close the confirmation popup when cancel is clicked', () => {
    const { deleteButton } = setup();
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
    const { deleteButton, history } = setup();

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
