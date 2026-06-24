import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import { store } from '../store';

import { SwipesByProjectType } from '../components/partnerMapswipeStats/swipesByProjectType';
import { ContributionsGrid } from '../components/partnerMapswipeStats/contributionsGrid';

const Wrapper = ({ children }) => (
  <Provider store={store}>
    <IntlProvider locale="en">
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </IntlProvider>
  </Provider>
);

// ─── SwipesByProjectType ──────────────────────────────────────────────────────

describe('SwipesByProjectType component', () => {
  it('renders with empty array (default)', () => {
    const { container } = render(<SwipesByProjectType />, { wrapper: Wrapper });
    expect(container).toBeInTheDocument();
  });

  it('shows "No data found" when empty', () => {
    render(<SwipesByProjectType contributionsByProjectType={[]} />, { wrapper: Wrapper });
    expect(screen.getByText('No data found')).toBeInTheDocument();
  });

  it('renders with find project type data', () => {
    const mockData = [
      { projectType: 'find', totalcontributions: 100, projectTypeDisplay: 'Find' },
    ];
    const { container } = render(
      <SwipesByProjectType contributionsByProjectType={mockData} />,
      { wrapper: Wrapper }
    );
    expect(container).toBeInTheDocument();
  });

  it('renders with validate project type data', () => {
    const mockData = [
      { projectType: 'validate', totalcontributions: 50, projectTypeDisplay: 'Validate' },
    ];
    const { container } = render(
      <SwipesByProjectType contributionsByProjectType={mockData} />,
      { wrapper: Wrapper }
    );
    expect(container).toBeInTheDocument();
  });

  it('renders with mixed project types', () => {
    const mockData = [
      { projectType: 'find', totalcontributions: 100 },
      { projectType: 'validate', totalcontributions: 50 },
      { projectType: 'street', totalcontributions: 30 },
    ];
    const { container } = render(
      <SwipesByProjectType contributionsByProjectType={mockData} />,
      { wrapper: Wrapper }
    );
    expect(container).toBeInTheDocument();
  });

  it('does not show empty state when data exists', () => {
    const mockData = [
      { projectType: 'find', totalcontributions: 100 },
    ];
    render(<SwipesByProjectType contributionsByProjectType={mockData} />, { wrapper: Wrapper });
    expect(screen.queryByText('No data found')).not.toBeInTheDocument();
  });

  it('renders with zero totalcontributions (filtered out)', () => {
    const mockData = [
      { projectType: 'find', totalcontributions: 0 },
    ];
    render(<SwipesByProjectType contributionsByProjectType={mockData} />, { wrapper: Wrapper });
    // No data visible since count is 0
    expect(screen.queryByText('No data found')).not.toBeInTheDocument();
  });
});

// ─── ContributionsGrid ────────────────────────────────────────────────────────

describe('ContributionsGrid component', () => {
  const mockContributions = [
    { taskDate: '2024-01-15', totalcontributions: 10 },
    { taskDate: '2024-02-20', totalcontributions: 5 },
    { taskDate: '2024-03-10', totalcontributions: 20 },
  ];

  it('renders with contribution data', () => {
    const { container } = render(
      <ContributionsGrid
        contributionsByDate={mockContributions}
        startDate="2024-01-01"
        endDate="2024-12-31"
      />,
      { wrapper: Wrapper }
    );
    expect(container).toBeInTheDocument();
  });

  it('renders with empty contributions array', () => {
    const { container } = render(
      <ContributionsGrid
        contributionsByDate={[]}
        startDate="2024-01-01"
        endDate="2024-12-31"
      />,
      { wrapper: Wrapper }
    );
    expect(container).toBeInTheDocument();
  });

  it('renders the contributions heading', () => {
    render(
      <ContributionsGrid
        contributionsByDate={mockContributions}
        startDate="2024-01-01"
        endDate="2024-12-31"
      />,
      { wrapper: Wrapper }
    );
    expect(screen.getByText(/contributions/i)).toBeInTheDocument();
  });
});
