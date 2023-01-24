import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import MyTasksOrderDropdown from '../myTasksOrderDropdown';
import { IntlProviders } from '../../../utils/testWithIntl';

describe('MyTasksOrderDropdown', () => {
  const setQueryMock = jest.fn();
  const setup = async () => {
    render(
      <IntlProviders>
        <MyTasksOrderDropdown
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
      </IntlProviders>,
    );
    const dropdownBtn = screen.getByRole('button', {
      name: /sort by/i,
    });
    await userEvent.click(dropdownBtn);
  };

  it('displays dropdown options after button is clicked', async () => {
    await setup();
    expect(screen.getByText(/recently edited/i)).toBeInTheDocument();
    expect(screen.getByText(/project id/i)).toBeInTheDocument();
  });

  it('should set query when an option is selected', async () => {
    await setup();
    await userEvent.click(screen.getByText(/recently edited/i));
    expect(setQueryMock).toHaveBeenCalled();
  });

  it('should preselect option if the query matches', async () => {
    render(
      <IntlProviders>
        <MyTasksOrderDropdown
          allQueryParams={{
            orderBy: '-project_id',
          }}
        />
      </IntlProviders>,
    );
    expect(screen.getByText(/project id/i)).toBeInTheDocument();
  });
});
