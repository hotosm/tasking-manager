import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupFaultyHandlers } from '../../../network/tests/server';

import { IntlProviders } from '../../../utils/testWithIntl';
import { SessionAboutToExpire, SessionExpired } from '../extendSession';
import messages from '../messages';

describe('Session About To Expire Dialog', () => {
  it('should display error when session could not be extended', async () => {
    setupFaultyHandlers();
    const user = userEvent.setup();
    render(
      <IntlProviders>
        <SessionAboutToExpire showSessionExpiringDialog projectId={123} />
      </IntlProviders>,
    );
    await user.click(
      screen.getByRole('button', {
        name: /extend session/i,
      }),
    );
    await waitFor(() => {
      expect(screen.getByText(messages.sessionExtensionError.defaultMessage)).toBeInTheDocument();
    });
  });

  it('should close the modal', async () => {
    const setShowSessionExpiryDialogMock = jest.fn();
    const user = userEvent.setup();
    const { container } = render(
      <IntlProviders>
        <SessionAboutToExpire
          showSessionExpiringDialog
          projectId={123}
          setShowSessionExpiryDialog={setShowSessionExpiryDialogMock}
        />
      </IntlProviders>,
    );
    await user.click(
      screen.getByRole('button', {
        name: /close/i,
      }),
    );
    expect(setShowSessionExpiryDialogMock).toHaveBeenCalled();
    expect(container).toBeEmptyDOMElement();
  });
});

describe('Session Expired Dialog', () => {
  it('should display error when task cannot be relocked', async () => {
    setupFaultyHandlers();
    const user = userEvent.setup();
    render(
      <IntlProviders>
        <SessionExpired showSessionExpiredDialog projectId={123} tasksIds={[12, 13]} />
      </IntlProviders>,
    );
    await user.click(
      screen.getByRole('button', {
        name: /relock tasks/i,
      }),
    );
    await waitFor(() => {
      expect(screen.getByText('An error occurred while relocking your tasks.')).toBeInTheDocument();
    });
  });

  it('should close the modal', async () => {
    const setShowSessionExpiredDialogMock = jest.fn();
    const user = userEvent.setup();
    const { container } = render(
      <IntlProviders>
        <SessionAboutToExpire
          showSessionExpiringDialog
          projectId={123}
          setShowSessionExpiryDialog={setShowSessionExpiredDialogMock}
        />
      </IntlProviders>,
    );
    await user.click(
      screen.getByRole('button', {
        name: /close/i,
      }),
    );
    expect(setShowSessionExpiredDialogMock).toHaveBeenCalled();
    expect(container).toBeEmptyDOMElement();
  });
});
