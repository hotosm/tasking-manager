import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { globalHistory } from '@reach/router';
import { QueryParamProvider } from 'use-query-params';
import { act, render, screen } from '@testing-library/react';

import { store } from '../../store';
import { ManageProjectsPage } from '../project';
import { ReduxIntlProviders } from '../../utils/testWithIntl';

describe('ManageProjectsPage', () => {
  it('should display correct details for manage projects', async () => {
    act(() => {
      store.dispatch({ type: 'SET_USER_DETAILS', userDetails: { id: 1, role: 'ADMIN' } });
      store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
    });

    render(
      <QueryParamProvider reachHistory={globalHistory}>
        <ReduxIntlProviders>
          <ManageProjectsPage management />
        </ReduxIntlProviders>
      </QueryParamProvider>,
    );

    expect(
      screen.getByRole('heading', {
        name: /manage projects/i,
      }),
    ).toBeInTheDocument();
  });

  it('should display map when show map switch is toggled', async () => {
    render(
      <QueryParamProvider reachHistory={globalHistory}>
        <ReduxIntlProviders>
          <ManageProjectsPage management />
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
