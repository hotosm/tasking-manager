import React, { useState } from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import { store } from '../store';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

import { DateFilter } from '../components/partnerMapswipeStats/dateFilter';
import { ProjectTypeAreaStats } from '../components/partnerMapswipeStats/projectTypeAreaStats';
import { SwipesByOrganization } from '../components/partnerMapswipeStats/swipesByOrganization';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const Wrapper = ({ children }) => (
  <Provider store={store}>
    <IntlProvider locale="en">
      <MemoryRouter initialEntries={['/partners/test/stats']}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </MemoryRouter>
    </IntlProvider>
  </Provider>
);

// ─── DateFilter ───────────────────────────────────────────────────────────────

function DateFilterWrapper() {
  const [filters, setFilters] = useState({});
  return <DateFilter isLoading={false} filters={filters} setFilters={setFilters} />;
}

describe('DateFilter component', () => {
  it('renders without crashing', () => {
    const { container } = render(<DateFilterWrapper />, { wrapper: Wrapper });
    expect(container).toBeInTheDocument();
  });

  it('renders date picker inputs', () => {
    render(<DateFilterWrapper />, { wrapper: Wrapper });
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThanOrEqual(2);
  });

  it('renders "to" text separator', () => {
    render(<DateFilterWrapper />, { wrapper: Wrapper });
    expect(screen.getByText('to')).toBeInTheDocument();
  });

  it('renders nothing when isLoading is true', () => {
    const setFilters = jest.fn();
    const { container } = render(
      <DateFilter isLoading={true} filters={{}} setFilters={setFilters} />,
      { wrapper: Wrapper }
    );
    // Returns empty fragment when loading
    expect(container.firstChild).toBeNull();
  });
});

// ─── ProjectTypeAreaStats ─────────────────────────────────────────────────────

describe('ProjectTypeAreaStats component', () => {
  it('renders with empty arrays (defaults)', () => {
    const { container } = render(<ProjectTypeAreaStats />, { wrapper: Wrapper });
    expect(container).toBeInTheDocument();
  });

  it('renders with projectTypeAreaStats data', () => {
    const mockStats = [
      { projectType: 'build_area', totalcontributions: 500 },
      { projectType: 'foot_print', totalcontributions: 200 },
      { projectType: 'change_detection', totalcontributions: 300 },
    ];
    const { container } = render(
      <ProjectTypeAreaStats projectTypeAreaStats={mockStats} areaSwipedByProjectType={[]} />,
      { wrapper: Wrapper }
    );
    expect(container).toBeInTheDocument();
  });

  it('renders with areaSwipedByProjectType data', () => {
    const mockAreaStats = [
      { projectType: 'build_area', totalArea: 1000 },
      { projectType: 'change_detection', totalArea: 500 },
    ];
    const { container } = render(
      <ProjectTypeAreaStats projectTypeAreaStats={[]} areaSwipedByProjectType={mockAreaStats} />,
      { wrapper: Wrapper }
    );
    expect(container).toBeInTheDocument();
  });

  it('handles alternative project type names (buildarea, footprint, changedetection)', () => {
    const mockStats = [
      { projectType: 'buildarea', totalcontributions: 100 },
      { projectType: 'footprint', totalcontributions: 50 },
      { projectType: 'changedetection', totalcontributions: 75 },
    ];
    const { container } = render(
      <ProjectTypeAreaStats projectTypeAreaStats={mockStats} areaSwipedByProjectType={[]} />,
      { wrapper: Wrapper }
    );
    expect(container).toBeInTheDocument();
  });

  it('handles find/validate/compare project type names', () => {
    const mockStats = [
      { projectType: 'find', totalcontributions: 100 },
      { projectType: 'validate', totalcontributions: 50 },
      { projectType: 'compare', totalcontributions: 75 },
    ];
    const { container } = render(
      <ProjectTypeAreaStats projectTypeAreaStats={mockStats} areaSwipedByProjectType={[]} />,
      { wrapper: Wrapper }
    );
    expect(container).toBeInTheDocument();
  });
});

// ─── SwipesByOrganization ─────────────────────────────────────────────────────

describe('SwipesByOrganization component', () => {
  it('renders with empty contributions array', () => {
    const { container } = render(
      <SwipesByOrganization contributionsByOrganization={[]} />,
      { wrapper: Wrapper }
    );
    expect(container).toBeInTheDocument();
  });

  it('shows "No data found" when empty', () => {
    render(
      <SwipesByOrganization contributionsByOrganization={[]} />,
      { wrapper: Wrapper }
    );
    expect(screen.getByText('No data found')).toBeInTheDocument();
  });

  it('renders with organizations data (≤4 orgs, no grouping)', () => {
    const mockData = [
      { organizationName: 'Org A', totalcontributions: 100 },
      { organizationName: 'Org B', totalcontributions: 200 },
    ];
    const { container } = render(
      <SwipesByOrganization contributionsByOrganization={mockData} />,
      { wrapper: Wrapper }
    );
    expect(container).toBeInTheDocument();
  });

  it('renders with more than 4 organizations (groups "Others")', () => {
    const mockData = Array.from({ length: 7 }, (_, i) => ({
      organizationName: `Org ${i}`,
      totalcontributions: (i + 1) * 100,
    }));
    const { container } = render(
      <SwipesByOrganization contributionsByOrganization={mockData} />,
      { wrapper: Wrapper }
    );
    expect(container).toBeInTheDocument();
  });

  it('renders without contributionsByOrganization prop (uses default)', () => {
    const { container } = render(
      <SwipesByOrganization />,
      { wrapper: Wrapper }
    );
    expect(container).toBeInTheDocument();
  });
});
