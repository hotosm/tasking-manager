import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { parse } from 'query-string';
import { act, render, screen, waitFor } from '@testing-library/react';
import { ReachAdapter } from 'use-query-params/adapters/reach';
import { BooleanParam, decodeQueryParams, QueryParamProvider } from 'use-query-params';

import { store } from '../../../store';
import { ReduxIntlProviders, renderWithRouter } from '../../../utils/testWithIntl';
import { MoreFiltersForm } from '../moreFiltersForm';

describe('MoreFiltersForm', () => {
  const setup = async () => {
    render(
      <ReduxIntlProviders>
        <QueryParamProvider adapter={ReachAdapter}>
          <MoreFiltersForm currentUrl="/current-url" />
        </QueryParamProvider>
      </ReduxIntlProviders>,
    );
    await screen.findByTitle('American Red Cross');
  };

  it('should not display toggle to filter by user interests if not logged in', async () => {
    act(() => {
      store.dispatch({ type: 'SET_TOKEN', token: null });
    });
    setup();
    expect(screen.queryByLabelText('filter by user interests')).not.toBeInTheDocument();
  });

  it('should toggle filter by user interests', async () => {
    act(() => {
      store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
    });
    const { history } = renderWithRouter(
      <ReduxIntlProviders>
        <QueryParamProvider adapter={ReachAdapter}>
          <MoreFiltersForm currentUrl="/current-url" />
        </QueryParamProvider>
      </ReduxIntlProviders>,
    );
    const switchControl = screen.getAllByRole('checkbox').slice(-1)[0] ;

    expect(switchControl).toBeInTheDocument();
    await userEvent.click(switchControl);
    waitFor(() =>
      expect(
        decodeQueryParams(
          {
            basedOnMyInterests: BooleanParam,
          },
          parse(history.location.search),
        ),
      ).toEqual({ basedOnMyInterests: 1 }),
    );
  });

  it('should clear toggle by user interests filter', async () => {
    const { history } = renderWithRouter(
      <ReduxIntlProviders>
        <QueryParamProvider adapter={ReachAdapter}>
          <MoreFiltersForm currentUrl="/current-url" />
        </QueryParamProvider>
      </ReduxIntlProviders>,
      {
        route: '?basedOnMyInterests=1',
      },
    );
    const switchControl = screen.getAllByRole('checkbox').slice(-1)[0];

    expect(switchControl).toBeChecked();
    await userEvent.click(switchControl);
    waitFor(() =>
      expect(
        decodeQueryParams(
          {
            basedOnMyInterests: BooleanParam,
          },
          parse(history.location.search),
        ),
      ).toEqual({ basedOnMyInterests: undefined }),
    );
  });
});
