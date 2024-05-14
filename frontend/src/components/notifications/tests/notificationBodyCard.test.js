import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { NotificationBodyCard, NotificationBodyModal } from '../notificationBodyCard';
import { ReduxIntlProviders, renderWithRouter } from '../../../utils/testWithIntl';
import { setupFaultyHandlers } from '../../../network/tests/server';
import { generateSampleNotifications } from '../../../network/tests/mockData/notifications';
import { ORG_NAME } from '../../../config';

describe('Notification Body Modal', () => {
  it('should close the notification bell popup if it is open', () => {
    const setPopoutFocusMock = jest.fn();
    render(
      <ReduxIntlProviders>
        <NotificationBodyModal setPopoutFocus={setPopoutFocusMock} />
      </ReduxIntlProviders>,
    );
    expect(setPopoutFocusMock).toHaveBeenCalled();
  });

  it('should open link on the notification text', async () => {
    const originalOpen = window.open;
    window.open = jest.fn();
    renderWithRouter(
      <ReduxIntlProviders>
        <NotificationBodyModal />
      </ReduxIntlProviders>,
    );
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole('link', {
        name: /example.com/i,
      }),
    );
    expect(window.open).toHaveBeenCalledTimes(1);
    expect(window.open).toHaveBeenCalledWith('https://example.com/');
    // Restore the original window.open method
    window.open = originalOpen;
  });

  it('should display error message when notification cannnot be fetched', async () => {
    setupFaultyHandlers();
    renderWithRouter(
      <ReduxIntlProviders>
        <NotificationBodyModal id={123} />
      </ReduxIntlProviders>,
    );
    await waitFor(() =>
      expect(screen.getByText(/error loading the notification/i)).toBeInTheDocument(),
    );
  });
});

describe('Notification Body Card Deletion', () => {
  it('should delete the notification and call close notification modal function prop', async () => {
    const sampleNotification = generateSampleNotifications(1)[0];
    const retryFnMock = jest.fn();
    const closeModalMock = jest.fn();
    renderWithRouter(
      <ReduxIntlProviders>
        <NotificationBodyCard
          card={{ ...sampleNotification }}
          retryFn={retryFnMock}
          closeModal={closeModalMock}
        />
      </ReduxIntlProviders>,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /delete/i }));
    await waitFor(() => {
      expect(retryFnMock).toHaveBeenCalled();
      expect(closeModalMock).toHaveBeenCalled();
    });
  });

  it('should log the error message when notification deletion error occurs', async () => {
    const logSpy = jest.spyOn(console, 'log');
    const sampleNotification = generateSampleNotifications(1)[0];
    setupFaultyHandlers();
    renderWithRouter(
      <ReduxIntlProviders>
        <NotificationBodyCard card={{ ...sampleNotification }} />
      </ReduxIntlProviders>,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /delete/i }));
    await waitFor(() => expect(logSpy).toHaveBeenCalled());
  });

  it('should display organization name on system generate notifications', async () => {
    let sampleNotification = generateSampleNotifications(1)[0];
    sampleNotification.fromUsername = null;
    renderWithRouter(
      <ReduxIntlProviders>
        <NotificationBodyCard card={{ ...sampleNotification }} />
      </ReduxIntlProviders>,
    );
    if (ORG_NAME) {
      expect(screen.getByText(ORG_NAME)).toBeInTheDocument();
    }
  });
});
