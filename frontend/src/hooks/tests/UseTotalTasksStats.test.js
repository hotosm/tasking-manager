import { renderHook } from '@testing-library/react-hooks';

import { useTotalTasksStats } from '../UseTotalTasksStats';
import { tasksStats } from '../../network/tests/mockData/tasksStats';

describe('computeCompleteness', () => {
  it('returns right numbers when receiving valid stats array', () => {
    const { result } = renderHook(() => useTotalTasksStats(tasksStats.taskStats));
    expect(result.current.mapped).toBe(165);
    expect(result.current.validated).toBe(46);
  });
  it('returns 0 to all values if stats is not provided', () => {
    const { result } = renderHook(() => useTotalTasksStats());
    expect(result.current.mapped).toBe(0);
    expect(result.current.validated).toBe(0);
  });
  it('returns 0 to all values if stats is an empty array', () => {
    const { result } = renderHook(() => useTotalTasksStats([]));
    expect(result.current.mapped).toBe(0);
    expect(result.current.validated).toBe(0);
  });
});
