import { screen } from '@testing-library/react';
import MyTasksOrderDropdown from '../myTasksOrderDropdown';
import { IntlProviders, renderWithRouter } from '../../../utils/testWithIntl';

describe('MyTasksOrderDropdown', () => {
  const setQueryMock = vi.fn();
  const setup = async () => {
    const { user } = renderWithRouter(
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
    await user.click(dropdownBtn);
    return { user };
  };

  it('displays dropdown options after button is clicked', async () => {
    await setup();
    expect(await screen.findByText(/recently edited/i)).toBeInTheDocument();
    expect(await screen.findByText(/project id/i)).toBeInTheDocument();
  });

  it('should set query when an option is selected', async () => {
    const { user } = await setup();
    await user.click(screen.getByText(/recently edited/i));
    expect(setQueryMock).toHaveBeenCalled();
  });

  it('should preselect option if the query matches', async () => {
    renderWithRouter(
      <IntlProviders>
        <MyTasksOrderDropdown
          allQueryParams={{
            orderBy: '-project_id',
          }}
          setQuery={setQueryMock}
        />
      </IntlProviders>,
    );
    expect(await screen.findByText(/project id/i)).toBeInTheDocument();
  });
});
