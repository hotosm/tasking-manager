import '@testing-library/jest-dom';
import { screen, waitFor } from '@testing-library/react';
import { Overview, formatSecondsToTwoUnits, getShortNumber } from '../overview';
import { createComponentWithMemoryRouter, ReduxIntlProviders, renderWithRouter } from '../../../utils/testWithIntl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as genericJSONRequest from '../../../network/genericJSONRequest';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('formatSecondsToTwoUnits', () => {
  it('formats seconds correctly', () => {
    expect(formatSecondsToTwoUnits(3600)).toBe('1 hour');
    expect(formatSecondsToTwoUnits(3660)).toBe('1 hour 1 minute');
    expect(formatSecondsToTwoUnits(3660, true)).toBe('1 hr 1 min');
    expect(formatSecondsToTwoUnits(86400 * 2 + 3600)).toBe('2 days 1 hour');
    expect(formatSecondsToTwoUnits(86400 * 2 + 3600, true)).toBe('2 days 1 hr');
  });
});

describe('getShortNumber', () => {
  it('formats short numbers correctly', () => {
    const { container } = renderWithRouter(
      <ReduxIntlProviders>{getShortNumber(1500)}</ReduxIntlProviders>
    );
    expect(container.textContent).toMatch(/1.5\s*K/);
  });
  
  it('returns formatted number if it is just a number', () => {
    const { container } = renderWithRouter(
      <ReduxIntlProviders>{getShortNumber(500)}</ReduxIntlProviders>
    );
    expect(container.textContent).toBe('500');
  });
});

describe('Overview', () => {
  it('renders loading state initially and then data', async () => {
    jest.spyOn(genericJSONRequest, 'fetchLocalJSONAPI').mockResolvedValue({
      nameInsideProvider: 'Test Provider',
      totalcontributions: 5000,
      totalRecentcontributions: 100,
      totalcontributionTime: 7200,
      totalRecentcontributionTime: 3600,
      totalContributors: 50,
      totalRecentContributors: 5
    });

    renderWithRouter(
      <QueryClientProvider client={queryClient}>
        <ReduxIntlProviders>
          <Overview />
        </ReduxIntlProviders>
      </QueryClientProvider>,
      { route: '/partners/test-partner' }
    );

    // After loading, it should display the partner name
    await waitFor(() => {
      expect(screen.getByText('Test Provider')).toBeInTheDocument();
    });

    expect(screen.getAllByText(/5/)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/K/i)[0]).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    
    // 7200 seconds is 2 hours
    expect(screen.getByText(/2 hours/)).toBeInTheDocument();
    // 3600 seconds is 1 hour
    expect(screen.getByText(/1 hr/)).toBeInTheDocument();
    
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getAllByText('5')[0]).toBeInTheDocument();
  });

  it('renders fallback when data is missing', async () => {
    jest.spyOn(genericJSONRequest, 'fetchLocalJSONAPI').mockResolvedValue({
      nameInsideProvider: 'Empty Provider',
      totalcontributions: null,
      totalRecentcontributions: null,
      totalcontributionTime: null,
      totalRecentcontributionTime: null,
      totalContributors: null,
      totalRecentContributors: null
    });

    renderWithRouter(
      <QueryClientProvider client={queryClient}>
        <ReduxIntlProviders>
          <Overview />
        </ReduxIntlProviders>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Empty Provider')).toBeInTheDocument();
    });
  });
});
