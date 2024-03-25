import '@testing-library/jest-dom';
import queryString from 'query-string';
import { act, render, screen, waitFor } from '@testing-library/react';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';

import { BooleanParam, decodeQueryParams, QueryParamProvider } from 'use-query-params';

import { store } from '../../../store';
import {
  createComponentWithMemoryRouter,
  ReduxIntlProviders,
  renderWithRouter,
} from '../../../utils/testWithIntl';
import { MoreFiltersForm } from '../moreFiltersForm';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

describe('MoreFiltersForm', () => {
  it('should not display toggle to filter by user interests if not logged in', async () => {
    act(() => {
      store.dispatch({ type: 'SET_TOKEN', token: null });
    });
    const { user, container } = renderWithRouter(
      <ReduxIntlProviders>
        <QueryParamProvider adapter={ReactRouter6Adapter}>
          <MoreFiltersForm currentUrl="/current-url" />
        </QueryParamProvider>
      </ReduxIntlProviders>,
    );
    await user.click(container.querySelector('#organisation > div > div'));
    await screen.findByText('American Red Cross');
    expect(screen.queryByLabelText('filter by user interests')).not.toBeInTheDocument();
  });

  it('should toggle filter by user interests', async () => {
    act(() => {
      store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
    });
    const { user, router } = createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <QueryParamProvider adapter={ReactRouter6Adapter}>
          <MoreFiltersForm currentUrl="/current-url" />
        </QueryParamProvider>
      </ReduxIntlProviders>,
    );
    const switchControl = screen.getAllByRole('checkbox').slice(-1)[0];

    expect(switchControl).toBeInTheDocument();
    await user.click(switchControl);
    await waitFor(() =>
      expect(
        decodeQueryParams(
          {
            basedOnMyInterests: BooleanParam,
          },
          queryString.parse(router.state.location.search),
        ),
      ).toEqual({ basedOnMyInterests: true }),
    );
  });

  it('should clear toggle by user interests filter', async () => {
    render(
      <MemoryRouter initialEntries={['/something?basedOnMyInterests=1']}>
        <Routes>
          <Route
            path="something"
            element={
              <ReduxIntlProviders>
                <QueryParamProvider adapter={ReactRouter6Adapter}>
                  <MoreFiltersForm currentUrl="/current-url" />
                </QueryParamProvider>
              </ReduxIntlProviders>
            }
          />
        </Routes>
      </MemoryRouter>,
    );
    const switchControl = screen.getAllByRole('checkbox').slice(-1)[0];
    expect(switchControl).toBeChecked();
  });
});
