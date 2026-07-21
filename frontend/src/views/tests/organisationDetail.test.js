import '@testing-library/jest-dom';
import { act, screen, waitFor } from '@testing-library/react';

import { store } from '../../store';
import { OrganisationDetail } from '../organisationDetail';
import {
  createComponentWithMemoryRouter,
  ReduxIntlProviders,
} from '../../utils/testWithIntl';
import { useFetch } from '../../hooks/UseFetch';
import { useEditOrgAllowed } from '../../hooks/UsePermissions';

jest.mock('../../hooks/UseFetch', () => ({
  useFetch: jest.fn(),
}));

jest.mock('../../hooks/UsePermissions', () => ({
  useEditOrgAllowed: jest.fn(),
}));

// Mock heavy sub-components
jest.mock('../../components/teamsAndOrgs/teams', () => ({
  Teams: ({ teams }) => (
    <div data-testid="teams-component">
      {teams?.map((t) => (
        <span key={t.teamId}>{t.name}</span>
      ))}
    </div>
  ),
}));

jest.mock('../../components/teamsAndOrgs/projects', () => ({
  Projects: ({ projects }) => (
    <div data-testid="projects-component">
      {projects?.results?.map((p) => (
        <span key={p.projectId}>{p.name}</span>
      ))}
    </div>
  ),
}));

jest.mock('../../components/user/avatar', () => ({
  UserAvatarList: ({ users }) => (
    <div data-testid="user-avatar-list">
      {users?.map((u) => (
        <span key={u.username}>{u.username}</span>
      ))}
    </div>
  ),
}));

jest.mock('../../components/button', () => ({
  EditButton: ({ children, url }) => (
    <a href={url} data-testid="edit-button">
      {children}
    </a>
  ),
}));

const mockOrganisation = {
  organisationId: 1,
  name: 'Test Organisation',
  description: 'Organisation description text',
  url: 'https://example.org',
  logo: 'https://example.org/logo.png',
  teams: [{ teamId: 10, name: 'Alpha Team' }],
  managers: [{ username: 'manager_user' }],
};

const mockProjects = {
  results: [{ projectId: 101, name: 'Test Project' }],
};

describe('OrganisationDetail', () => {
  const setup = ({ isAllowed = false, loading = false, orgData = mockOrganisation } = {}) => {
    useFetch.mockImplementation((url) => {
      if (url.startsWith('organisations/')) {
        return [null, loading, orgData];
      }
      if (url.startsWith('projects/')) {
        return [null, false, mockProjects];
      }
      return [null, false, {}];
    });
    useEditOrgAllowed.mockReturnValue([isAllowed]);

    act(() => {
      store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
      store.dispatch({
        type: 'SET_USER_DETAILS',
        userDetails: { id: 1, username: 'testuser', role: 'ADMIN' },
      });
    });

    return createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <OrganisationDetail />
      </ReduxIntlProviders>,
      { route: '/organisations/:slug', entryRoute: '/organisations/test-org' },
    );
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading placeholder while data is being fetched', () => {
    const { container } = setup({ loading: true, orgData: {} });
    expect(container.getElementsByClassName('show-loading-animation').length).toBeGreaterThan(0);
  });

  it('renders the organisation name after loading', async () => {
    setup({ loading: false });
    await waitFor(() => {
      expect(screen.getByText('Test Organisation')).toBeInTheDocument();
    });
  });

  it('renders the organisation description', async () => {
    setup({ loading: false });
    await waitFor(() => {
      expect(screen.getByText('Organisation description text')).toBeInTheDocument();
    });
  });

  it('renders the organisation URL as a link', async () => {
    setup({ loading: false });
    await waitFor(() => {
      const link = screen.getByRole('link', { name: 'https://example.org' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://example.org');
    });
  });

  it('renders the organisation logo', async () => {
    setup({ loading: false });
    await waitFor(() => {
      const logo = screen.getByAltText('Test Organisation');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', 'https://example.org/logo.png');
    });
  });

  it('renders the Teams component', async () => {
    setup({ loading: false });
    await waitFor(() => {
      expect(screen.getByTestId('teams-component')).toBeInTheDocument();
      expect(screen.getByText('Alpha Team')).toBeInTheDocument();
    });
  });

  it('renders the Projects component', async () => {
    setup({ loading: false });
    await waitFor(() => {
      expect(screen.getByTestId('projects-component')).toBeInTheDocument();
    });
  });

  it('renders the managers section with UserAvatarList', async () => {
    setup({ loading: false });
    await waitFor(() => {
      expect(screen.getByTestId('user-avatar-list')).toBeInTheDocument();
      expect(screen.getByText('manager_user')).toBeInTheDocument();
    });
  });

  it('does NOT render the edit button when user is not allowed to edit', async () => {
    setup({ loading: false, isAllowed: false });
    await waitFor(() => {
      expect(screen.queryByTestId('edit-button')).not.toBeInTheDocument();
    });
  });

  it('renders the edit button when user is allowed to edit', async () => {
    setup({ loading: false, isAllowed: true });
    await waitFor(() => {
      const editBtn = screen.getByTestId('edit-button');
      expect(editBtn).toBeInTheDocument();
      expect(editBtn).toHaveAttribute('href', '/manage/organisations/1');
    });
  });

  it('renders the Managers section heading', async () => {
    setup({ loading: false });
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /managers/i })).toBeInTheDocument();
    });
  });

  it('does NOT render logo when organisation has no logo', async () => {
    const orgWithoutLogo = { ...mockOrganisation, logo: null };
    setup({ loading: false, orgData: orgWithoutLogo });
    await waitFor(() => {
      expect(screen.queryByAltText('Test Organisation')).not.toBeInTheDocument();
    });
  });

  it('does NOT render url link when organisation has no url', async () => {
    const orgWithoutUrl = { ...mockOrganisation, url: null };
    setup({ loading: false, orgData: orgWithoutUrl });
    await waitFor(() => {
      expect(screen.queryByRole('link', { name: /https:\/\/example\.org/ })).not.toBeInTheDocument();
    });
  });
});
