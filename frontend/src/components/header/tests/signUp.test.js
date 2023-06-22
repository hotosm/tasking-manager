import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';

import messages from '../messages';
import { LoginModal, ProceedOSM, SignUp } from '../signUp';
import { IntlProviders } from '../../../utils/testWithIntl';
import { ORG_PRIVACY_POLICY_URL } from '../../../config';

describe('Sign Up Form', () => {
  it('should close the sign up popup when close icon is clicked', async () => {
    const closeModalMock = jest.fn();
    const user = userEvent.setup();
    render(
      <IntlProviders>
        <SignUp closeModal={closeModalMock} />
      </IntlProviders>,
    );
    await user.click(screen.getByLabelText(/close popup/i));
    expect(closeModalMock).toHaveBeenCalled();
  });

  it('should render component details', () => {
    const { container } = render(
      <IntlProviders>
        <SignUp />
      </IntlProviders>,
    );
    expect(
      screen.getByRole('heading', {
        name: '1. Sign up',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(messages.signUpQuestion.defaultMessage)).toBeInTheDocument();
    expect(screen.getByText(messages.signupLabelName.defaultMessage)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(messages.namePlaceHolder.defaultMessage),
    ).toBeInTheDocument();
    expect(screen.getByText(messages.signupLabelEmail.defaultMessage)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(messages.emailPlaceholder.defaultMessage),
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
    expect(container.getElementsByClassName('h2 white f6 pa2 tc')[0]).not.toHaveClass('bg-red');
    expect(
      screen.getByRole('button', {
        name: /next/i,
      }),
    ).toBeDisabled();
    expect(screen.getByLabelText(/close popup/i)).toBeInTheDocument();
  });

  it('should proceed to step two when expected inputs are fulfilled', async () => {
    const user = userEvent.setup();
    render(
      <IntlProviders>
        <SignUp />
      </IntlProviders>,
    );
    await user.type(
      screen.getByPlaceholderText(messages.namePlaceHolder.defaultMessage),
      'My Name',
    );
    expect(
      screen.getByRole('button', {
        name: /next/i,
      }),
    ).toBeDisabled();
    await user.type(
      screen.getByPlaceholderText(messages.emailPlaceholder.defaultMessage),
      'invalidemail',
    );
    expect(
      screen.getByRole('button', {
        name: /next/i,
      }),
    ).toBeEnabled();
    await user.click(
      screen.getByRole('button', {
        name: /next/i,
      }),
    );
    expect(screen.getByText(messages.invalidEmail.defaultMessage)).toBeInTheDocument();
    await user.type(
      screen.getByPlaceholderText(messages.emailPlaceholder.defaultMessage),
      'valid@email.com',
    );
    await user.click(
      screen.getByRole('button', {
        name: /next/i,
      }),
    );
    expect(await screen.findByText('Do you have an OpenStreetMap account?')).toBeInTheDocument();
  });
});

describe('Proceed OSM form', () => {
  const setup = async () => {
    const user = userEvent.setup();
    render(
      <IntlProviders>
        <SignUp />
      </IntlProviders>,
    );
    await user.type(
      screen.getByPlaceholderText(messages.namePlaceHolder.defaultMessage),
      'My Name',
    );
    await user.type(
      screen.getByPlaceholderText(messages.emailPlaceholder.defaultMessage),
      'valid@email.com',
    );
    await user.click(
      screen.getByRole('button', {
        name: /next/i,
      }),
    );
    expect(await screen.findByText('Do you have an OpenStreetMap account?')).toBeInTheDocument();
    return { user };
  };

  it('should render component details', async () => {
    await setup();
    expect(
      screen.getByRole('heading', {
        name: `2. ${messages.proceedOSMTitle.defaultMessage}`,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(messages.proceedOSMPart1.defaultMessage)).toBeInTheDocument();
    expect(screen.getByText(messages.proceedOSMPart2.defaultMessage)).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: messages.submitProceedOSM.defaultMessage,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(messages.proceedOSMLogin.defaultMessage)).toBeInTheDocument();
  });

  it('should open OSM login window', async () => {
    global.open = jest.fn();
    const { user } = await setup();
    await user.click(
      screen.getByRole('button', {
        name: messages.submitProceedOSM.defaultMessage,
      }),
    );
    expect(global.open).toHaveBeenCalled();
  });

  it('should execute login prop when user already has an account', async () => {
    const setStepMock = jest.fn();
    const loginMock = jest.fn();
    const user = userEvent.setup();
    render(
      <IntlProviders>
        <ProceedOSM
          data={{ name: 'somebody', email: 'somebody@hot.org' }}
          step={2}
          setStep={setStepMock}
          login={loginMock}
        />
      </IntlProviders>,
    );
    await user.click(screen.getByText(messages.proceedOSMLogin.defaultMessage));
    expect(loginMock).toHaveBeenCalled();
  });
});

describe('LoginModal component', () => {
  const loginMock = jest.fn();
  it('should render component details', () => {
    render(
      <IntlProviders>
        <LoginModal step={{ number: 3 }} login={loginMock} />
      </IntlProviders>,
    );
    expect(
      screen.getByRole('heading', {
        name: `3. ${messages.AuthorizeTitle.defaultMessage}`,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(messages.AuthorizeMessage.defaultMessage)).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /log in/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: messages.osmRegisterCheck.defaultMessage,
      }),
    ).toBeInTheDocument();
  });

  it('should execute the login prop', async () => {
    const user = userEvent.setup();
    render(
      <IntlProviders>
        <LoginModal step={{ number: 3 }} login={loginMock} />
      </IntlProviders>,
    );
    await user.click(
      screen.getByRole('button', {
        name: /log in/i,
      }),
    );
    expect(loginMock).toHaveBeenCalled();
  });
});
