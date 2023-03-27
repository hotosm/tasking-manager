import { renderHook } from '@testing-library/react';

import { useTaskBbox } from '../UseTaskBbox';
import { tasks } from '../../network/tests/mockData/taskGrid';

describe('test useTaskBbox hook', () => {
  it('returns undefined if an invalid task id is passed', () => {
    const { result } = renderHook(() => useTaskBbox(null, tasks));
    expect(result.current).toBe(undefined);
  });
  it('returns undefined if an invalid task id is passed', () => {
    const { result } = renderHook(() => useTaskBbox(10, tasks));
    expect(result.current).toBe(undefined);
  });
  it('returns correct result for taskId 1', () => {
    const { result } = renderHook(() => useTaskBbox(1, tasks));
    expect(result.current).toEqual([-71.486010446, 1.741832923, -71.48597717, 1.741970313]);
  });
  it('returns correct result for taskId 2', () => {
    const { result } = renderHook(() => useTaskBbox(2, tasks));
    expect(result.current).toEqual([-71.485954761, 1.741550711, -71.485823338, 1.741751328]);
  });
});
