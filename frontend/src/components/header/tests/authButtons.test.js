import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ReduxIntlProviders } from '../../../utils/testWithIntl';
import { AuthButtons } from '../index';
import userEvent from '@testing-library/user-event';

describe('AuthButtons', () => {
  it('without alternativeSignUpText', async () => {
    const user = userEvent.setup();
    render(
      <ReduxIntlProviders>
        <AuthButtons
          logInStyle="blue-dark bg-white"
          signUpStyle="bg-blue-dark white ml1 v-mid"
          redirectTo={'/welcome'}
        />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('Log in').className).toContain('blue-dark bg-white');
    expect(screen.getByText('Sign up').className).toContain('bg-blue-dark white ml1 v-mid');
    expect(screen.queryByText('Create an account')).not.toBeInTheDocument();
    expect(screen.queryByText('Name')).not.toBeInTheDocument();
    await user.click(screen.getByText('Sign up'));
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });
  it('with alternativeSignUpText', async () => {
    const user = userEvent.setup();
    render(
      <ReduxIntlProviders>
        <AuthButtons
          logInStyle="white bg-red"
          signUpStyle="bg-orange black ml1 v-mid"
          redirectTo={'/welcome'}
          alternativeSignUpText={true}
        />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('Log in').className).toContain('white bg-red');
    expect(screen.getByText('Create an account').className).toContain('bg-orange black ml1 v-mid');
    expect(screen.queryByText('Sign up')).not.toBeInTheDocument();
    expect(screen.queryByText('Name')).not.toBeInTheDocument();
    await user.click(screen.getByText('Create an account'));
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });
});
