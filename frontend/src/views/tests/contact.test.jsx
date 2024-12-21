import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ReduxIntlProviders, renderWithRouter } from '../../utils/testWithIntl';
import { ContactPage } from '../contact';

test('Contact page', async () => {
  const { user, container } = renderWithRouter(
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
  const textArea = container.querySelector('textarea');
  await user.clear(name);
  await user.clear(email);
  await user.clear(textArea);
  await user.type(name, 'User');
  await user.type(email, 'a@e.com');
  await user.type(textArea, 'Hola! Danke!');
  expect(screen.getByText('Send').className).not.toContain('o-50');
});
