import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { QueryParamProvider } from 'use-query-params';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';

import { InboxNav } from '../inboxNav';
import { IntlProviders, createComponentWithMemoryRouter } from '../../../utils/testWithIntl';

describe('Inbox Nav', () => {
  it('should display styles for active tab and clear filters button', () => {
    createComponentWithMemoryRouter(
      <QueryParamProvider adapter={ReactRouter6Adapter}>
        <IntlProviders>
          <InboxNav />
        </IntlProviders>
      </QueryParamProvider>,
      {
        route: '/notifications',
        entryRoute: '/notifications?orderBy=date&orderByType=desc&page=1&pageSize=10&types=3,1,6,7',
      },
    );

    // Messages is the active tab being targeted from the entry route types params
    expect(
      screen.getByRole('link', {
        name: /messages/i,
      }),
    ).toHaveClass('bg-blue-light grey-light white');
    expect(
      screen.getByRole('link', {
        name: /projects/i,
      }),
    ).not.toHaveClass('bg-blue-light grey-light white');
    expect(
      screen.getByRole('link', {
        name: /clear filters/i,
      }),
    ).toBeInTheDocument();
  });
});
