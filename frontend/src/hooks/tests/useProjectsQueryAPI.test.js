import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import { Provider } from 'react-redux';
import { store } from '../../store';
import { useProjectsQueryAPI, stringify } from '../UseProjectsQueryAPI';

jest.mock('axios');

const DummyComponent = ({ queryParamsState }) => {
  const [state] = useProjectsQueryAPI(undefined, [queryParamsState, jest.fn()]);

  if (state.isLoading) return <div>Loading...</div>;
  if (state.isError) return <div>Error</div>;

  return (
    <div>
      <div data-testid="projects-count">{state.projects.length}</div>
    </div>
  );
};

describe('useProjectsQueryAPI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches projects successfully', async () => {
    const mockData = {
      results: [{ projectId: 1 }],
      mapResults: { features: [] },
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
        <DummyComponent queryParamsState={{ page: 1, action: 'any' }} />
      </Provider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('projects-count')).toHaveTextContent('1');
    });
  });

  it('handles "No projects found" error', async () => {
    axios.CancelToken = jest.fn(function(executor) {
       executor(jest.fn());
    });

    axios.mockRejectedValueOnce({
      response: { data: { Error: 'No projects found' } },
    });

    render(
      <Provider store={store}>
        <DummyComponent queryParamsState={{ page: 1 }} />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('projects-count')).toHaveTextContent('0');
    });
  });

  it('handles general error', async () => {
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
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  it('handles stringify', () => {
    expect(stringify({ page: 1, difficulty: 'ALL' })).toBe('difficulty=ALL&page=1');
  });
});
