import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import { Provider } from 'react-redux';
import { useInboxQueryAPI, backendToQueryConversion } from '../UseInboxQueryAPI';
import { remapParamsToAPI } from '../../utils/remapParamsToAPI';
import { store } from '../../store';

jest.mock('axios');

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: () => jest.fn(),
}));

const DummyComponent = ({ queryParamsState }) => {
  const [state] = useInboxQueryAPI(undefined, [queryParamsState, jest.fn()]);

  return (
    <div>
      <div data-testid="notifications-status">{state.isLoading ? 'Loading...' : state.isError ? 'Error' : 'Success'}</div>
      <div data-testid="notifications-count">{state.userMessages?.length || 0}</div>
    </div>
  );
};

describe('useInboxQueryAPI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches notifications successfully', async () => {
    store.dispatch({ type: 'SET_TOKEN', token: 'fake_token' });

    const mockData = {
      userMessages: [{ messageId: 1 }],
      pagination: { hasNext: false, hasPrev: false, page: 1 },
    };
    
    axios.CancelToken = jest.fn(function(executor) {
       executor(jest.fn());
    });
    
    axios.mockResolvedValueOnce({
      data: mockData,
      headers: { 'content-type': 'application/json' },
    });

    render(
      <Provider store={store}>
        <DummyComponent queryParamsState={{ page: 1 }} />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('notifications-status')).toHaveTextContent('Success');
    });
  });

  it('handles "No messages found" error', async () => {
    store.dispatch({ type: 'SET_TOKEN', token: 'fake_token' });

    axios.CancelToken = jest.fn(function(executor) {
       executor(jest.fn());
    });

    axios.mockRejectedValueOnce({
      response: { data: { Error: 'No messages found' } },
    });

    render(
      <Provider store={store}>
        <DummyComponent queryParamsState={{ page: 1 }} />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('notifications-status')).toHaveTextContent('Success');
    });
  });

  it('handles generic error response', async () => {
    store.dispatch({ type: 'SET_TOKEN', token: 'fake_token' });

    axios.CancelToken = jest.fn(function(executor) {
       executor(jest.fn());
    });

    axios.mockRejectedValueOnce({
      response: { data: 'Some error' },
    });

    render(
      <Provider store={store}>
        <DummyComponent queryParamsState={{ page: 1 }} />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('notifications-status')).toHaveTextContent('Error');
    });
  });
  
  it('throws error when no token is present', async () => {
    store.dispatch({ type: 'SET_TOKEN', token: null });

    axios.CancelToken = jest.fn(function(executor) {
       executor(jest.fn());
    });

    render(
      <Provider store={store}>
        <DummyComponent queryParamsState={{ page: 1 }} />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('notifications-status')).toHaveTextContent('Error');
    });
  });

  it('remapParamsToAPI works correctly', () => {
    const params = { fromUsername: 'user1', types: ['1', '2'] };
    const mapped = remapParamsToAPI(params, backendToQueryConversion);
    expect(mapped.from).toBe('user1');
    expect(mapped.messageType).toBe('1,2');
  });
});
