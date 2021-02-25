import { useState, useEffect } from 'react';
import { subWeeks, subMonths, format, endOfToday } from 'date-fns';

export const useDateRangeQueryParams = (period, startDate, endDate) => {
  const [queryParam, setQueryParam] = useState(null);

  useEffect(() => {
    let startDateValue = startDate;
    if (period === 'month') startDateValue = format(subMonths(endOfToday(), 1), 'yyyy-MM-dd');
    if (period === 'week') startDateValue = format(subWeeks(endOfToday(), 1), 'yyyy-MM-dd');
    setQueryParam(
      `startDate=${startDateValue}${endDate && period === 'custom' ? `&endDate=${endDate}` : ''}`,
    );
  }, [startDate, period, endDate]);

  return queryParam;
};
