import { screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';

import {
  createComponentWithMemoryRouter,
  ReduxIntlProviders,
  renderWithRouter,
} from '../../../utils/testWithIntl';
import { interest } from '../../../network/tests/mockData/management';
import { DeleteModal } from '../index';

describe('Delete Interest', () => {
  const setup = () => {
    const { user, history } = renderWithRouter(
      <ReduxIntlProviders>
        <DeleteModal id={interest.id} name={interest.name} type="interests" />
      </ReduxIntlProviders>,
    );
    const deleteButton = screen.getByRole('button', {
      name: 'Delete',
    });

    return {
      user,
      deleteButton,
      history,
    };
  };

  it('should ask for confirmation when user tries to delete an interest', async () => {
    const { user, deleteButton } = setup();
    await user.click(deleteButton);
    expect(screen.getByText('Are you sure you want to delete this category?')).toBeInTheDocument();
  });

  it('should close the confirmation popup when cancel is clicked', async () => {
    const { user, deleteButton } = setup();
    await user.click(deleteButton);
    const cancelButton = screen.getByRole('button', {
      name: /cancel/i,
    });
    await user.click(cancelButton);
    expect(
      screen.queryByRole('heading', {
        name: 'Are you sure you want to delete this category?',
      }),
    ).not.toBeInTheDocument();
  });

  it('should direct to passed type list page on successful deletion of an interest', async () => {
    const { user, router } = createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <DeleteModal id={interest.id} name={interest.name} type="campaigns" />
      </ReduxIntlProviders>,
    );

    const deleteButton = screen.getByRole('button', {
      name: 'Delete',
    });

    await user.click(deleteButton);
    const dialog = screen.getByRole('dialog');
    const deleteConfirmationButton = within(dialog).getByRole('button', {
      name: /delete/i,
    });
    await user.click(deleteConfirmationButton);
    expect(
      await screen.findByRole('heading', { name: /campaign deleted successfully./i }),
    ).toBeInTheDocument();
    await waitFor(() => expect(router.state.location.pathname).toBe('/manage/campaigns'));
  });

  it('should direct to categories list page on successful deletion of an interest', async () => {
    const { user, router } = createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <DeleteModal id={interest.id} name={interest.name} type="interests" />
      </ReduxIntlProviders>,
    );

    const deleteButton = screen.getByRole('button', {
      name: 'Delete',
    });

    await user.click(deleteButton);
    const dialog = screen.getByRole('dialog');
    const deleteConfirmationButton = within(dialog).getByRole('button', {
      name: /delete/i,
    });
    await user.click(deleteConfirmationButton);
    expect(
      await screen.findByRole('heading', { name: /interest deleted successfully./i }),
    ).toBeInTheDocument();
    await waitFor(() => expect(router.state.location.pathname).toBe('/manage/categories'));
  });
});
