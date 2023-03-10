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
    });
    renderWithRouter(
      <QueryParamProvider adapter={ReactRouter6Adapter}>
        <ReduxIntlProviders>
          <TaskSelection project={getProjectSummary(123)} />
        </ReduxIntlProviders>
      </QueryParamProvider>,
    );

    await screen.findAllByText(/last updated by/i);

    await userEvent.click(
      screen.getByRole('button', {
        name: /contributions/i,
      }),
    );

    await waitFor(() =>
      expect(
        screen.getByRole('button', {
          name: 'Select tasks mapped by user_3',
        }),
      ).toBeInTheDocument(),
    );
    await userEvent.click(
      screen.getByRole('button', {
        name: 'Select tasks mapped by user_3',
      }),
    );
    expect(
      screen.getByRole('button', {
        name: /Task #2 helnershingthapa, 4 months ago Available for mapping/i,
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

    await screen.findAllByText(/last updated by/i);

    await userEvent.click(
      screen.getByRole('button', {
        name: /contributions/i,
      }),
    );

    await waitFor(() =>
      expect(
        screen.getByRole('button', {
          name: 'Select tasks validated by user_3',
        }),
      ).toBeInTheDocument(),
    );
    await userEvent.click(
      screen.getByRole('button', {
        name: 'Select tasks validated by user_3',
      }),
    );
    expect(
      screen.getByRole('button', {
        name: /Task #6 Patrik_B, 4 months ago Ready for validation/i,
      }).parentElement,
    ).toHaveClass('ba b--blue-dark bw1');
  });
});
