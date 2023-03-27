import { renderHook } from '@testing-library/react';

import { useComputeCompleteness, useTasksByStatus } from '../UseProjectCompletenessCalc';
import tasksGeojson from '../../utils/tests/snippets/tasksGeometry';

describe('computeCompleteness', () => {
  it('returns right numbers when receiving correct tasks geojson', () => {
    const { result } = renderHook(() => useComputeCompleteness(tasksGeojson));
    expect(result.current.percentMapped).toBe(28);
    expect(result.current.percentValidated).toBe(14);
    expect(result.current.percentBadImagery).toBe(12);
  });

  it('returns 0 to all values if tasks geojson is not provided', () => {
    const { result } = renderHook(() => useComputeCompleteness());
    expect(result.current.percentMapped).toBe(0);
    expect(result.current.percentValidated).toBe(0);
    expect(result.current.percentBadImagery).toBe(0);
  });
});

describe('useGetStatus', () => {
  it('returns correct task numbers when receiving correct tasks geojson', () => {
    const { result } = renderHook(() => useTasksByStatus(tasksGeojson));
    expect(result.current.ready).toBe(6);
    expect(result.current.mapped).toBe(1);
    expect(result.current.lockedForMapping).toBe(2);
    expect(result.current.lockedForValidation).toBe(1);
    expect(result.current.validated).toBe(2);
    expect(result.current.invalidated).toBe(2);
    expect(result.current.badImagery).toBe(2);
    expect(result.current.totalTasks).toBe(16);
  });
  it('returns 0 to all values if tasks geojson is not provided', () => {
    const { result } = renderHook(() => useTasksByStatus());
    expect(result.current.ready).toBe(0);
    expect(result.current.mapped).toBe(0);
    expect(result.current.lockedForMapping).toBe(0);
    expect(result.current.lockedForValidation).toBe(0);
    expect(result.current.validated).toBe(0);
    expect(result.current.invalidated).toBe(0);
    expect(result.current.badImagery).toBe(0);
    expect(result.current.totalTasks).toBe(0);
  });
});
