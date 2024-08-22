import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import selectEvent from 'react-select-event';

import MyProjectsDropdown from '../myProjectsDropdown';
import { ReduxIntlProviders } from '../../../utils/testWithIntl';

it('displays placeholder and typed text on type', async () => {
  const setQueryMock = jest.fn();
  render(
    <ReduxIntlProviders>
      <MyProjectsDropdown
        allQueryParams={{
          maxDate: undefined,
          minDate: undefined,
          orderBy: undefined,
          page: undefined,
          projectStatus: undefined,
          status: undefined,
          text: undefined,
        }}
        setQuery={setQueryMock}
      />
    </ReduxIntlProviders>,
  );

  await selectEvent.select(screen.getByRole('combobox'), '#8629');
  expect(setQueryMock).toHaveBeenCalled();
});
