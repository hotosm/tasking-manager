import '@testing-library/jest-dom';
import { screen, act, waitFor } from '@testing-library/react';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';
import { QueryParamProvider } from 'use-query-params';

import { TaskSelection } from '..';
import { getProjectSummary } from '../../../network/tests/mockData/projects';
import {
  QueryClientProviders,
  ReduxIntlProviders,
  renderWithRouter,
} from '../../../utils/testWithIntl';
import { store } from '../../../store';

describe('Contributions', () => {
  it('should select tasks mapped by the selected user', async () => {
    act(() => {
      store.dispatch({ type: 'SET_TOKEN', token: null });
      store.dispatch({ type: 'SET_LOCALE', locale: 'en-US' });
      store.dispatch({
        type: 'SET_USER_DETAILS',
        userDetails: { id: 420, username: 'somebodyWhoHasntContributed', isExpert: true },
      });
    });

    const { user } = renderWithRouter(
      <QueryClientProviders>
        <QueryParamProvider adapter={ReactRouter6Adapter}>
          <ReduxIntlProviders>
            <TaskSelection project={getProjectSummary(123)} />
          </ReduxIntlProviders>
        </QueryParamProvider>
      </QueryClientProviders>,
    );

    await waitFor(() =>
      expect(screen.getByText(/Project Specific Mapping Notes/i)).toBeInTheDocument(),
    );
    await user.click(
      screen.getByRole('button', {
        name: /contributions/i,
      }),
    );
    await user.click(
      await screen.findByRole('button', {
        name: 'Select tasks mapped by user_3',
      }),
    );
    expect(
      screen.getByRole('button', {
        name: /Task #2 helnershingthapa/i,
      }).parentElement,
    ).toHaveClass('ba b--blue-dark bw1');
  });

  it('should select tasks validated by the selected user', async () => {
    const { user } = renderWithRouter(
      <QueryClientProviders>
        <QueryParamProvider adapter={ReactRouter6Adapter}>
          <ReduxIntlProviders>
            <TaskSelection project={getProjectSummary(123)} />
          </ReduxIntlProviders>
        </QueryParamProvider>
      </QueryClientProviders>,
    );

    await waitFor(() =>
      expect(screen.getByText(/Project Specific Mapping Notes/i)).toBeInTheDocument(),
    );
    await user.click(
      await screen.findByRole('button', {
        name: /contributions/i,
      }),
    );
    await user.click(
      await screen.findByRole('button', {
        name: 'Select tasks validated by user_3',
      }),
    );
    expect(
      screen.getByRole('button', {
        name: /Task #6 Patrik_B/i,
      }).parentElement,
    ).toHaveClass('ba b--blue-dark bw1');
  });

  it('should sort tasks by their task number', async () => {
    const { user } = renderWithRouter(
      <QueryClientProviders>
        <QueryParamProvider adapter={ReactRouter6Adapter}>
          <ReduxIntlProviders>
            <TaskSelection project={getProjectSummary(123)} />
          </ReduxIntlProviders>
        </QueryParamProvider>
      </QueryClientProviders>,
    );

    await waitFor(() =>
      expect(screen.getByText(/Project Specific Mapping Notes/i)).toBeInTheDocument(),
    );
    await user.click(
      await screen.findByRole('button', {
        name: /tasks/i,
      }),
    );

    await user.click(
      screen.getByRole('button', {
        name: /Most recently updated/i,
      }),
    );
    await user.click(await screen.findByText(/sort by task number/i));
    const firstTask = screen.getByRole('button', {
      name: /Task #1 Patrik_B/i,
    });
    const secondTask = screen.getByRole('button', {
      name: /Task #2 helnershingthapa/i,
    });
    expect(firstTask.compareDocumentPosition(secondTask)).toBe(4);
  });

  it('should clear text when close icon is clicked', async () => {
    const { user } = renderWithRouter(
      <QueryClientProviders>
        <QueryParamProvider adapter={ReactRouter6Adapter}>
          <ReduxIntlProviders>
            <TaskSelection project={getProjectSummary(123)} />
          </ReduxIntlProviders>
        </QueryParamProvider>
      </QueryClientProviders>,
    );

    await waitFor(() =>
      expect(screen.getByText(/Project Specific Mapping Notes/i)).toBeInTheDocument(),
    );
    await user.click(
      await screen.findByRole('button', {
        name: /tasks/i,
      }),
    );
    const userQueryText = screen.getByRole('textbox');
    await user.type(userQueryText, 'hello');
    expect(userQueryText).toHaveValue('hello');
    await user.click(
      screen.getByRole('button', {
        name: /clear/i,
      }),
    );
    expect(userQueryText).toHaveValue('');
  });
});
