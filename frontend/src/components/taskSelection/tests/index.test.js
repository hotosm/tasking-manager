import '@testing-library/jest-dom';
import { screen, act, waitFor } from '@testing-library/react';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';
import { QueryParamProvider } from 'use-query-params';
import userEvent from '@testing-library/user-event';

import { TaskSelection } from '..';
import { getProjectSummary } from '../../../network/tests/mockData/projects';
import { ReduxIntlProviders, renderWithRouter } from '../../../utils/testWithIntl';
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

    renderWithRouter(
      <QueryParamProvider adapter={ReactRouter6Adapter}>
        <ReduxIntlProviders>
          <TaskSelection project={getProjectSummary(123)} />
        </ReduxIntlProviders>
      </QueryParamProvider>,
    );

    await waitFor(() =>
      expect(screen.getByText(/Project Specific Mapping Notes/i)).toBeInTheDocument(),
    );
    await userEvent.click(
      screen.getByRole('button', {
        name: /contributions/i,
      }),
    );
    await userEvent.click(
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
    renderWithRouter(
      <QueryParamProvider adapter={ReactRouter6Adapter}>
        <ReduxIntlProviders>
          <TaskSelection project={getProjectSummary(123)} />
        </ReduxIntlProviders>
      </QueryParamProvider>,
    );

    await waitFor(() =>
      expect(screen.getByText(/Project Specific Mapping Notes/i)).toBeInTheDocument(),
    );
    await userEvent.click(
      await screen.findByRole('button', {
        name: /contributions/i,
      }),
    );
    await userEvent.click(
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
    renderWithRouter(
      <QueryParamProvider adapter={ReactRouter6Adapter}>
        <ReduxIntlProviders>
          <TaskSelection project={getProjectSummary(123)} />
        </ReduxIntlProviders>
      </QueryParamProvider>,
    );

    await waitFor(() =>
      expect(screen.getByText(/Project Specific Mapping Notes/i)).toBeInTheDocument(),
    );
    await userEvent.click(
      await screen.findByRole('button', {
        name: /tasks/i,
      }),
    );

    await userEvent.click(
      screen.getByRole('button', {
        name: /Most recently updated/i,
      }),
    );
    await userEvent.click(await screen.findByText(/sort by task number/i));
    const firstTask = screen.getByRole('button', {
      name: /Task #1 Patrik_B/i,
    });
    const secondTask = screen.getByRole('button', {
      name: /Task #2 helnershingthapa/i,
    });
    expect(firstTask.compareDocumentPosition(secondTask)).toBe(4);
  });

  it('should clear text when close icon is clicked', async () => {
    renderWithRouter(
      <QueryParamProvider adapter={ReactRouter6Adapter}>
        <ReduxIntlProviders>
          <TaskSelection project={getProjectSummary(123)} />
        </ReduxIntlProviders>
      </QueryParamProvider>,
    );

    await waitFor(() =>
      expect(screen.getByText(/Project Specific Mapping Notes/i)).toBeInTheDocument(),
    );
    await userEvent.click(
      await screen.findByRole('button', {
        name: /tasks/i,
      }),
    );
    const userQueryText = screen.getByRole('textbox');
    await userEvent.type(userQueryText, 'hello');
    expect(userQueryText).toHaveValue('hello');
    await userEvent.click(
      screen.getByRole('button', {
        name: /clear/i,
      }),
    );
    expect(userQueryText).toHaveValue('');
  });
});
