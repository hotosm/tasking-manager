import '@testing-library/jest-dom';
import { act, screen, waitFor, within } from '@testing-library/react';

import '../../../utils/mockMatchMedia';
import { store } from '../../../store';
import {
  QueryClientProviders,
  ReduxIntlProviders,
  createComponentWithMemoryRouter,
  renderWithRouter,
} from '../../../utils/testWithIntl';
import { NotificationBell } from '../notificationBell';

describe('Notification Bell', () => {
  it('should render component details', async () => {
    act(() => {
      store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
    });
    const { container } = renderWithRouter(
      <QueryClientProviders>
        <ReduxIntlProviders>
          <NotificationBell />
        </ReduxIntlProviders>
      </QueryClientProviders>,
      {
        route: '/inbox',
      },
    );
    const inboxLink = screen.getAllByRole('link')[0];
    expect(within(inboxLink).getByLabelText(/notifications/i)).toBeInTheDocument();
    expect(await screen.findByText(/Sample subject 1/i)).toBeInTheDocument();
    expect(screen.getAllByRole('article').length).toBe(5);
    await waitFor(() => {
      expect(container.getElementsByClassName('redicon')[0]).toBeInTheDocument();
    });
    expect(inboxLink).toHaveClass('bb b--blue-dark bw1 pv2');
  });

  it('should clear unread notification count when bell icon is clicked', async () => {
    const { user, container } = renderWithRouter(
      <QueryClientProviders>
        <ReduxIntlProviders>
          <NotificationBell />
        </ReduxIntlProviders>
      </QueryClientProviders>,
    );
    expect(screen.getAllByRole('link')[0]).not.toHaveClass('bb b--blue-dark bw1 pv2');
    expect(await screen.findByText(/Sample subject 1/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(container.getElementsByClassName('redicon')[0]).toBeInTheDocument();
    });
    await user.click(within(screen.getAllByRole('link')[0]).getByLabelText(/notifications/i));
    await waitFor(() => {
      expect(container.querySelector('redicon')).not.toBeInTheDocument();
    });
  });

  it('should navigate to the notifications page', async () => {
    const { router, user } = createComponentWithMemoryRouter(
      <QueryClientProviders>
        <ReduxIntlProviders>
          <NotificationBell />
        </ReduxIntlProviders>
      </QueryClientProviders>,
    );
    await user.click(await screen.findByText(/208 unread/i));
    await waitFor(() => expect(router.state.location.pathname).toBe('/inbox'));
  });
});
