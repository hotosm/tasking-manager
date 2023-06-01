import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import toast from 'react-hot-toast';
import { render, screen, waitFor } from '@testing-library/react';

import { UserEditMenu, UsersTable } from '../list';
import { IntlProviders, ReduxIntlProviders, renderWithRouter } from '../../../utils/testWithIntl';
import { store } from '../../../store';
import { setupFaultyHandlers } from '../../../network/tests/server';

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

describe('User list card', () => {
  it('renders user card', async () => {
    const { container, getByText, getAllByRole } = renderWithRouter(
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

describe('User Edit Menu', () => {
  const userDetails = {
    id: 13526430,
    username: 'Aadesh Baral',
    role: 'MAPPER',
    mappingLevel: 'BEGINNER',
  };

  const setup = () => {
    const user = userEvent.setup();
    return {
      ...render(
        <IntlProviders>
          <UserEditMenu user={userDetails} close={jest.fn()} setStatus={jest.fn()} />
        </IntlProviders>,
      ),
      user,
    };
  };

  it('should display toast message when member role gets updated', async () => {
    const { user } = setup();
    await user.click(
      screen.getByRole('button', {
        name: /Admin/i,
      }),
    );
    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1));
  });

  it('should display error toast message when member role updation fails', async () => {
    setupFaultyHandlers();
    const { user } = setup();
    await user.click(
      screen.getByRole('button', {
        name: /Intermediate/i,
      }),
    );
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
  });

  it('should display toast message when member mapper level gets updated', async () => {
    const { user } = setup();
    await user.click(
      screen.getByRole('button', {
        name: /Admin/i,
      }),
    );
    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1));
  });

  it('should display error toast message when member mapper level updation fails', async () => {
    setupFaultyHandlers();
    const { user } = setup();
    await user.click(
      screen.getByRole('button', {
        name: /Advanced/i,
      }),
    );
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
  });
});
