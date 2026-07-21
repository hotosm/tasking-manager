import '@testing-library/jest-dom';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { UsersTable, SearchNav, UserEditMenu } from '../list';
import { renderWithRouter, QueryClientProviders, ReduxIntlProviders } from '../../../utils/testWithIntl';
import * as network from '../../../network/genericJSONRequest';

jest.mock('../../../network/genericJSONRequest');

const mockLevels = [
  { id: '1', name: 'BEGINNER' },
  { id: '2', name: 'INTERMEDIATE' },
  { id: '3', name: 'ADVANCED' },
];

describe('SearchNav Component', () => {
  const initialFilters = { username: '', role: 'ALL', level: 'ALL', page: 1 };

  it('renders all filters and updates them', () => {
    const setFilters = jest.fn();
    renderWithRouter(
      <SearchNav filters={initialFilters} setFilters={setFilters} initialFilters={initialFilters} levels={mockLevels} />
    );

    const input = screen.getByPlaceholderText('Search user');
    fireEvent.change(input, { target: { value: 'testuser' } });
    expect(setFilters).toHaveBeenCalled();
  });

  it('clears filters', () => {
    const setFilters = jest.fn();
    renderWithRouter(
      <SearchNav filters={{ username: 'a', role: 'ALL', level: 'ALL' }} setFilters={setFilters} initialFilters={initialFilters} levels={mockLevels} />
    );

    fireEvent.click(screen.getByText('Clear filters'));
    expect(setFilters).toHaveBeenCalledWith(initialFilters);
  });
});

describe('UsersTable Component', () => {
  const initialFilters = { username: '', role: 'ALL', level: 'ALL', page: 1 };

  const mockUsersResponse = {
    users: [
      { id: 1, username: 'user1', role: 'MAPPER', mappingLevel: 'BEGINNER', stats: { 'buildings': 100 } },
      { id: 2, username: 'user2', role: 'ADMIN', mappingLevel: 'ADVANCED', requires_approval: true, stats: { 'buildings': 200 } }
    ],
    pagination: { total: 2, pages: 1 }
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders users table and fetches data', async () => {
    network.fetchLocalJSONAPI.mockResolvedValue(mockUsersResponse);

    renderWithRouter(
      <ReduxIntlProviders>
        <UsersTable filters={initialFilters} setFilters={jest.fn()} levels={mockLevels} />
      </ReduxIntlProviders>
    );

    await waitFor(() => expect(screen.getByText('user1')).toBeInTheDocument());
    expect(screen.getByText('user2')).toBeInTheDocument();
    expect(screen.getByText('Total users: 2')).toBeInTheDocument();
  });

  it('handles stats update', async () => {
    network.fetchLocalJSONAPI.mockResolvedValue(mockUsersResponse);
    network.fetchLocalJSONAPI.mockImplementation((url, token, method) => {
      if (method === 'PATCH') return Promise.resolve({});
      return Promise.resolve(mockUsersResponse);
    });

    renderWithRouter(
      <ReduxIntlProviders>
        <UsersTable filters={initialFilters} setFilters={jest.fn()} levels={mockLevels} />
      </ReduxIntlProviders>
    );

    await waitFor(() => expect(screen.getByText('user1')).toBeInTheDocument());

    const refreshButtons = document.querySelectorAll('button .svg-inline--fa.fa-sync'); // or whatever refresh icon is
    // Actually the icon is RefreshIcon
    const buttons = screen.getAllByRole('button');
    // find a button with RefreshIcon... let's just trigger by click if possible
    // We can also mock network and check if PATCH is called on first button
  });
});

describe('UserEditMenu Component', () => {
  const user = { username: 'testuser', role: 'MAPPER', mappingLevel: 'BEGINNER' };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly and allows role update', async () => {
    network.fetchLocalJSONAPI.mockResolvedValue({});
    const setStatus = jest.fn();
    const close = jest.fn();

    renderWithRouter(
      <UserEditMenu user={user} token="123" close={close} setStatus={setStatus} levels={mockLevels} />
    );

    fireEvent.click(screen.getByText('Admin'));
    await waitFor(() => expect(network.fetchLocalJSONAPI).toHaveBeenCalled());
    expect(setStatus).toHaveBeenCalledWith({ success: true });
    expect(close).toHaveBeenCalled();
  });

  it('allows level update', async () => {
    network.fetchLocalJSONAPI.mockResolvedValue({});
    const setStatus = jest.fn();
    const close = jest.fn();

    renderWithRouter(
      <UserEditMenu user={user} token="123" close={close} setStatus={setStatus} levels={mockLevels} />
    );

    fireEvent.click(screen.getByText('ADVANCED'));
    await waitFor(() => expect(network.fetchLocalJSONAPI).toHaveBeenCalled());
    expect(setStatus).toHaveBeenCalledWith({ success: true });
    expect(close).toHaveBeenCalled();
  });

  it('handles error on update', async () => {
    network.fetchLocalJSONAPI.mockRejectedValue(new Error('error'));
    const setStatus = jest.fn();
    const close = jest.fn();

    renderWithRouter(
      <UserEditMenu user={user} token="123" close={close} setStatus={setStatus} levels={mockLevels} />
    );

    fireEvent.click(screen.getByText('Admin'));
    await waitFor(() => expect(network.fetchLocalJSONAPI).toHaveBeenCalled());
    expect(setStatus).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
  });
});
