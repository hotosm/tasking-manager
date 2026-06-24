import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';

import { Welcome } from '../welcome';
import { useFetch } from '../../hooks/UseFetch';
import { calculateCompleteness } from '../../components/user/completeness';

const mockNavigate = jest.fn();

let mockState = {
  auth: {
    token: 'token-123',
    userDetails: {
      username: 'paul',
      projectsMapped: 0,
    },
  },
};

jest.mock('react-redux', () => ({
  useSelector: (selector) => selector(mockState),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

jest.mock('../../hooks/UseFetch', () => ({
  useFetch: jest.fn(),
}));

jest.mock('../../hooks/UseMetaTags', () => ({
  useSetTitleTag: jest.fn(),
}));

jest.mock('../../components/user/completeness', () => ({
  calculateCompleteness: jest.fn(),
}));

jest.mock('../../components/user/topBar', () => ({
  UserTopBar: () => <div data-testid="user-top-bar">User Top Bar</div>,
}));

jest.mock('../../components/user/content', () => ({
  WelcomeCard: () => <div data-testid="welcome-card">Welcome Card</div>,
  HelpCard: () => <div data-testid="help-card">Help Card</div>,
  FirstProjectBanner: () => <div data-testid="first-project-banner">First Project Banner</div>,
}));

jest.mock('../../components/user/forms/personalInformation', () => ({
  PersonalInformationForm: () => (
    <div data-testid="personal-information-form">Personal Information Form</div>
  ),
}));

jest.mock('../../components/projectCard/projectCard', () => ({
  ProjectCard: ({ projectId }) => <div data-testid="project-card">Project {projectId}</div>,
}));

jest.mock('../../components/projectCard/nCardPlaceholder', () => ({
  nCardPlaceholders: () => <div data-testid="project-placeholder">Loading projects</div>,
}));

jest.mock('react-placeholder', () => ({
  __esModule: true,
  default: ({ children, ready, customPlaceholder }) =>
    ready ? <div>{children}</div> : <div>{customPlaceholder}</div>,
}));

beforeEach(() => {
  jest.clearAllMocks();

  mockState = {
    auth: {
      token: 'token-123',
      userDetails: {
        username: 'paul',
        projectsMapped: 0,
      },
    },
  };

  useFetch.mockReturnValue([
    false,
    false,
    {
      results: [
        { projectId: 1 },
        { projectId: 2 },
        { projectId: 3 },
        { projectId: 4 },
        { projectId: 5 },
        { projectId: 6 },
      ],
    },
  ]);
});

describe('Welcome view', () => {
  it('renders the incomplete profile content when profile completeness is low', () => {
    calculateCompleteness.mockReturnValue(0.4);

    render(<Welcome />);

    expect(screen.getByTestId('user-top-bar')).toBeInTheDocument();
    expect(screen.getByTestId('welcome-card')).toBeInTheDocument();
    expect(screen.getByTestId('help-card')).toBeInTheDocument();
    expect(screen.getByTestId('personal-information-form')).toBeInTheDocument();
    expect(screen.queryByTestId('first-project-banner')).not.toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('redirects to login when user is not logged in', async () => {
    mockState.auth.token = undefined;
    calculateCompleteness.mockReturnValue(0.4);

    render(<Welcome />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('renders recommended projects when profile is complete and user has not mapped projects yet', () => {
    calculateCompleteness.mockReturnValue(0.8);

    render(<Welcome />);

    expect(screen.getByTestId('first-project-banner')).toBeInTheDocument();
    expect(screen.getAllByTestId('project-card')).toHaveLength(5);
    expect(useFetch).toHaveBeenCalledWith('users/paul/recommended-projects/', true);
  });

  it('redirects to contributions when profile is complete and user already mapped projects', async () => {
    mockState.auth.userDetails.projectsMapped = 3;
    calculateCompleteness.mockReturnValue(0.8);

    render(<Welcome />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        '/contributions/projects/?mappedByMe=1&action=any',
      );
    });
  });

  it('does not request recommended projects when username is missing', () => {
    mockState.auth.userDetails.username = undefined;
    calculateCompleteness.mockReturnValue(0.8);

    render(<Welcome />);

    expect(useFetch).toHaveBeenCalledWith('users/undefined/recommended-projects/', false);
  });

  it('shows project placeholders while recommended projects are loading', () => {
    calculateCompleteness.mockReturnValue(0.8);
    useFetch.mockReturnValueOnce([
      false,
      true,
      {
        results: [],
      },
    ]);

    render(<Welcome />);

    expect(screen.getByTestId('project-placeholder')).toBeInTheDocument();
  });
});