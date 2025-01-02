import { useEffect } from 'react';
import { FormattedMessage } from 'react-intl';
import { format, parse } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import { CalendarIcon } from '../svgIcons';
import messages from './messages';

const today = new Date();
const currentYear = today.getFullYear();
const dateFormat = 'yyyy-MM-dd';

const initialState = {
  fromDate: format(new Date(currentYear, 0, 1), dateFormat),
  toDate: format(today, dateFormat),
};

export const DateFilter = ({ isLoading, filters, setFilters }) => {
  // set initial date filter state
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      ...initialState,
    }));
  }, [setFilters]);

  const handleDateSelect = (key, selectedDate) => {
    let { fromDate, toDate } = filters;
    const selectedDateValue = new Date(selectedDate).valueOf();
    const toDateValue = new Date(toDate).valueOf();
    const fromDateValue = new Date(fromDate).valueOf();
    // adjust from and to date based on greater/lesser value
    if (key === 'fromDate' && selectedDateValue > toDateValue) {
      fromDate = toDate;
      toDate = selectedDate;
    } else if (key === 'toDate' && selectedDateValue < fromDateValue) {
      toDate = fromDate;
      fromDate = selectedDate;
    } else if (key === 'toDate') {
      toDate = selectedDate;
    } else {
      fromDate = selectedDate;
    }
    // set filters state
    setFilters((prev) => ({
      ...prev,
      fromDate,
      toDate,
    }));
  };

  if (isLoading) return <></>;

  return (
    <div className="w-100 mt4 flex justify-end">
      <div className="flex flex-column items-end gap-0.5">
        <div className="flex items-center">
          <CalendarIcon className="blue-grey dib w1 pr2 v-mid" />
          <DatePicker
            selected={filters.fromDate ? parse(filters.fromDate, dateFormat, new Date()) : null}
            onChange={(date) => {
              handleDateSelect('fromDate', format(date, dateFormat));
            }}
            dateFormat={dateFormat}
            className="w4 pv2 ph1 ba b--grey-light"
            showYearDropdown
            scrollableYearDropdown
          />

          <span className="ph3">to</span>

          <CalendarIcon className="blue-grey dib w1 pr2 v-mid" />
          <DatePicker
            selected={filters.toDate ? parse(filters.toDate, dateFormat, new Date()) : null}
            onChange={(date) => {
              handleDateSelect('toDate', format(date, dateFormat));
            }}
            dateFormat={dateFormat}
            className="w4 pv2 ph1 ba b--grey-light"
            showYearDropdown
            scrollableYearDropdown
          />
        </div>
        <span className="blue-grey f6">
          <FormattedMessage {...messages.dateFilterSubText} />
        </span>
      </div>
    </div>
  );
};
