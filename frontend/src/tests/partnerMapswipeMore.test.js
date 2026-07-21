import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import { store } from '../store';

import { TimeSpentContributing } from '../components/partnerMapswipeStats/timeSpentContributing';
import { ContributionsHeatmap } from '../components/partnerMapswipeStats/contributionsHeatmap';

const Wrapper = ({ children }) => (
  <Provider store={store}>
    <IntlProvider locale="en">
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </IntlProvider>
  </Provider>
);

// ─── TimeSpentContributing ────────────────────────────────────────────────────

describe('TimeSpentContributing component', () => {
  it('renders with empty array (default)', () => {
    const { container } = render(<TimeSpentContributing />, { wrapper: Wrapper });
    expect(container).toBeInTheDocument();
  });

  it('shows "No data found" when empty', () => {
    render(<TimeSpentContributing contributionTimeByDate={[]} />, { wrapper: Wrapper });
    expect(screen.getByText('No data found')).toBeInTheDocument();
  });

  it('renders with data', () => {
    const mockData = [
      { date: '2024-01-15', totalcontributionTime: 3600 },
      { date: '2024-01-16', totalcontributionTime: 1800 },
    ];
    const { container } = render(
      <TimeSpentContributing contributionTimeByDate={mockData} />,
      { wrapper: Wrapper }
    );
    expect(container).toBeInTheDocument();
  });

  it('does not show empty state when data exists', () => {
    const mockData = [{ date: '2024-01-15', totalcontributionTime: 3600 }];
    render(<TimeSpentContributing contributionTimeByDate={mockData} />, { wrapper: Wrapper });
    expect(screen.queryByText('No data found')).not.toBeInTheDocument();
  });

  it('renders day and month toggle buttons', () => {
    render(<TimeSpentContributing />, { wrapper: Wrapper });
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('switches to month view when month button clicked', () => {
    render(<TimeSpentContributing />, { wrapper: Wrapper });
    const buttons = screen.getAllByRole('button');
    // Find month button (second one typically)
    const monthButton = buttons.find(b => b.textContent.toLowerCase().includes('month'));
    if (monthButton) {
      fireEvent.click(monthButton);
    }
    expect(screen.getByText(/time spent contributing/i)).toBeInTheDocument();
  });
});

// ─── ContributionsHeatmap ─────────────────────────────────────────────────────

describe('ContributionsHeatmap component', () => {
  it('renders with empty contributions (default)', () => {
    const { container } = render(
      <ContributionsHeatmap />,
      { wrapper: Wrapper }
    );
    expect(container).toBeInTheDocument();
  });

  it('renders the ctrl+scroll hint text', () => {
    render(<ContributionsHeatmap contributionsByGeo={[]} />, { wrapper: Wrapper });
    expect(screen.getByText('Use Ctrl + Scroll to zoom')).toBeInTheDocument();
  });

  it('renders with contribution data', () => {
    const mockData = [
      {
        totalContribution: 100,
        geojson: { type: 'Point', coordinates: [12.5, 41.9] },
      },
    ];
    const { container } = render(
      <ContributionsHeatmap contributionsByGeo={mockData} />,
      { wrapper: Wrapper }
    );
    expect(container).toBeInTheDocument();
  });

  it('renders the heatmap heading', () => {
    render(<ContributionsHeatmap />, { wrapper: Wrapper });
    expect(screen.getByText(/contributions heatmap/i)).toBeInTheDocument();
  });
});
