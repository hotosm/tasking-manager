import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ReduxIntlProviders } from '../../utils/testWithIntl';
import { ContactPage } from '../contact';

test('Contact page', () => {
  const { container } = render(
    <ReduxIntlProviders>
      <ContactPage />
    </ReduxIntlProviders>,
  );
  expect(screen.getByText(/Contact/)).toBeInTheDocument();
  expect(screen.getByText('Send us a message')).toBeInTheDocument();
  expect(screen.getByText('Name')).toBeInTheDocument();
  expect(screen.getByText('Email')).toBeInTheDocument();
  expect(screen.getByText('Message')).toBeInTheDocument();
  expect(screen.getByText('Send').className).toContain('bg-red o-50 white');

  const [name, email] = container.querySelectorAll('input');
  fireEvent.change(name, { target: { value: 'User' } });
  fireEvent.change(email, { target: { value: 'a@e.com' } });
  fireEvent.change(container.querySelector('textarea'), { target: { value: 'Hola! Danke!' } });
  expect(screen.getByText('Send').className).not.toContain('o-50');
});
