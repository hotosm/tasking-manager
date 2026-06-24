import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { PartnersMapswipeStats } from '../partnersMapswipeStats';
import { useQuery } from '@tanstack/react-query';

let mockParams = {
  id: 'hot',
};

jest.mock('react-router-dom', () => {
  const actualReactRouter = jest.requireActual('react-router-dom');

  return {
    ...actualReactRouter,
    useParams: () => mockParams,
  };
});

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

jest.mock('../../network/genericJSONRequest', () => ({
  fetchLocalJSONAPI: jest.fn(),
}));

jest.mock('react-intl', () => {
  const actualReactIntl = jest.requireActual('react-intl');

  return {
    ...actualReactIntl,
    FormattedMessage: ({ id, defaultMessage }) => <span>{defaultMessage || id}</span>,
  };
});

jest.mock('react-placeholder', () => ({
  __esModule: true,
  default: ({ children, ready, customPlaceholder }) =>
    ready ? (
      <div>{children}</div>
    ) : (
      <div data-testid="mapswipe-placeholder">{customPlaceholder || 'Loading'}</div>
    ),
}));

jest.mock('../../components/svgIcons', () => ({
  InfoIcon: () => <span data-testid="info-icon">Info</span>,
  BanIcon: () => <span data-testid="ban-icon">Ban</span>,
}));

jest.mock('../../components/partnerMapswipeStats/overview', () => ({
  Overview: () => <div data-testid="overview">Overview</div>,
  getShortNumber: jest.fn((value) => `short-${value}`),
  formatSecondsToTwoUnits: jest.fn((value) => `time-${value}`),
}));

jest.mock('../../components/partnerMapswipeStats/dateFilter', () => ({
  DateFilter: ({ isLoading, filters, setFilters }) => (
    <div data-testid="date-filter">
      Date Filter {isLoading ? 'loading' : 'ready'} {filters.fromDate || ''}
      <button
        type="button"
        onClick={() =>
          setFilters({
            fromDate: '2026-01-01',
            toDate: '2026-01-31',
          })
        }
      >
        Apply date filter
      </button>
    </div>
  ),
}));

jest.mock('../../components/partnerMapswipeStats/groupMembers', () => ({
  GroupMembers: () => <div data-testid="group-members">Group Members</div>,
}));

jest.mock('../../components/partnerMapswipeStats/contributionsGrid', () => ({
  ContributionsGrid: ({ contributionsByDate, startDate, endDate }) => (
    <div data-testid="contributions-grid">
      Contributions Grid {contributionsByDate?.length || 0} {startDate || ''} {endDate || ''}
    </div>
  ),
}));

jest.mock('../../components/partnerMapswipeStats/contributionsHeatmap', () => ({
  ContributionsHeatmap: ({ contributionsByGeo }) => (
    <div data-testid="contributions-heatmap">
      Contributions Heatmap {contributionsByGeo?.length || 0}
    </div>
  ),
}));

jest.mock('../../components/partnerMapswipeStats/timeSpentContributing', () => ({
  TimeSpentContributing: ({ contributionTimeByDate }) => (
    <div data-testid="time-spent-contributing">
      Time Spent {contributionTimeByDate?.length || 0}
    </div>
  ),
}));

jest.mock('../../components/partnerMapswipeStats/timeSpentContributingByDay', () => ({
  TimeSpentContributingByDay: ({ contributionTimeByDate }) => (
    <div data-testid="time-spent-contributing-by-day">
      Time Spent By Day {contributionTimeByDate?.length || 0}
    </div>
  ),
}));

jest.mock('../../components/partnerMapswipeStats/projectTypeAreaStats', () => ({
  ProjectTypeAreaStats: ({ projectTypeAreaStats, areaSwipedByProjectType }) => (
    <div data-testid="project-type-area-stats">
      Project Type Area {projectTypeAreaStats?.length || 0}{' '}
      {areaSwipedByProjectType?.length || 0}
    </div>
  ),
}));

jest.mock('../../components/partnerMapswipeStats/swipesByProjectType', () => ({
  SwipesByProjectType: ({ contributionsByProjectType }) => (
    <div data-testid="swipes-by-project-type">
      Swipes By Project Type {contributionsByProjectType?.length || 0}
    </div>
  ),
}));

jest.mock('../../components/partnerMapswipeStats/swipesByOrganization', () => ({
  SwipesByOrganization: ({ contributionsByOrganization }) => (
    <div data-testid="swipes-by-organization">
      Swipes By Organization {contributionsByOrganization?.length || 0}
    </div>
  ),
}));

const mapswipeData = {
  contributionsByDate: [{ taskDate: '2026-01-01', totalcontributions: 10 }],
  contributionsByGeo: [{ id: 1 }],
  contributionTimeByDate: [
    { taskDate: '2026-01-01', totalcontributionTime: 60 },
    { taskDate: '2026-01-02', totalcontributionTime: 120 },
  ],
  contributionsByProjectType: [
    { projectType: 'buildArea', totalcontributions: 100 },
    { projectType: 'footprint', totalcontributions: 200 },
  ],
  areaSwipedByProjectType: [{ projectType: 'buildArea', totalArea: 50 }],
  contributionsByorganizationName: [{ organizationName: 'HOT', totalcontributions: 20 }],
};

beforeEach(() => {
  jest.clearAllMocks();

  mockParams = {
    id: 'hot',
  };

  useQuery.mockReturnValue({
    isLoading: false,
    isError: false,
    isRefetching: false,
    data: mapswipeData,
  });
});

describe('PartnersMapswipeStats view', () => {
  it('renders mapswipe stats sections with loaded data', () => {
    render(<PartnersMapswipeStats />);

    expect(screen.getByTestId('info-icon')).toBeInTheDocument();
    expect(screen.getByTestId('overview')).toBeInTheDocument();
    expect(screen.getByTestId('date-filter')).toBeInTheDocument();
    expect(screen.getByTestId('contributions-grid')).toHaveTextContent('1');
    expect(screen.getByTestId('contributions-heatmap')).toHaveTextContent('1');
    expect(screen.getByTestId('time-spent-contributing')).toHaveTextContent('2');
    expect(screen.getByTestId('time-spent-contributing-by-day')).toHaveTextContent('2');
    expect(screen.getByTestId('project-type-area-stats')).toHaveTextContent('2 1');
    expect(screen.getByTestId('swipes-by-project-type')).toHaveTextContent('2');
    expect(screen.getByTestId('swipes-by-organization')).toHaveTextContent('1');
    expect(screen.getByTestId('group-members')).toBeInTheDocument();

    expect(screen.getByText('Swipes')).toBeInTheDocument();
    expect(screen.getByText('Time Spent Contributing')).toBeInTheDocument();
  });

  it('renders placeholder while loading', () => {
    useQuery.mockReturnValueOnce({
      isLoading: true,
      isError: false,
      isRefetching: false,
      data: undefined,
    });

    render(<PartnersMapswipeStats />);

    expect(screen.getAllByTestId('mapswipe-placeholder').length).toBeGreaterThan(0);
  });

  it('renders placeholder while refetching', () => {
    useQuery.mockReturnValueOnce({
      isLoading: false,
      isError: false,
      isRefetching: true,
      data: mapswipeData,
    });

    render(<PartnersMapswipeStats />);

    expect(screen.getAllByTestId('mapswipe-placeholder').length).toBeGreaterThan(0);
  });

  it('renders error message when the query fails', () => {
    useQuery.mockReturnValueOnce({
      isLoading: false,
      isError: true,
      isRefetching: false,
      data: undefined,
    });

    render(<PartnersMapswipeStats />);

    expect(screen.getByTestId('ban-icon')).toBeInTheDocument();
  });

  it('renders dash values when data is not available but query did not fail', () => {
    useQuery.mockReturnValueOnce({
      isLoading: false,
      isError: false,
      isRefetching: false,
      data: undefined,
    });

    render(<PartnersMapswipeStats />);

    expect(screen.getAllByText('-')).toHaveLength(2);
  });

  it('renders zero values when contribution arrays are empty', () => {
    useQuery.mockReturnValueOnce({
      isLoading: false,
      isError: false,
      isRefetching: false,
      data: {
        ...mapswipeData,
        contributionTimeByDate: [],
        contributionsByProjectType: [],
      },
    });

    render(<PartnersMapswipeStats />);

    expect(screen.getAllByText('0')).toHaveLength(2);
  });

  it('updates date filters from the DateFilter component', () => {
    render(<PartnersMapswipeStats />);

    fireEvent.click(screen.getByRole('button', { name: /apply date filter/i }));

    expect(screen.getByTestId('date-filter')).toHaveTextContent('2026-01-01');
  });
});