import React from 'react';
import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ReduxIntlProviders, renderWithRouter } from '../../utils/testWithIntl';
import { Login } from '../login';

test('Login component renders the elements correctly formatted', async () => {
  const { user } = renderWithRouter(
    <ReduxIntlProviders>
      <Login redirectTo={'/welcome'} />
    </ReduxIntlProviders>,
  );
  expect(screen.getByText(/Tasking Manager/)).toBeInTheDocument();
  expect(screen.getByText('Log in').className).toContain('blue-dark bg-white');
  expect(screen.getByText('Create an account').className).toContain('bg-blue-dark white ml1 v-mid');
  expect(screen.queryByText('Sign up')).not.toBeInTheDocument();
  expect(screen.queryByText('Name')).not.toBeInTheDocument();
  await user.click(screen.getByText('Create an account'));
  expect(screen.getByText('Name')).toBeInTheDocument();
  expect(screen.getByText('Email')).toBeInTheDocument();
  expect(screen.getByText('Next')).toBeInTheDocument();
});
