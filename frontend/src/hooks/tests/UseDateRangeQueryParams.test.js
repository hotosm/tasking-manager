import { renderHook } from '@testing-library/react';
import { subWeeks, subMonths, format, endOfToday } from 'date-fns';

import { useDateRangeQueryParams } from '../UseDateRangeQueryParams';

describe('test if useDateRangeQueryParams', () => {
  it('return startDate at one week ago for week query', () => {
    const oneWeekAgo = format(subWeeks(endOfToday(), 1), 'yyyy-MM-dd');
    const { result } = renderHook(() => useDateRangeQueryParams('week'));
    expect(result.current).toEqual(`startDate=${oneWeekAgo}`);
  });
  it('return startDate at one month ago for month query', () => {
    const oneMonthAgo = format(subMonths(endOfToday(), 1), 'yyyy-MM-dd');
    const { result } = renderHook(() => useDateRangeQueryParams('month'));
    expect(result.current).toEqual(`startDate=${oneMonthAgo}`);
  });
  it('return a custom query for a custom period', () => {
    const { result } = renderHook(() =>
      useDateRangeQueryParams('custom', '2021-01-01', '2021-02-01'),
    );
    expect(result.current).toEqual(`startDate=2021-01-01&endDate=2021-02-01`);
  });
});
