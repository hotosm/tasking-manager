import { renderHook } from '@testing-library/react-hooks';
import {
  invalidatedTaskHistory,
  history,
  revertedBadImagery,
} from '../../network/tests/mockData/taskHistory';
import { useDisableBadImagery } from '../UseDisableBadImagery';

describe('test useDisableBadImagery hook', () => {
  it('returns false when the task history is empty', () => {
    const { result } = renderHook(() => useDisableBadImagery({}));
    const disableBadImagery = result.current;
    expect(disableBadImagery).toBe(false);
  });
  it('returns false when the task was not reverted from BADIMAGERY to READY', () => {
    const { result } = renderHook(() => useDisableBadImagery(history));
    const disableBadImagery = result.current;
    expect(disableBadImagery).toBe(false);
  });
  it('returns false when the task was not reverted from BADIMAGERY to READY', () => {
    const { result } = renderHook(() => useDisableBadImagery(invalidatedTaskHistory));
    const disableBadImagery = result.current;
    expect(disableBadImagery).toBe(false);
  });
  it('returns true when the task was reverted from BADIMAGERY to READY', () => {
    const { result } = renderHook(() => useDisableBadImagery(revertedBadImagery));
    const disableBadImagery = result.current;
    expect(disableBadImagery).toBeTruthy();
  });
});
