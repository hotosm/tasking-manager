import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';
import { QueryParamProvider } from 'use-query-params';
import { decodeQueryParams, StringParam } from 'serialize-query-params';

import {
  createComponentWithMemoryRouter,
  ReduxIntlProviders,
  renderWithRouter,
} from '../../../utils/testWithIntl';
import { ProjectNav } from '../projectNav';
import messages from '../messages';
import queryString from 'query-string';

describe('Project Navigation Bar', () => {
  it('should render component details', () => {
    renderWithRouter(
      <QueryParamProvider adapter={ReactRouter6Adapter}>
        <ReduxIntlProviders>
          <ProjectNav />
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
    const { router } = createComponentWithMemoryRouter(
      <QueryParamProvider adapter={ReactRouter6Adapter}>
        <ReduxIntlProviders>
          <ProjectNav />
        </ReduxIntlProviders>
      </QueryParamProvider>,
      { route: '?text=something' },
    );

    expect(
      decodeQueryParams({ text: StringParam }, queryString.parse(router.state.location.search)),
    ).toEqual({
      text: 'something',
    });
  });
});
