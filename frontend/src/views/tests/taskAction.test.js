import '@testing-library/jest-dom';
import { screen, act, waitFor } from '@testing-library/react';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';
import { QueryParamProvider } from 'use-query-params';
import userEvent from '@testing-library/user-event';

import { MapTask, TaskAction } from '../taskAction';
import {
  createComponentWithMemoryRouter,
  ReduxIntlProviders,
  renderWithRouter,
} from '../../utils/testWithIntl';
import { store } from '../../store';

describe('Mapping Task Action Page', () => {
  const setup = () => {
    const { router } = createComponentWithMemoryRouter(
      <QueryParamProvider adapter={ReactRouter6Adapter}>
        <ReduxIntlProviders>
          <MapTask />
        </ReduxIntlProviders>
      </QueryParamProvider>,
      {
        route: '/projects/:id/map/',
        entryRoute: '/projects/123/map/',
      },
    );

    return { router };
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

    const { router } = setup();
    await waitFor(() => {
      expect(
        screen.getByRole('button', {
          name: /submit task/i,
        }),
      ).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole('button', { name: /select another task/i }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/projects/123/tasks/'));
  });

  it('should suggest the user to update status of previously locked task', async () => {
    // Not using the setup function here to have different result for project detail
    renderWithRouter(
      <QueryParamProvider adapter={ReactRouter6Adapter}>
        <ReduxIntlProviders>
          <TaskAction project={555} action="MAPPING" />
        </ReduxIntlProviders>
      </QueryParamProvider>,
    );

    await waitFor(() =>
      expect(screen.getByRole('heading')).toHaveTextContent(
        'We found another mapping task already locked by you',
      ),
    );
  });

  it('should submit task mapping status (YES option) and direct to tasks selection page', async () => {
    const { router } = setup();
    const submitBtn = await screen.findByRole('button', {
      name: /submit task/i,
    });
    expect(submitBtn).toBeDisabled();
    const user = userEvent.setup();
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
    const { router } = setup();
    const submitBtn = await screen.findByRole('button', {
      name: /submit task/i,
    });
    expect(submitBtn).toBeDisabled();
    const user = userEvent.setup();
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

    const { router } = setup();
    const submitBtn = await screen.findByRole('button', {
      name: /submit task/i,
    });
    expect(submitBtn).toBeDisabled();
    const user = userEvent.setup();
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

    const { router } = setup();
    const submitBtn = await screen.findByRole('button', {
      name: /submit task/i,
    });
    expect(submitBtn).toBeDisabled();
    const user = userEvent.setup();
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
    const { router } = setup();
    await screen.findByRole('button', {
      name: /submit task/i,
    });
    await userEvent.click(
      screen.getByRole('button', {
        name: /split task/i,
      }),
    );
    await waitFor(() => expect(router.state.location.pathname).toBe('/projects/123/tasks/'));
  });
});
