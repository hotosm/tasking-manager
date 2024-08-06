import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { startOfWeek, startOfYear, format } from 'date-fns';

import { createComponentWithReduxAndIntl, IntlProviders } from '../../../utils/testWithIntl';
import { DateFilterPicker, DateRangeFilterSelect } from '../filterSelectFields';

describe('tests for selecting date range filters for not custom date ranges', () => {
  const element = createComponentWithReduxAndIntl(
    <DateRangeFilterSelect
      fieldsetName="dateRange"
      fieldsetStyle="bn dib pv0-ns pv2 ph2-ns ph1 mh0 mb1 w-30-ns w-100"
      isCustomDateRange={false}
    />,
  );
  const instance = element.root;
  it('has the passed classname for fieldset', () => {
    expect(instance.findByType('fieldset').props.className).toEqual(
      'bn dib pv0-ns pv2 ph2-ns ph1 mh0 mb1 w-30-ns w-100',
    );
  });

  it('should render six options if the date is not custom input', () => {
    expect(instance.findByProps({ classNamePrefix: 'react-select' }).props.options.length).toEqual(
      6,
    );
  });

  it("should set the default dropdown value to 'thisYear'", () => {
    expect(instance.findByProps({ classNamePrefix: 'react-select' }).props.value[0].value).toEqual(
      'thisYear',
    );
  });
});

describe('DateRangeFilterSelect', () => {
  it('should set query when an option is selected', async () => {
    const user = userEvent.setup();
    render(
      <IntlProviders>
        <DateRangeFilterSelect
          setQueryForChild={jest.fn()}
          setIsCustomDateRange={jest.fn()}
          startDateInQuery={format(startOfYear(Date.now()), 'yyyy-MM-dd')}
        />
      </IntlProviders>,
    );
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText(/this week/i));
    expect(screen.getByText('This week')).toBeInTheDocument();
  });

  it('should set default range by dates in query', async () => {
    render(
      <IntlProviders>
        <DateRangeFilterSelect
          setQueryForChild={jest.fn()}
          setIsCustomDateRange={jest.fn()}
          startDateInQuery={format(startOfWeek(new Date()), 'yyyy-MM-dd')}
          endDateInQuery={format(new Date(), 'yyyy-MM-dd')}
        />
      </IntlProviders>,
    );
    expect(screen.getByText('This week')).toBeInTheDocument();
  });

  it('should set dropdown option to custom range', async () => {
    render(
      <IntlProviders>
        <DateRangeFilterSelect
          setQueryForChild={jest.fn()}
          setIsCustomDateRange={jest.fn()}
          isCustomDateRange
          startDateInQuery={'2022-12-11'}
          endDateInQuery={'2023-11-12'}
        />
      </IntlProviders>,
    );
    expect(screen.getByText(/custom/i)).toBeInTheDocument();
  });
});

test('DateFilterPicker', async () => {
  const setQueryForChildMock = jest.fn();
  const user = userEvent.setup();
  render(
    <IntlProviders>
      <DateFilterPicker
        fieldsetName="startDate"
        setQueryForChild={setQueryForChildMock}
        setIsCustomDateRange={jest.fn()}
      />
    </IntlProviders>,
  );
  const textbox = screen.getByRole('textbox');
  await user.clear(textbox);
  await user.type(textbox, '2022-02-22');
  expect(setQueryForChildMock).toHaveBeenCalled();
});
