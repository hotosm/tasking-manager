import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { UsersTable } from '../list';
import { ReduxIntlProviders } from '../../../utils/testWithIntl';
import { store } from '../../../store';

describe('User list card', () => {
  it('renders user card', async () => {
    const { container, getByText, getAllByRole } = render(
      <ReduxIntlProviders store={store}>
        <UsersTable
          filters={{
            level: 'ALL',
            role: 'ALL',
            username: '',
            page: 1,
          }}
        />
      </ReduxIntlProviders>,
    );
    await waitFor(() => {
      expect(getByText(/Ram/i));
    });
    expect(getAllByRole('listitem')).toHaveLength(2);
    expect(getByText(/total number of users: 220111/i)).toBeInTheDocument();
    expect(screen.getByText('Ram').closest('a')).toHaveAttribute('href', '/users/Ram');
    expect(screen.getAllByText('Mapper').length).toBe(2);
    expect(getByText('Beginner')).toBeInTheDocument();
    expect(getByText('Shyam')).toBeInTheDocument();
    expect(screen.getByText('Shyam').closest('a')).toHaveAttribute('href', '/users/Shyam');
    expect(screen.getByTitle(/Ram/i)).toHaveStyle(
      `background-image: url(https://www.openstreetmap.org/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBNXQ2Q3c9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--fe41f1b2a5d6cf492a7133f15c81f105dec06ff7/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaDdCem9MWm05eWJXRjBPZ2h3Ym1jNkZISmxjMmw2WlY5MGIxOXNhVzFwZEZzSGFXbHBhUT09IiwiZXhwIjpudWxsLCJwdXIiOiJ2YXJpYXRpb24ifX0=--058ac785867b32287d598a314311e2253bd879a3/unnamed.webp)`,
    );
    expect(container.querySelectorAll('svg').length).toBe(2);
  });
});
