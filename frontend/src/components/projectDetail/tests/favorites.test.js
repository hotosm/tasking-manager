import '@testing-library/jest-dom';
import { act, screen, waitFor } from '@testing-library/react';

import { store } from '../../../store';
import {
  ReduxIntlProviders,
  renderWithRouter,
  createComponentWithMemoryRouter,
} from '../../../utils/testWithIntl';
import { AddToFavorites } from '../favorites';
import messages from '../messages';

describe('AddToFavorites button', () => {
  it('renders button when project id = 1', async () => {
    const props = {
      projectId: 1,
    };
    const { container } = renderWithRouter(
      <ReduxIntlProviders>
        <AddToFavorites {...props} />
      </ReduxIntlProviders>,
    );
    const button = screen.getByRole('button');
    expect(button.className).toBe(
      ' input-reset base-font bg-white blue-dark bn pointer flex nowrap items-center ml3',
    );
    expect(button.className).not.toBe('dn input-reset base-font bg-white blue-dark f6 bn pointer');
    expect(container.querySelector('svg').classList.value).toBe('pr2 v-btm o-50 blue-grey');
    expect(button.textContent).toBe('Add to Favorites');
  });

  it('should navigate to login page if the user is not logged in', async () => {
    act(() => {
      store.dispatch({ type: 'SET_TOKEN', token: null });
    });
    const { user, router } = createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <AddToFavorites projectId={1} />
      </ReduxIntlProviders>,
    );
    await user.click(screen.getByRole('button'));
    expect(router.state.location.pathname).toBe('/login');
  });

  it('should mark the project as favorite', async () => {
    act(() => {
      store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
    });
    const { user } = createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <AddToFavorites projectId={123} />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText(messages.addToFavorites.defaultMessage)).toBeInTheDocument();
    await user.click(screen.getByRole('button'));
    await waitFor(() =>
      expect(screen.queryByText(messages.addToFavorites.defaultMessage)).not.toBeInTheDocument(),
    );
    expect(screen.getByText(messages.removeFromFavorites.defaultMessage)).toBeInTheDocument();
  });
});
