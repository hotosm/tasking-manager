import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { IntlProviders, createComponentWithMemoryRouter } from '../../../utils/testWithIntl';
import { NotificationOrderBySelector } from '../notificationOrderBy';

describe('Notification Order By', () => {
  it('should display the sort by button when no query param is available', () => {
    render(
      <IntlProviders>
        <NotificationOrderBySelector allQueryParams={{}} />
      </IntlProviders>,
    );
    expect(
      screen.getByRole('button', {
        name: /sort by/i,
      }),
    ).toBeInTheDocument();
  });

  it('should display the sort by button when no query param is available', async () => {
    const setQueryMock = jest.fn();
    createComponentWithMemoryRouter(
      <IntlProviders>
        <NotificationOrderBySelector allQueryParams={{}} setQuery={setQueryMock} />
      </IntlProviders>,
    );
    const user = userEvent.setup();
    await user.click(
      screen.getByRole('button', {
        name: /sort by/i,
      }),
    );
    await user.click(screen.getByText(/new notifications first/i));
    expect(setQueryMock).toHaveBeenCalledTimes(1);
    expect(setQueryMock).toHaveBeenCalledWith(
      { orderBy: 'DESC', orderByType: 'date', page: undefined },
      'pushIn',
    );
  });
});
