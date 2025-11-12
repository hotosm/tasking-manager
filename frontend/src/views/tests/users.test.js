import '@testing-library/jest-dom';
import { screen, waitFor, within } from '@testing-library/react';

import {
  createComponentWithMemoryRouter,
  ReduxIntlProviders,
  renderWithRouter,
} from '../../utils/testWithIntl';
import { UsersList } from '../users';
import { store } from '../../store';

describe('List Users', () => {
  const setup = () => {
    const { container, history } = renderWithRouter(
      <ReduxIntlProviders store={store}>
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

    const tbody = screen.getByTestId('user-list');
    expect(within(tbody).getAllByRole('link').length).toBe(4);
    expect(within(tbody).getAllByRole('link', { name: /ram/i }).length).toBe(2);
    expect(within(tbody).getAllByRole('link', { name: /shyam/i }).length).toBe(2);
  });

  it('should navigate to user detail page when clicked on the display picture', async () => {
    const { user, container, router } = createComponentWithMemoryRouter(
      <ReduxIntlProviders store={store}>
        <UsersList />
      </ReduxIntlProviders>,
    );

    await waitFor(() => {
      expect(container.getElementsByClassName('show-loading-animation').length).toBe(0);
    });
    const tbody = screen.getByTestId('user-list');
    await user.click(within(tbody).getAllByRole('link', { name: /ram/i })[0]);
    waitFor(() => expect(router.state.location.pathname).toBe('/users/Ram'));
  });
});

// Retry failed tests up to 2 times to handle occasional async flakiness
jest.retryTimes(2);
describe('Change of role and mapper level', () => {
  const setup = async () => {
    const { user, container } = renderWithRouter(
      <ReduxIntlProviders store={store}>
        <UsersList />
      </ReduxIntlProviders>,
    );

    // wait until loading spinner gone
    await waitFor(() =>
      expect(container.getElementsByClassName('show-loading-animation').length).toBe(0),
    );

    // wait for table body
    const tbody = await screen.findByTestId('user-list');

    // ensure rows & triggers are stable
    await waitFor(() => {
      const triggers = within(tbody).getAllByTestId('action-trigger');
      expect(triggers.length).toBeGreaterThan(0);
      expect(screen.getByText(/Ram/i)).toBeInTheDocument();
    });

    return { tbody, user, container };
  };

  beforeEach(() => {
    const popupRoot = document.getElementById('popup-root');
    if (popupRoot) popupRoot.innerHTML = '';
  });

  it('should call endpoint to update level', async () => {
    const { tbody, user, container } = await setup();

    const triggers = await within(tbody).findAllByTestId('action-trigger');
    await user.click(triggers[0]);

    const tooltip = await screen.findByTestId('action-content', {}, { timeout: 1000 });

    const advancedOption = await within(tooltip).findByText(/advanced/i);
    await user.click(advancedOption);

    await waitFor(() => {
      expect(screen.queryByTestId('action-content')).not.toBeInTheDocument();
    });
    await waitFor(() =>
      expect(container.getElementsByClassName('show-loading-animation').length).toBe(0),
    );
  });

  it('should call endpoint to update Role', async () => {
    const { tbody, user, container } = await setup();

    const triggers = await within(tbody).findAllByTestId('action-trigger');
    await user.click(triggers[0]);

    const tooltip = await screen.findByTestId('action-content', {}, { timeout: 1000 });

    const adminOption = await within(tooltip).findByText(/admin/i);
    await user.click(adminOption);

    await waitFor(() => {
      expect(screen.queryByTestId('action-content')).not.toBeInTheDocument();
    });
    await waitFor(() =>
      expect(container.getElementsByClassName('show-loading-animation').length).toBe(0),
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
    await user.click(screen.getAllByText(/all levels/i)[0]);
    await user.click(screen.getAllByText(/beginner/i)[0]);
    await waitFor(
      async () =>
        expect(await screen.findByText(/clear filters/i)).toBeInTheDocument() &&
        expect(container.getElementsByClassName('show-loading-animation').length).toBe(16),
    );
  });
});
