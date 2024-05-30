import { renderHook } from '@testing-library/react-hooks';
import { format, add } from 'date-fns';

import { useValidateDateRange } from '../UseValidateDateRange';

describe('useValidateDateRange returns', () => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const tomorrow = format(add(new Date(), { days: 1 }), 'yyyy-MM-dd');
  it('badStartDate if startDate is after today', () => {
    const { result } = renderHook(() =>
      useValidateDateRange({ startDate: tomorrow, endDate: undefined }),
    );
    expect(result.current.detail).toBe('badStartDate');
  });
  it('badStartDate if startDate is after endDate', () => {
    const { result } = renderHook(() =>
      useValidateDateRange({ startDate: '2021-01-15', endDate: '2021-01-10' }),
    );
    expect(result.current.detail).toBe('badStartDate');
  });
  it('longDateRange if interval between dates is longer than 1 year', () => {
    const { result } = renderHook(() =>
      useValidateDateRange({ startDate: '2019-01-15', endDate: '2021-01-10' }),
    );
    expect(result.current.detail).toBe('longDateRange');
  });
  it('longDateRange if interval between dates is longer than 1 year', () => {
    const { result } = renderHook(() =>
      useValidateDateRange({ startDate: '2020-01-31', endDate: undefined }),
    );
    expect(result.current.detail).toBe('longDateRange');
  });
  it('no error if startDate is today', () => {
    const { result } = renderHook(() =>
      useValidateDateRange({ startDate: today, endDate: undefined }),
    );
    expect(result.current.error).toBeFalsy();
  });
});
