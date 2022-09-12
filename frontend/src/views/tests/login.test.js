import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ReduxIntlProviders } from '../../utils/testWithIntl';
import { Login } from '../login';

test('Login component renders the elements correctly formatted', () => {
  render(
    <ReduxIntlProviders>
      <Login redirectTo={'/welcome'} />
    </ReduxIntlProviders>,
  );
  expect(screen.getByText(/Tasking Manager/)).toBeInTheDocument();
  expect(screen.getByText('Log in').className).toContain('blue-dark bg-white');
  expect(screen.getByText('Create an account').className).toContain('bg-blue-dark white ml1 v-mid');
  expect(screen.queryByText('Sign up')).not.toBeInTheDocument();
  expect(screen.queryByText('Name')).not.toBeInTheDocument();
  fireEvent.click(screen.getByText('Create an account'));
  expect(screen.getByText('Name')).toBeInTheDocument();
  expect(screen.getByText('Email')).toBeInTheDocument();
  expect(screen.getByText('Next')).toBeInTheDocument();
});
