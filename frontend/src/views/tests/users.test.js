import '@testing-library/jest-dom';
import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';

import {
  createComponentWithMemoryRouter,
  ReduxIntlProviders,
  renderWithRouter,
} from '../../utils/testWithIntl';
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
    const { user, container, router } = createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <UsersList />
      </ReduxIntlProviders>,
    );
    await waitFor(() =>
      expect(container.getElementsByClassName('show-loading-animation').length).toBe(0),
    );
    await user.click(screen.getAllByRole('link', { name: /ram/i })[0]);
    await waitFor(() => expect(router.state.location.pathname).toBe('/users/Ram'));
  });
});

describe('Change of role and mapper level', () => {
  const setup = () => {
    const { user, container } = renderWithRouter(
      <ReduxIntlProviders>
        <UsersList />
      </ReduxIntlProviders>,
    );
    return {
      user,
      container,
    };
  };

  it('should call endpoint to update role', async () => {
    const { user, container } = setup();
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
    const { user, container } = setup();
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
    const { user, container } = renderWithRouter(
      <ReduxIntlProviders>
        <UsersList />
      </ReduxIntlProviders>,
    );
    return {
      user,
      container,
    };
  };

  it('should call endpoint to search users', async () => {
    const { user, container } = setup();
    await waitFor(() =>
      expect(container.getElementsByClassName('show-loading-animation').length).toBe(0),
    );
    const searchInput = screen.getByRole('textbox');
    await user.clear(searchInput);
    await user.type(searchInput, 'search query');
    expect(searchInput.value).toBe('search query');
    await waitFor(
      async () =>
        expect(await screen.findByText(/clear filters/i)).toBeInTheDocument() &&
        expect(container.getElementsByClassName('show-loading-animation').length).toBe(16),
    );
  });

  it('should call endpoint to update level', async () => {
    const { user, container } = setup();
    await waitFor(() =>
      expect(container.getElementsByClassName('show-loading-animation').length).toBe(0),
    );
    await user.click(
      screen.getByRole('button', {
        name: /all levels/i,
      }),
    );
    await user.click(screen.getAllByText(/beginner/i)[0]);
    await waitFor(
      async () =>
        expect(await screen.findByText(/clear filters/i)).toBeInTheDocument() &&
        expect(container.getElementsByClassName('show-loading-animation').length).toBe(16),
    );
  });
});
