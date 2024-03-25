import '@testing-library/jest-dom';
import { screen, act, waitFor } from '@testing-library/react';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';
import { QueryParamProvider } from 'use-query-params';

import { MapTask, TaskAction, ValidateTask } from '../taskAction';
import {
  createComponentWithMemoryRouter,
  QueryClientProviders,
  ReduxIntlProviders,
  renderWithRouter,
} from '../../utils/testWithIntl';
import { store } from '../../store';

describe('Submitting Mapping Status for a Task', () => {
  const setup = () => {
    const { user, router } = createComponentWithMemoryRouter(
      <QueryClientProviders>
        <QueryParamProvider adapter={ReactRouter6Adapter}>
          <ReduxIntlProviders>
            <MapTask />
          </ReduxIntlProviders>
        </QueryParamProvider>
      </QueryClientProviders>,
      {
        route: '/projects/:id/map/',
        entryRoute: '/projects/123/map/',
      },
    );

    return { user, router };
  };

  it('should stop mapping and direct to tasks selection page', async () => {
    act(() => {
      store.dispatch({ type: 'SET_LOCALE', locale: 'en-US' });
      store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
      store.dispatch({
        type: 'SET_USER_DETAILS',
        userDetails: { id: 123 },
      });
    });

    const { user, router } = setup();
    expect(
      await screen.findByRole('button', {
        name: /submit task/i,
      }),
    ).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: /select another task/i }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/projects/123/tasks/'));
  });

  it('should suggest the user to update status of previously locked task', async () => {
    // Not using the setup function here to have different result for project detail
    renderWithRouter(
      <QueryClientProviders>
        <QueryParamProvider adapter={ReactRouter6Adapter}>
          <ReduxIntlProviders>
            <TaskAction project={555} action="MAPPING" />
          </ReduxIntlProviders>
        </QueryParamProvider>
      </QueryClientProviders>,
    );

    await waitFor(() =>
      expect(screen.getByRole('heading')).toHaveTextContent(
        'We found another mapping task already locked by you',
      ),
    );
  });

  it('should submit task mapping status (YES option) and direct to tasks selection page', async () => {
    const { user, router } = setup();
    const submitBtn = await screen.findByRole('button', {
      name: /submit task/i,
    });
    expect(submitBtn).toBeDisabled();
    await user.click(
      screen.getByRole('radio', {
        name: /yes/i,
      }),
    );
    expect(submitBtn).toBeEnabled();
    await user.click(submitBtn);
    await waitFor(() => expect(router.state.location.pathname).toBe('/projects/123/tasks/'));
  });

  it('should submit task mapping status (NO option) and direct to tasks selection page', async () => {
    const { user, router } = setup();
    const submitBtn = await screen.findByRole('button', {
      name: /submit task/i,
    });
    expect(submitBtn).toBeDisabled();
    await user.click(
      screen.getByRole('radio', {
        name: /no/i,
      }),
    );
    expect(submitBtn).toBeEnabled();
    await user.click(submitBtn);
    await waitFor(() => expect(router.state.location.pathname).toBe('/projects/123/tasks/'));
  });

  it('should submit task mapping status (bad imagery option) and direct to tasks selection page', async () => {
    // The button requires either the user's mapping level to be advanced
    act(() => {
      store.dispatch({
        type: 'SET_USER_DETAILS',
        userDetails: { id: 123, mappingLevel: 'ADVANCED' },
      });
    });

    const { user, router } = setup();
    const submitBtn = await screen.findByRole('button', {
      name: /submit task/i,
    });
    expect(submitBtn).toBeDisabled();
    await user.click(
      screen.getByRole('radio', {
        name: /the imagery is bad/i,
      }),
    );
    expect(submitBtn).toBeEnabled();
    await user.click(submitBtn);
    await waitFor(() => expect(router.state.location.pathname).toBe('/projects/123/tasks/'));
  });

  it('should submit task mapping status (bad imagery option) and direct to tasks selection page', async () => {
    // The button requires either the user's mapping level to be advanced
    act(() => {
      store.dispatch({
        type: 'SET_USER_DETAILS',
        userDetails: { id: 123, mappingLevel: 'ADVANCED' },
      });
    });

    const { user, router } = setup();
    const submitBtn = await screen.findByRole('button', {
      name: /submit task/i,
    });
    expect(submitBtn).toBeDisabled();
    await user.click(
      screen.getByRole('radio', {
        name: /the imagery is bad/i,
      }),
    );
    expect(submitBtn).toBeEnabled();
    await user.click(submitBtn);
    await waitFor(() => expect(router.state.location.pathname).toBe('/projects/123/tasks/'));
  });

  it('should split the task and direct to tasks selection page', async () => {
    const { user, router } = setup();
    await screen.findByRole('button', {
      name: /submit task/i,
    });
    await user.click(
      screen.getByRole('button', {
        name: /split task/i,
      }),
    );
    await waitFor(() => expect(router.state.location.pathname).toBe('/projects/123/tasks/'));
  });

  it('should redirect to login page if the user is not logged in', async () => {
    act(() => {
      store.dispatch({ type: 'SET_TOKEN', token: null });
    });
    const { router } = setup();
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
  });
});

describe('Submitting Validation Status for Tasks', () => {
  const setup = () => {
    const { user, router } = createComponentWithMemoryRouter(
      <QueryClientProviders>
        <QueryParamProvider adapter={ReactRouter6Adapter}>
          <ReduxIntlProviders>
            <ValidateTask />
          </ReduxIntlProviders>
        </QueryParamProvider>
      </QueryClientProviders>,
      {
        route: '/projects/:id/validate/',
        entryRoute: '/projects/123/validate',
      },
    );

    return { user, router };
  };

  it('should stop validation and direct to tasks selection page', async () => {
    act(() => {
      store.dispatch({ type: 'SET_LOCALE', locale: 'en-US' });
      store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
      store.dispatch({
        type: 'SET_USER_DETAILS',
        userDetails: { id: 123 },
      });
    });

    const { user, router } = setup();
    await waitFor(() => {
      expect(
        screen.getByRole('button', {
          name: /submit task/i,
        }),
      ).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /stop validation/i }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/projects/123/tasks/'));
  });

  it('should submit task validation status (YES option) and direct to tasks selection page', async () => {
    const { user, router } = setup();
    const submitBtn = await screen.findByRole('button', {
      name: /submit task/i,
    });
    expect(submitBtn).toBeDisabled();
    await user.click(screen.getAllByRole('radio')[0]);
    expect(submitBtn).toBeEnabled();
    await user.click(submitBtn);
    await waitFor(() => expect(router.state.location.pathname).toBe('/projects/123/tasks/'));
  });

  it('should submit task validation status (NO option) and direct to tasks selection page', async () => {
    const { user, router } = setup();
    const submitBtn = await screen.findByRole('button', {
      name: /submit task/i,
    });
    expect(submitBtn).toBeDisabled();
    await user.click(screen.getAllByRole('radio')[1]);
    expect(submitBtn).toBeEnabled();
    await user.click(submitBtn);
    await waitFor(() => expect(router.state.location.pathname).toBe('/projects/123/tasks/'));
    expect(router.state.location.search).toBe('?filter=MAPPED');
  });
});

describe('Tabs in Task Action Page', () => {
  const setup = async () => {
    const { user, router } = createComponentWithMemoryRouter(
      <QueryClientProviders>
        <QueryParamProvider adapter={ReactRouter6Adapter}>
          <ReduxIntlProviders>
            <ValidateTask />
          </ReduxIntlProviders>
        </QueryParamProvider>
      </QueryClientProviders>,
      {
        route: '/projects/:id/validate/',
        entryRoute: '/projects/123/validate',
      },
    );
    await screen.findByRole('button', { name: /submit task/i });
    return { user, router };
  };

  it('should display project instructions on the instruction tab', async () => {
    const { user } = await setup();
    await user.click(screen.getByRole('button', { name: /instructions/i }));
    expect(screen.getByText(/Project Specific Mapping Notes:/i)).toBeInTheDocument();
  });

  it('should display task history on the history tab', async () => {
    const { user } = await setup();
    await user.click(screen.getByRole('button', { name: /history/i }));
    expect(screen.getByRole('radio', { name: /comments/i })).toBeChecked();
  });

  it('should display resources on the resources tab', async () => {
    const { user } = await setup();
    await user.click(screen.getByRole('button', { name: /resources/i }));
    expect(screen.getByRole('button', { name: 'Download Tasks Grid' })).toBeInTheDocument();
  });
});
