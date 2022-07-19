import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { IntlProvider } from 'react-intl';
import '@testing-library/jest-dom';

import MyProjectsDropdown from '../myProjectsDropdown';
import { store } from '../../../store';

it('displays placeholder and typed text on type', () => {
  render(
    <Provider store={store}>
      <IntlProvider locale="en">
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
        />
      </IntlProvider>
    </Provider>,
  );

  expect(screen.getByText(/Search by project id/i)).toBeInTheDocument();
  const textfield = screen.getByRole('textbox');

  // add test cases for textfield
  fireEvent.change(textfield, { target: { value: '1234' } });
  expect(textfield.value).toBe('1234');
});
