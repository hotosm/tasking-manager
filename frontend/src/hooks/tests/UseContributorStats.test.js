import { renderHook } from '@testing-library/react';

import { useContributorStats } from '../UseContributorStats';
import { projectContributions } from '../../network/tests/mockData/contributions';

describe('useContributorStats', () => {
  it('with data return correct stats', () => {
    const { result } = renderHook(() =>
      useContributorStats(projectContributions.userContributions),
    );

    expect(result.current.mappers).toBe(4);
    expect(result.current.validators).toBe(3);
    expect(result.current.usersByLevel.BEGINNER).toBe(2);
    expect(result.current.usersByLevel.INTERMEDIATE).toBe(2);
    expect(result.current.usersByLevel.ADVANCED).toBe(1);
    expect(result.current.usersByLevel.ADVANCED).toBe(1);
    expect(result.current.lessThan1MonthExp).toBe(1);
    expect(result.current.lessThan3MonthExp).toBe(1);
    expect(result.current.lessThan6MonthExp).toBe(1);
    expect(result.current.lessThan12MonthExp).toBe(1);
    expect(result.current.moreThan1YearExp).toBe(1);
  });
  it('without data return 0 values', () => {
    const { result } = renderHook(() => useContributorStats());
    expect(result.current.mappers).toBe(0);
    expect(result.current.validators).toBe(0);
    expect(result.current.usersByLevel.BEGINNER).toBe(undefined);
    expect(result.current.usersByLevel.INTERMEDIATE).toBe(undefined);
    expect(result.current.usersByLevel.ADVANCED).toBe(undefined);
    expect(result.current.usersByLevel.ADVANCED).toBe(undefined);
    expect(result.current.lessThan1MonthExp).toBe(0);
    expect(result.current.lessThan3MonthExp).toBe(0);
    expect(result.current.lessThan6MonthExp).toBe(0);
    expect(result.current.lessThan12MonthExp).toBe(0);
    expect(result.current.moreThan1YearExp).toBe(0);
  });
});
