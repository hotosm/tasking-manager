import '@testing-library/jest-dom';
import { act, screen, waitFor, within } from '@testing-library/react';

import '../../../utils/mockMatchMedia';
import { store } from '../../../store';
import { ReduxIntlProviders, renderWithRouter } from '../../../utils/testWithIntl';
import { NotificationBell } from '../notificationBell';

describe('Notification Bell', () => {
  it('should render component details', async () => {
    act(() => {
      store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
    });
    const { container } = renderWithRouter(
      <ReduxIntlProviders>
        <NotificationBell />
      </ReduxIntlProviders>,
      {
        route: '/inbox',
      },
    );
    const inboxLink = screen.getAllByRole('link')[0];
    expect(within(inboxLink).getByLabelText(/notifications/i)).toBeInTheDocument();
    expect(await screen.findByText(/You have been added to team/i)).toBeInTheDocument();
    expect(screen.getAllByRole('article').length).toBe(4);
    await waitFor(() => {
      expect(container.getElementsByClassName('redicon')[0]).toBeInTheDocument();
    });
    expect(inboxLink).toHaveClass('bb b--blue-dark bw1 pv2');
  });

  it('should clear unread notification count when bell icon is clicked', async () => {
    const { user, container } = renderWithRouter(
      <ReduxIntlProviders>
        <NotificationBell />
      </ReduxIntlProviders>,
    );
    expect(screen.getAllByRole('link')[0]).not.toHaveClass('bb b--blue-dark bw1 pv2');
    expect(await screen.findByText(/You have been added to team/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(container.getElementsByClassName('redicon')[0]).toBeInTheDocument();
    });
    await user.click(within(screen.getAllByRole('link')[0]).getByLabelText(/notifications/i));
    await waitFor(() => {
      expect(container.querySelector('redicon')).not.toBeInTheDocument();
    });
  });
});
