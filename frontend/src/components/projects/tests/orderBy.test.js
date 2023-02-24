import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { IntlProviders, renderWithRouter } from '../../../utils/testWithIntl';
import { OrderBySelector } from '../orderBy';

test('should select option on click', async () => {
  const setQueryMock = jest.fn();
  renderWithRouter(
    <IntlProviders>
      <OrderBySelector
        allQueryParams={{
          orderBy: undefined,
          orderByType: undefined,
        }}
        setQuery={setQueryMock}
      />
    </IntlProviders>,
  );
  await userEvent.click(
    screen.getByRole('button', {
      name: /sort by/i,
    }),
  );
  await userEvent.click(screen.getByText(/urgent projects/i));
  expect(setQueryMock).toHaveBeenCalledWith(
    expect.objectContaining({
      orderBy: 'priority',
      orderByType: 'ASC',
      page: undefined,
    }),
    'pushIn',
  );
});
