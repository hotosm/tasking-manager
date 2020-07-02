import { renderHook } from '@testing-library/react-hooks';

import { useComputeCompleteness } from '../UseProjectCompletenessCalc';
import tasksGeojson from '../../utils/tests/snippets/tasksGeometry';

describe('', () => {
  it('computeCompleteness', () => {
    const { result } = renderHook(() => useComputeCompleteness(tasksGeojson));
    expect(result.current.percentMapped).toBe(28);
    expect(result.current.percentValidated).toBe(14);
    expect(result.current.percentBadImagery).toBe(12);
  });

  it('computeCompleteness return 0 to all values if tasks geojson is not provided', () => {
    const { result } = renderHook(() => useComputeCompleteness());
    expect(result.current.percentMapped).toBe(0);
    expect(result.current.percentValidated).toBe(0);
    expect(result.current.percentBadImagery).toBe(0);
  });
});
