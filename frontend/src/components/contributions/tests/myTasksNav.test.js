import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';
import { QueryParamProvider } from 'use-query-params';

import { MyTasksNav, isActiveButton } from '../myTasksNav';
import { ReduxIntlProviders, renderWithRouter } from '../../../utils/testWithIntl';

describe('MyTasksNav Component', () => {
  it('should display details', async () => {
    renderWithRouter(
      <QueryParamProvider adapter={ReactRouter6Adapter}>
        <ReduxIntlProviders>
          <MyTasksNav />
        </ReduxIntlProviders>
      </QueryParamProvider>,
    );
    expect(
      screen.getByRole('heading', {
        name: /my tasks/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /sort by/i,
      }),
    ).toBeInTheDocument();
    ['All', 'Mapped', 'Validated', 'More mapping needed', 'Archived projects'].forEach((menuItem) =>
      expect(
        screen.getByRole('link', {
          name: menuItem,
        }),
      ).toBeInTheDocument(),
    );
  });

  // The onChange event for the react-select executes, which
  // updates the query params, but the component doesn't rerender
  // with the updated values in the test, which would have caused
  // the 'Clear filters' button to appear. Uncomment to try

  // it('should display clear filters button when some filter is applied', async () => {
  //   // The onChange event for the react-select executes, which
  //   // updates the query params, but the component doesn't rerender
  //   // with the updated values in the test, which would have caused
  //   // the 'Clear filters' button to appear. Uncomment to try
  //   renderWithRouter(
  //     <QueryParamProvider adapter={ReactRouter6Adapter}>
  //       <ReduxIntlProviders>
  //         <MyTasksNav />
  //       </ReduxIntlProviders>
  //     </QueryParamProvider>,
  //   );

  //   await selectEvent.select(screen.getByRole('combobox'), '#8629');
  //   await waitFor(() => expect(screen.getByText('Clear filters')).toBeInTheDocument());
  // });
});

describe('isActiveButton', () => {
  const defaultQuery = {
    status: undefined,
    minDate: undefined,
    maxDate: undefined,
    projectStatus: undefined,
    page: undefined,
    orderBy: undefined,
    projectId: undefined,
  };
  const isActiveValue = 'bg-blue-grey white fw5';
  const isNotActiveValue = 'bg-white blue-grey';

  it('should display button as active ', () => {
    expect(isActiveButton('All', defaultQuery)).toBe(isActiveValue);
    expect(isActiveButton('MAPPED', { ...defaultQuery, status: ['MAPPED'] })).toBe(isActiveValue);
    expect(isActiveButton('VALIDATED', { ...defaultQuery, status: ['VALIDATED'] })).toBe(
      isActiveValue,
    );
    expect(isActiveButton('ARCHIVED', { ...defaultQuery, projectStatus: 'ARCHIVED' })).toBe(
      isActiveValue,
    );
  });

  it('should display button as inactive', () => {
    expect(isActiveButton('All', { ...defaultQuery, projectStatus: 'ARCHIVED' })).toBe(
      isNotActiveValue,
    );
    expect(isActiveButton('MAPPED', { ...defaultQuery, projectStatus: 'ARCHIVED' })).toBe(
      isNotActiveValue,
    );
    expect(isActiveButton('MAPPED', { ...defaultQuery, projectStatus: 'VALIDATED' })).toBe(
      isNotActiveValue,
    );
  });
});
