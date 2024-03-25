import { renderHook } from '@testing-library/react';
import { parse } from 'date-fns';

import { usePredictYearlyTasks } from '../UsePredictYearlyTasks';

describe('usePredictYearlyTasks', () => {
  it('in the 60th day of a leap year', () => {
    const { result } = renderHook(() =>
      usePredictYearlyTasks(100, parse('2020-02-29', 'yyyy-MM-dd', new Date())),
    );
    expect(result.current).toBe(610);
  });
  it('in the 60th day of a non leap year', () => {
    const { result } = renderHook(() =>
      usePredictYearlyTasks(1000, parse('2021-03-01', 'yyyy-MM-dd', new Date())),
    );
    expect(result.current).toBe(6083);
  });
  it('in the 60th day of a non leap year', () => {
    const { result } = renderHook(() =>
      usePredictYearlyTasks(10, parse('2021-01-01', 'yyyy-MM-dd', new Date())),
    );
    expect(result.current).toBe(3650);
  });
  it('with null completedActions returns 0', () => {
    const { result } = renderHook(() =>
      usePredictYearlyTasks(null, parse('2021-01-01', 'yyyy-MM-dd', new Date())),
    );
    expect(result.current).toBe(0);
  });
});
