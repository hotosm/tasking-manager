import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { globalHistory } from '@reach/router';
import { ReachAdapter } from 'use-query-params/adapters/reach';
import { QueryParamProvider } from 'use-query-params';
import { decodeQueryParams, StringParam } from 'serialize-query-params';

import { ReduxIntlProviders, renderWithRouter } from '../../../utils/testWithIntl';
import { ProjectNav } from '../projectNav';
import messages from '../messages';
import { parse } from 'query-string';

describe('Project Navigation Bar', () => {
  it('should render component details', () => {
    render(
      <QueryParamProvider adapter={ReachAdapter}>
        <ReduxIntlProviders>
          <ProjectNav location={globalHistory.location} />
        </ReduxIntlProviders>
      </QueryParamProvider>,
    );

    expect(
      screen.getByRole('button', {
        name: messages.mappingDifficulty.defaultMessage,
      }),
    ).toBeInTheDocument();
  });

  it('should display the clear filters button', async () => {
    const { history } = renderWithRouter(
      <QueryParamProvider adapter={ReachAdapter}>
        <ReduxIntlProviders>
          <ProjectNav location={globalHistory.location} />
        </ReduxIntlProviders>
      </QueryParamProvider>,
      { route: '?text=something' },
    );

    expect(decodeQueryParams({ text: StringParam }, parse(history.location.search))).toEqual({
      text: 'something',
    });
  });
});
