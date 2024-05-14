import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ReduxIntlProviders } from '../../../utils/testWithIntl';
import messages from '../messages';
import { UpdateEmail } from '../updateEmail';
import { ORG_PRIVACY_POLICY_URL } from '../../../config';

describe('Update Email Dialog', () => {
  const closeModalMock = jest.fn();
  const setup = () => {
    return {
      user: userEvent.setup(),
      ...render(
        <ReduxIntlProviders>
          <UpdateEmail closeModal={closeModalMock} />
        </ReduxIntlProviders>,
      ),
    };
  };
  it('should render component details', () => {
    setup();
    expect(
      screen.getByRole('heading', {
        name: messages.emailUpdateTitle.defaultMessage,
      }),
    ).toBeInTheDocument();
    [messages.emailUpdateTextPart1, messages.emailUpdateTextPart2].forEach((message) =>
      expect(screen.getByText(message.defaultMessage)).toBeInTheDocument(),
    );
    expect(
      screen.getByPlaceholderText(messages.emailPlaceholder.defaultMessage),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /update/i,
      }),
    ).toBeInTheDocument();
    if (ORG_PRIVACY_POLICY_URL) {
      expect(
        screen.getByRole('link', {
          name: messages.privacyPolicy.defaultMessage,
        }),
      ).toBeInTheDocument();
    } else {
      expect(
        screen.queryByRole('link', {
          name: messages.privacyPolicy.defaultMessage,
        }),
      ).not.toBeInTheDocument();
    }
  });

  it('should update user email', async () => {
    const { user } = setup();
    await user.click(
      screen.getByRole('button', {
        name: /update/i,
      }),
    );
    await waitFor(() => {
      expect(closeModalMock).toHaveBeenCalled();
    });
  });

  it('should update email text', async () => {
    const { user } = setup();

    await user.type(screen.getByPlaceholderText(messages.emailPlaceholder.defaultMessage), 'meow');
    expect(screen.getByPlaceholderText(messages.emailPlaceholder.defaultMessage)).toHaveValue(
      'meow',
    );
  });
});
