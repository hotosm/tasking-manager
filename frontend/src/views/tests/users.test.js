import '@testing-library/jest-dom';
import React from 'react';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';

import { ReduxIntlProviders, renderWithRouter } from '../../utils/testWithIntl';
import { UsersList } from '../users';

describe('List Users', () => {
  const setup = () => {
    const { container, history } = renderWithRouter(
      <ReduxIntlProviders>
        <UsersList />
      </ReduxIntlProviders>,
    );
    return {
      container,
      history,
    };
  };

  it('should show loading placeholder when users are being fetched', () => {
    const { container } = setup();
    expect(container.getElementsByClassName('show-loading-animation').length).toBe(4 * 4);
  });

  it('should list users fetched', async () => {
    const { container } = setup();
    await waitFor(() =>
      expect(container.getElementsByClassName('show-loading-animation').length).toBe(0),
    );
    expect(screen.getAllByRole('listitem').length).toBe(2);
    // describe link on the image DP and username text
    expect(screen.getAllByRole('link', { name: /ram/i }).length).toBe(2);
    expect(screen.getAllByRole('link', { name: /shyam/i }).length).toBe(2);
  });

  it('should navigate to user detail page when clicked on the display picture', async () => {
    const { container, history } = setup();
    const user = userEvent.setup();
    await waitFor(() =>
      expect(container.getElementsByClassName('show-loading-animation').length).toBe(0),
    );
    await user.click(screen.getAllByRole('link', { name: /ram/i })[0]);
    await waitFor(() => expect(history.location.pathname).toBe('/users/Ram'));
  });
});

describe('Change of role and mapper level', () => {
  const setup = () => {
    const { container } = renderWithRouter(
      <ReduxIntlProviders>
        <UsersList />
      </ReduxIntlProviders>,
    );
    return {
      container,
    };
  };

  it('should call endpoint to update role', async () => {
    const { container } = setup();
    const user = userEvent.setup();
    await waitFor(() =>
      expect(container.getElementsByClassName('show-loading-animation').length).toBe(0),
    );
    await user.click(container.getElementsByClassName('pointer hover-blue-grey')[0]);
    const tooltip = screen.getByRole('tooltip');
    await user.click(within(tooltip).getByText(/advanced/i));
    await waitFor(
      () =>
        expect(tooltip).not.toBeInTheDocument() &&
        expect(container.getElementsByClassName('show-loading-animation').length).toBe(16),
    );
  });

  it('should call endpoint to update level', async () => {
    const { container } = setup();
    const user = userEvent.setup();
    await waitFor(() =>
      expect(container.getElementsByClassName('show-loading-animation').length).toBe(0),
    );
    await user.click(container.getElementsByClassName('pointer hover-blue-grey')[0]);
    const tooltip = screen.getByRole('tooltip');
    await user.click(within(tooltip).getByText(/admin/i));
    await waitFor(
      () =>
        expect(tooltip).not.toBeInTheDocument() &&
        expect(container.getElementsByClassName('show-loading-animation').length).toBe(16),
    );
  });
});

describe('Search and Filters', () => {
  const setup = () => {
    const { container } = renderWithRouter(
      <ReduxIntlProviders>
        <UsersList />
      </ReduxIntlProviders>,
    );
    return {
      container,
    };
  };

  it('should call endpoint to search users', async () => {
    const { container } = setup();
    await waitFor(() =>
      expect(container.getElementsByClassName('show-loading-animation').length).toBe(0),
    );
    const searchInput = screen.getByRole('textbox');
    fireEvent.change(searchInput, {
      target: {
        value: 'search query',
      },
    });
    expect(searchInput.value).toBe('search query');
    await waitFor(
      async () =>
        expect(await screen.findByText(/clear filters/i)).toBeInTheDocument() &&
        expect(container.getElementsByClassName('show-loading-animation').length).toBe(16),
    );
  });

  it('should call endpoint to update level', async () => {
    const { container } = setup();
    await waitFor(() =>
      expect(container.getElementsByClassName('show-loading-animation').length).toBe(0),
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: /all levels/i,
      }),
    );
    fireEvent.click(screen.getAllByText(/beginner/i)[0]);
    await waitFor(
      async () =>
        expect(await screen.findByText(/clear filters/i)).toBeInTheDocument() &&
        expect(container.getElementsByClassName('show-loading-animation').length).toBe(16),
    );
  });
});
