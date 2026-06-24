import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';

import { OrganisationStats } from '../organisationStats';
import { useFetch } from '../../hooks/UseFetch';
import {
  useTasksStatsQueryParams,
  useTasksStatsQueryAPI,
} from '../../hooks/UseTasksStatsQueryAPI';
import { useCurrentYearStats } from '../../hooks/UseOrgYearStats';
import { useTotalTasksStats } from '../../hooks/UseTotalTasksStats';

const mockNavigate = jest.fn();
const mockSetQuery = jest.fn();
const mockFetchTasksStatistics = jest.fn();

let mockParams = {
  id: '123',
};

let mockState = {
  auth: {
    token: 'token-123',
    userDetails: {
      role: 'ADMIN',
    },
    organisations: [],
  },
};

const mockOrganisation = {
  name: 'HOT Org',
  logo: 'https://example.com/logo.png',
  type: 'FULL_FEE',
  subscriptionTier: 'GOLD',
};

const mockOrgStats = {
  activeTasks: [
    { taskId: 1 },
    { taskId: 2 },
  ],
  projects: [
    { projectId: 1 },
    { projectId: 2 },
  ],
};

jest.mock('react-redux', () => ({
  useSelector: (selector) => selector(mockState),
}));

jest.mock('react-router-dom', () => {
  const actualReactRouter = jest.requireActual('react-router-dom');

  return {
    ...actualReactRouter,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  };
});

jest.mock('../../hooks/UseFetch', () => ({
  useFetch: jest.fn(),
}));

jest.mock('../../hooks/UseMetaTags', () => ({
  useSetTitleTag: jest.fn(),
}));

jest.mock('../../hooks/UseTasksStatsQueryAPI', () => ({
  useTasksStatsQueryParams: jest.fn(),
  useTasksStatsQueryAPI: jest.fn(),
}));

jest.mock('../../hooks/UseOrgYearStats', () => ({
  useCurrentYearStats: jest.fn(),
}));

jest.mock('../../hooks/UseTotalTasksStats', () => ({
  useTotalTasksStats: jest.fn(),
}));

jest.mock('react-intl', () => {
  const actualReactIntl = jest.requireActual('react-intl');

  return {
    ...actualReactIntl,
    FormattedMessage: ({ id, defaultMessage }) => (
      <span>{defaultMessage || id}</span>
    ),
  };
});

jest.mock('react-placeholder', () => ({
  __esModule: true,
  default: ({ children, ready }) =>
    ready ? <div>{children}</div> : <div data-testid="organisation-placeholder">Loading</div>,
}));

jest.mock('../../components/teamsAndOrgs/tasksStats', () => ({
  TasksStats: ({ query, stats, error, loading, retryFn }) => (
    <div data-testid="tasks-stats">
      Tasks Stats {stats?.length || 0} {error ? 'error' : 'ok'} {loading ? 'loading' : 'ready'}
      {query?.status || ''}
      <button type="button" onClick={retryFn}>
        Retry stats
      </button>
    </div>
  ),
}));

jest.mock('../../components/teamsAndOrgs/remainingTasksStats', () => ({
  RemainingTasksStats: ({ tasks }) => (
    <div data-testid="remaining-tasks-stats">
      Remaining Tasks {tasks?.length || 0}
    </div>
  ),
}));

jest.mock('../../components/teamsAndOrgs/orgUsageLevel', () => ({
  OrganisationUsageLevel: ({ orgName, completedActions }) => (
    <div data-testid="organisation-usage-level">
      Usage Level {orgName} {completedActions}
    </div>
  ),
  OrganisationTier: ({ type, subscriptionTier, completedActions }) => (
    <div data-testid="organisation-tier">
      Tier {type} {subscriptionTier} {completedActions}
    </div>
  ),
}));

jest.mock('../../components/teamsAndOrgs/organisationProjectStats', () => ({
  OrganisationProjectStats: ({ projects, orgName }) => (
    <div data-testid="organisation-project-stats">
      Organisation Project Stats {orgName} {projects?.length || 0}
    </div>
  ),
}));

beforeEach(() => {
  jest.clearAllMocks();

  mockParams = {
    id: '123',
  };

  mockState = {
    auth: {
      token: 'token-123',
      userDetails: {
        role: 'ADMIN',
      },
      organisations: [],
    },
  };

  useTasksStatsQueryParams.mockReturnValue([{ status: 'all' }, mockSetQuery]);

  useTasksStatsQueryAPI.mockReturnValue([
    {
      stats: [{ taskId: 1 }],
      isError: false,
      isLoading: false,
    },
    mockFetchTasksStatistics,
  ]);

  useCurrentYearStats.mockReturnValue([
    {
      year: 2026,
    },
  ]);

  useTotalTasksStats.mockReturnValue({
    mapped: 10,
    validated: 5,
  });

  useFetch.mockImplementation((url) => {
    if (url.includes('/statistics/')) {
      return [false, false, mockOrgStats];
    }

    return [false, false, mockOrganisation];
  });
});

describe('OrganisationStats view', () => {
  it('renders organisation statistics and tier information for an organisation manager', () => {
    render(<OrganisationStats />);

    expect(screen.getByAltText('HOT Org')).toHaveAttribute(
      'src',
      'https://example.com/logo.png',
    );
    expect(screen.getByText('HOT Org')).toBeInTheDocument();

    expect(screen.getByTestId('tasks-stats')).toHaveTextContent('Tasks Stats 1 ok ready');
    expect(screen.getByTestId('remaining-tasks-stats')).toHaveTextContent('Remaining Tasks 2');
    expect(screen.getByTestId('organisation-tier')).toHaveTextContent('Tier FULL_FEE GOLD 15');
    expect(screen.getByTestId('organisation-project-stats')).toHaveTextContent(
      'Organisation Project Stats HOT Org 2',
    );

    expect(useFetch).toHaveBeenCalledWith('organisations/123/?omitManagerList=true', '123');
    expect(useFetch).toHaveBeenCalledWith('organisations/123/statistics/', '123');
    expect(useTasksStatsQueryAPI).toHaveBeenCalledWith(
      { taskStats: [] },
      { status: 'all' },
      'organisationId=123',
    );
  });

  it('renders usage level when tier information should not be visible', () => {
    mockState.auth.userDetails.role = 'MAPPER';

    useFetch.mockImplementation((url) => {
      if (url.includes('/statistics/')) {
        return [false, false, mockOrgStats];
      }

      return [
        false,
        false,
        {
          ...mockOrganisation,
          type: 'FREE',
          subscriptionTier: undefined,
        },
      ];
    });

    render(<OrganisationStats />);

    expect(screen.getByTestId('organisation-usage-level')).toHaveTextContent(
      'Usage Level HOT Org 15',
    );
    expect(screen.queryByTestId('organisation-tier')).not.toBeInTheDocument();
  });

  it('renders tier information when user belongs to the organisation managers list', () => {
    mockState.auth.userDetails.role = 'MAPPER';
    mockState.auth.organisations = [123];

    render(<OrganisationStats />);

    expect(screen.getByTestId('organisation-tier')).toHaveTextContent('Tier FULL_FEE GOLD 15');
  });

  it('redirects to login when token is missing', async () => {
    mockState.auth.token = undefined;

    render(<OrganisationStats />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('renders placeholder while organisation data is loading', () => {
    useFetch
      .mockReturnValueOnce([false, true, mockOrganisation])
      .mockReturnValueOnce([false, false, mockOrgStats]);

    render(<OrganisationStats />);

    expect(screen.getByTestId('organisation-placeholder')).toBeInTheDocument();
  });

  it('renders placeholder when organisation request has error', () => {
    useFetch
      .mockReturnValueOnce([true, false, {}])
      .mockReturnValueOnce([false, false, mockOrgStats]);

    render(<OrganisationStats />);

    expect(screen.getByTestId('organisation-placeholder')).toBeInTheDocument();
  });

  it('renders placeholder while organisation statistics are loading', () => {
    useFetch
      .mockReturnValueOnce([false, false, mockOrganisation])
      .mockReturnValueOnce([false, true, mockOrgStats]);

    render(<OrganisationStats />);

    expect(screen.getByTestId('organisation-placeholder')).toBeInTheDocument();
    expect(screen.getByTestId('tasks-stats')).toBeInTheDocument();
  });

  it('uses fallback organisation title when organisation name is empty', () => {
    useFetch.mockImplementation((url) => {
      if (url.includes('/statistics/')) {
        return [false, false, mockOrgStats];
      }

      return [
        false,
        false,
        {
          ...mockOrganisation,
          name: '',
        },
      ];
    });

    render(<OrganisationStats />);

    expect(screen.getByTestId('organisation-project-stats')).toHaveTextContent(
        'Organisation Project Stats 2',
    );
  });
});