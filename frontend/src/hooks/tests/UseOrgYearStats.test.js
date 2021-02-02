import { renderHook } from '@testing-library/react-hooks';
import { startOfYear, format, add, sub } from 'date-fns';

import { useIsOrgYearQuery } from '../UseOrgYearStats';

describe('useOrgYearStats returns', () => {
  const firstDayOfCurrentYear = format(startOfYear(new Date()), 'yyyy-MM-dd');
  const today = format(new Date(), 'yyyy-MM-dd');
  const tomorrow = format(add(new Date(), { days: 1 }), 'yyyy-MM-dd');
  const yesterday = format(sub(new Date(), { days: 1 }), 'yyyy-MM-dd');
  it('TRUE if startDate is the first day of the year', () => {
    const { result } = renderHook(() =>
      useIsOrgYearQuery({ startDate: firstDayOfCurrentYear, endDate: undefined }),
    );
    expect(result.current).toBe(true);
  });
  it('FALSE if startDate is not the first day of current year', () => {
    const { result } = renderHook(() =>
      useIsOrgYearQuery({ startDate: '2021-01-02', endDate: undefined }),
    );
    expect(result.current).toBe(false);
  });
  it('TRUE if endDate is today', () => {
    const { result } = renderHook(() =>
      useIsOrgYearQuery({ startDate: firstDayOfCurrentYear, endDate: today }),
    );
    expect(result.current).toBe(true);
  });
  it('TRUE if endDate is tomorrow', () => {
    const { result } = renderHook(() =>
      useIsOrgYearQuery({ startDate: firstDayOfCurrentYear, endDate: tomorrow }),
    );
    expect(result.current).toBe(true);
  });
  it('FALSE if endDate is earlier than today', () => {
    const { result } = renderHook(() =>
      useIsOrgYearQuery({ startDate: firstDayOfCurrentYear, endDate: yesterday }),
    );
    expect(result.current).toBe(false);
  });
  it('FALSE if query has campaign value', () => {
    const query = {
      startDate: firstDayOfCurrentYear,
      endDate: undefined,
      campaign: 'Health',
      location: null,
    };
    const { result } = renderHook(() => useIsOrgYearQuery(query));
    expect(result.current).toBe(false);
  });
  it('FALSE if query has location value', () => {
    const query = {
      startDate: firstDayOfCurrentYear,
      endDate: undefined,
      campaign: null,
      location: 'Peru',
    };
    const { result } = renderHook(() => useIsOrgYearQuery(query));
    expect(result.current).toBe(false);
  });
});
