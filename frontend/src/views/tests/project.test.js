import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { globalHistory } from '@reach/router';
import { ReachAdapter } from 'use-query-params/adapters/reach';
import { QueryParamProvider } from 'use-query-params';
import { act, render, screen, waitFor } from '@testing-library/react';
import { setupFaultyHandlers } from '../../network/tests/server';

import { store } from '../../store';
import {
  CreateProject,
  ManageProjectsPage,
  MoreFilters,
  ProjectDetailPage,
  ProjectsPage,
  ProjectsPageIndex,
  UserProjectsPage,
} from '../project';
import { ReduxIntlProviders, renderWithRouter } from '../../utils/testWithIntl';
import { projects } from '../../network/tests/mockData/projects';

test('More Filters should close the more filters container when clicked outside the container', async () => {
  const navigateMock = jest.fn();
  renderWithRouter(
    <QueryParamProvider adapter={ReachAdapter}>
      <ReduxIntlProviders>
        <MoreFilters navigate={navigateMock} />
      </ReduxIntlProviders>
    </QueryParamProvider>,
  );
  expect(
    screen.getByRole('link', {
      name: /apply/i,
    }),
  ).toBeInTheDocument();

  await userEvent.click(screen.getAllByRole('button')[2]);
  expect(navigateMock).toHaveBeenCalled();
});

test('CreateProject renders ProjectCreate', async () => {
  renderWithRouter(
    <QueryParamProvider adapter={ReachAdapter}>
      <ReduxIntlProviders>
        <CreateProject />
      </ReduxIntlProviders>
    </QueryParamProvider>,
  );
  expect(screen.getByText('Loading...')).toBeInTheDocument();
});

describe('UserProjectsPage Component', () => {
  it('should redirect to login page if no user token is present', async () => {
    const navigateMock = jest.fn();
    act(() => {
      store.dispatch({ type: 'SET_TOKEN', token: null });
    });

    renderWithRouter(
      <QueryParamProvider adapter={ReachAdapter}>
        <ReduxIntlProviders>
          <UserProjectsPage navigate={navigateMock} management={false} />
        </ReduxIntlProviders>
      </QueryParamProvider>,
    );

    await waitFor(() => expect(navigateMock).toHaveBeenCalled());
  });

  it('should display component details', async () => {
    act(() => {
      store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
    });

    renderWithRouter(
      <QueryParamProvider adapter={ReachAdapter}>
        <ReduxIntlProviders>
          <UserProjectsPage management={false} location={{ pathname: '/manage' }} />
        </ReduxIntlProviders>
      </QueryParamProvider>,
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
      <QueryParamProvider adapter={ReachAdapter}>
        <ReduxIntlProviders>
          <UserProjectsPage management={false} />
        </ReduxIntlProviders>
      </QueryParamProvider>,
    );
    await screen.findByRole('heading', { name: projects.results[0].name });
    // Since WebGL is not supported by Node, we'll assume that the map context will be loaded
    expect(screen.getByRole('heading', { name: 'WebGL Context Not Found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'WebGL is enabled' })).toBeInTheDocument();
  });
});

test('More Filters should close the more filters container when clicked outside the container', async () => {
  const navigateMock = jest.fn();
  renderWithRouter(
    <QueryParamProvider adapter={ReachAdapter}>
      <ReduxIntlProviders>
        <MoreFilters navigate={navigateMock} />
      </ReduxIntlProviders>
    </QueryParamProvider>,
  );
  expect(
    screen.getByRole('link', {
      name: /apply/i,
    }),
  ).toBeInTheDocument();

  await userEvent.click(screen.getAllByRole('button')[2]);
  expect(navigateMock).toHaveBeenCalledWith('/explore?managedByMe=1');
});

describe('ManageProjectsPage', () => {
  it('should display correct details for manage projects', async () => {
    act(() => {
      store.dispatch({ type: 'SET_USER_DETAILS', userDetails: { id: 1, role: 'ADMIN' } });
      store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
    });

    render(
      <QueryParamProvider adapter={ReachAdapter}>
        <ReduxIntlProviders>
          <ManageProjectsPage />
        </ReduxIntlProviders>
      </QueryParamProvider>,
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
    render(
      <QueryParamProvider adapter={ReachAdapter}>
        <ReduxIntlProviders>
          <ManageProjectsPage />
        </ReduxIntlProviders>
      </QueryParamProvider>,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole('checkbox'));
    // Since WebGL is not supported by Node, we'll assume that the map context will be loaded
    expect(screen.getByRole('heading', { name: 'WebGL Context Not Found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'WebGL is enabled' })).toBeInTheDocument();
  });
});

test('ProjectsPageIndex is a null DOM element', () => {
  const { container } = render(<ProjectsPageIndex />);
  expect(container).toBeEmptyDOMElement();
});

describe('Projects Page', () => {
  const setup = () => {
    renderWithRouter(
      <QueryParamProvider adapter={ReachAdapter}>
        <ReduxIntlProviders>
          <ProjectsPage location={globalHistory.location} />
        </ReduxIntlProviders>
      </QueryParamProvider>,
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

  it('should render component details', async () => {
    act(() => {
      store.dispatch({ type: 'SET_LOCALE', locale: 'es-AR' });
    });
    render(
      <ReduxIntlProviders>
        <ProjectDetailPage id={123} navigate={() => jest.fn()} />
      </ReduxIntlProviders>,
    );
    await waitFor(() => {
      expect(screen.getByText(/sample project/i)).toBeInTheDocument();
      expect(screen.getByText(/hello world/i)).toBeInTheDocument();
    });
  });

  it('should display private project error message', async () => {
    setupFaultyHandlers();
    render(
      <ReduxIntlProviders>
        <ProjectDetailPage id={123} navigate={() => jest.fn()} />
      </ReduxIntlProviders>,
    );
    await waitFor(() =>
      expect(
        screen.getByText("You don't have permission to access this project"),
      ).toBeInTheDocument(),
    );
  });

  it('should display generic error message', async () => {
    setupFaultyHandlers();
    render(
      <ReduxIntlProviders>
        <ProjectDetailPage id={123} navigate={() => jest.fn()} />
      </ReduxIntlProviders>,
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
