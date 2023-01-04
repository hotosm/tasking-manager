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
    expect(container.querySelectorAll('svg').length).toBe(2);
  });
});
