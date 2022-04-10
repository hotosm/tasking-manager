import { render, screen, fireEvent } from '@testing-library/react';
import MyTasksOrderDropdown from '../myTasksOrderDropdown';
import '@testing-library/jest-dom';
import { IntlProvider } from 'react-intl';

it('displays dropdown options after button is clicked', () => {
  render(
    <IntlProvider locale="en">
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
      />
    </IntlProvider>,
  );

  const button = screen.getByRole('button');

  expect(button).toBeEnabled();
  fireEvent.click(button);
  expect(screen.getByText(/recently edited/i)).toBeInTheDocument();
  expect(screen.getByText(/project id/i)).toBeInTheDocument();
});
