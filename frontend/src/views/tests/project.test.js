import '@testing-library/jest-dom';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';
import { QueryParamProvider } from 'use-query-params';
import { act, render, screen, waitFor } from '@testing-library/react';

import { store } from '../../store';
import {
  ManageProjectsPage,
  UserProjectsPage,
  CreateProject,
  MoreFilters,
  ProjectDetailPage,
  ProjectsPage,
  ProjectsPageIndex,
} from '../project';
import {
  createComponentWithMemoryRouter,
  QueryClientProviders,
  ReduxIntlProviders,
  renderWithRouter,
} from '../../utils/testWithIntl';
import { setupFaultyHandlers } from '../../network/tests/server';

import { projects } from '../../network/tests/mockData/projects';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// This is a late import in a React.lazy call; it takes awhile for date-fns to resolve, so we import it here manually.
// In the event you remove it, please measure test times before ''and'' after removal.
import '../../utils/chart';

// scrollTo is not implemented by jsdom; mock to avoid warnings.
window.scrollTo = jest.fn();

test('CreateProject renders ProjectCreate', async () => {
  renderWithRouter(
    <QueryParamProvider adapter={ReactRouter6Adapter}>
      <ReduxIntlProviders>
        <CreateProject />
      </ReduxIntlProviders>
    </QueryParamProvider>,
  );
  expect(screen.getByText('Loading...')).toBeInTheDocument();
});

describe('UserProjectsPage Component', () => {
  it('should redirect to login page if no user token is present', async () => {
    act(() => {
      store.dispatch({ type: 'SET_TOKEN', token: null });
    });

    const { router } = createComponentWithMemoryRouter(
      <QueryClientProviders>
        <QueryParamProvider adapter={ReactRouter6Adapter}>
          <ReduxIntlProviders>
            <UserProjectsPage management={false} />
          </ReduxIntlProviders>
        </QueryParamProvider>
      </QueryClientProviders>,
    );

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
  });

  it('should display component details', async () => {
    act(() => {
      store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
    });

    renderWithRouter(
      <QueryClientProviders>
        <QueryParamProvider adapter={ReactRouter6Adapter}>
          <ReduxIntlProviders>
            <UserProjectsPage management={false} location={{ pathname: '/manage' }} />
          </ReduxIntlProviders>
        </QueryParamProvider>
      </QueryClientProviders>,
    );
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: projects.results[0].name })).toBeInTheDocument(),
    );
    expect(
      screen.getByRole('heading', {
        name: /my projects/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', {
        name: /manage projects/i,
      }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
  });

  it('should display map depending on the redux state value', async () => {
    act(() => {
      store.dispatch({ type: 'TOGGLE_MAP' });
    });

    renderWithRouter(
      <QueryClientProviders>
        <QueryParamProvider adapter={ReactRouter6Adapter}>
          <ReduxIntlProviders>
            <UserProjectsPage management={false} />
          </ReduxIntlProviders>
        </QueryParamProvider>
      </QueryClientProviders>,
    );
    await screen.findByRole('heading', { name: projects.results[0].name });
    // Since WebGL is not supported by Node, we'll assume that the map context will be loaded
    expect(screen.getByRole('heading', { name: 'WebGL Context Not Found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'WebGL is enabled' })).toBeInTheDocument();
  });
});

test('More Filters should close the more filters container when clicked outside the container', async () => {
  const { user, router } = createComponentWithMemoryRouter(
    <QueryParamProvider adapter={ReactRouter6Adapter}>
      <ReduxIntlProviders>
        <MoreFilters />
      </ReduxIntlProviders>
    </QueryParamProvider>,
  );
  expect(
    screen.getByRole('link', {
      name: /apply/i,
    }),
  ).toBeInTheDocument();

  await user.click(screen.getAllByRole('button')[2]);
  await waitFor(() => expect(router.state.location.pathname).toBe('/explore'));
});

describe('ManageProjectsPage', () => {
  it('should display correct details for manage projects', async () => {
    act(() => {
      store.dispatch({ type: 'SET_USER_DETAILS', userDetails: { id: 1, role: 'ADMIN' } });
      store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
    });

    renderWithRouter(
      <QueryClientProviders>
        <QueryParamProvider adapter={ReactRouter6Adapter}>
          <ReduxIntlProviders>
            <ManageProjectsPage />
          </ReduxIntlProviders>
        </QueryParamProvider>
      </QueryClientProviders>,
    );

    await screen.findByRole('heading', { name: projects.results[0].name });
    expect(
      screen.getByRole('heading', {
        name: /manage projects/i,
      }),
    ).toBeInTheDocument();
  });

  it('should display map when show map switch is toggled', async () => {
    act(() => {
      store.dispatch({ type: 'TOGGLE_MAP' });
    });
    const { user } = renderWithRouter(
      <QueryClientProviders>
        <QueryParamProvider adapter={ReactRouter6Adapter}>
          <ReduxIntlProviders>
            <ManageProjectsPage />
          </ReduxIntlProviders>
        </QueryParamProvider>
      </QueryClientProviders>,
    );

    await user.click(screen.getByRole('checkbox'));
    // Since WebGL is not supported by Node, we'll assume that the map context will be loaded
    expect(screen.getByRole('heading', { name: 'WebGL Context Not Found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'WebGL is enabled' })).toBeInTheDocument();
  });
});

test('ProjectsPageIndex is a null DOM element', () => {
  const { container } = renderWithRouter(<ProjectsPageIndex />);
  expect(container).toBeEmptyDOMElement();
});

describe('Projects Page', () => {
  const setup = () => {
    renderWithRouter(
      <QueryClientProviders>
        <QueryParamProvider adapter={ReactRouter6Adapter}>
          <ReduxIntlProviders>
            <ProjectsPage />
          </ReduxIntlProviders>
        </QueryParamProvider>
      </QueryClientProviders>,
    );
  };

  it('should render component details', async () => {
    setup();
    expect(await screen.findByText('NRCS_Duduwa Mapping')).toBeInTheDocument();
  });

  it('should display map by user preferences', async () => {
    setup();
    await waitFor(() => {
      expect(screen.getByText('NRCS_Duduwa Mapping')).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: 'WebGL Context Not Found' })).toBeInTheDocument();
  });

  it('should not display map by user preferences', async () => {
    act(() => {
      store.dispatch({ type: 'TOGGLE_MAP' });
    });
    setup();
    await waitFor(() => {
      expect(screen.getByText('NRCS_Duduwa Mapping')).toBeInTheDocument();
    });
    expect(
      screen.queryByRole('heading', { name: 'WebGL Context Not Found' }),
    ).not.toBeInTheDocument();
  });
});

describe('Project Detail Page', () => {
  jest.mock('react-chartjs-2', () => ({
    Doughnut: () => null,
    Bar: () => null,
    Line: () => null,
  }));

  /**
   * Set up a ProjectDetailPage given an initial entry; this avoids issues where there is no project id.
   * @param {Array<string>} initialEntries The initial entries. This should be in the form of `[projects/:id]`.
   */
  function setup(initialEntries) {
    render(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route
            path="projects/:id"
            element={
              <QueryClientProviders>
                <ReduxIntlProviders>
                  <ProjectDetailPage />
                </ReduxIntlProviders>
              </QueryClientProviders>
            }
          />
        </Routes>
      </MemoryRouter>,
    );
  }

  it('should render component details', async () => {
    act(() => {
      store.dispatch({ type: 'SET_LOCALE', locale: 'es-AR' });
    });
    setup(['/projects/123']);
    await waitFor(() => {
      expect(screen.getByText(/sample project/i)).toBeInTheDocument();
      expect(screen.getByText(/hello world/i)).toBeInTheDocument();
    });
  });

  it('should display private project error message', async () => {
    setupFaultyHandlers();
    setup(['/projects/123']);

    await waitFor(() =>
      expect(
        screen.getByText("You don't have permission to access this project"),
      ).toBeInTheDocument(),
    );
  });

  it('should display generic error message', async () => {
    setupFaultyHandlers();
    render(
      <MemoryRouter initialEntries={['/projects/123']}>
        <Routes>
          <Route
            path="projects/:id"
            element={
              <QueryClientProviders>
                <ReduxIntlProviders>
                  <ProjectDetailPage />
                </ReduxIntlProviders>
              </QueryClientProviders>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(
        screen.getByRole('heading', {
          name: 'Project 123 not found',
        }),
      ).toBeInTheDocument(),
    );
  });
});
