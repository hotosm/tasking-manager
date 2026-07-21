import '@testing-library/jest-dom';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { UserInterestsForm } from '../interests';
import { renderWithRouter, ReduxIntlProviders } from '../../../../utils/testWithIntl';
import * as network from '../../../../network/genericJSONRequest';
import { createStore } from 'redux';
import reducers from '../../../../store/reducers';

jest.mock('../../../../network/genericJSONRequest');

const localStore = createStore(reducers, {
  auth: { token: 'token', userDetails: { username: 'tester', id: 1 } }
});

describe('UserInterestsForm Component', () => {
  const mockInterests = {
    interests: [
      { id: 1, name: 'Buildings', userSelected: false },
      { id: 2, name: 'Roads', userSelected: true },
    ],
  };

  beforeEach(() => {
    // Redux wrapper needs to provide userDetails with username
    network.fetchLocalJSONAPI.mockResolvedValue(mockInterests);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders component and fetches interests', async () => {
    renderWithRouter(
      <ReduxIntlProviders localStore={localStore}>
        <UserInterestsForm />
      </ReduxIntlProviders>
    );

    expect(screen.getByText('Interests')).toBeInTheDocument();
    await waitFor(() => expect(network.fetchLocalJSONAPI).toHaveBeenCalledWith('users/tester/queries/interests/', 'token'));
    await waitFor(() => {
      expect(screen.getByText('Buildings')).toBeInTheDocument();
      expect(screen.getByText('Roads')).toBeInTheDocument();
    });
  });

  it('allows selecting an interest and saving', async () => {
    network.pushToLocalJSONAPI.mockResolvedValue({});
    renderWithRouter(
      <ReduxIntlProviders localStore={localStore}>
        <UserInterestsForm />
      </ReduxIntlProviders>
    );

    await waitFor(() => expect(screen.getByText('Buildings')).toBeInTheDocument());

    const saveButton = screen.getByText('Save');
    expect(saveButton).toBeDisabled();

    // Click on "Buildings"
    fireEvent.click(screen.getByText('Buildings'));

    expect(saveButton).toBeEnabled();

    fireEvent.click(saveButton);

    await waitFor(() => expect(network.pushToLocalJSONAPI).toHaveBeenCalledWith(
      'users/me/actions/set-interests/',
      JSON.stringify({ interests: [1, 2], id: 1 }),
      'token'
    ));

    expect(screen.getByText('Interests updated successfully.')).toBeInTheDocument();
  });

  it('shows error if saving fails', async () => {
    network.pushToLocalJSONAPI.mockRejectedValue(new Error('Failed'));
    renderWithRouter(
      <ReduxIntlProviders localStore={localStore}>
        <UserInterestsForm />
      </ReduxIntlProviders>
    );

    await waitFor(() => expect(screen.getByText('Buildings')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Buildings'));
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => expect(screen.getByText('Interests update failed.')).toBeInTheDocument());
  });
});
