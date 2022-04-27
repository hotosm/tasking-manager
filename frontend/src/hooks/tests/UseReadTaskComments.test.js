import { renderHook } from '@testing-library/react-hooks';
import { invalidatedTaskHistory, history } from '../../network/tests/mockData/taskHistory';
import { useReadTaskComments } from '../UseReadTaskComments';

describe('test useReadTaskComments hook', () => {
  it('returns false when there is no task history', () => {
    const { result } = renderHook(() => useReadTaskComments({}));
    const readTaskComments = result.current;
    expect(readTaskComments).toBe(false);
  });

  it('returns false if task has not been previously invalidated', () => {
    const { result } = renderHook(() => useReadTaskComments(history));
    const readTaskComments = result.current;
    expect(readTaskComments).toBe(false);
  });

  it('returns false if task history does not have comments', () => {
    const { result } = renderHook(() => useReadTaskComments(history));
    const readTaskComments = result.current;
    expect(readTaskComments).toBe(false);
  });

  it('returns true if was invalidated and has comments', () => {
    const { result } = renderHook(() => useReadTaskComments(invalidatedTaskHistory));
    const readTaskComments = result.current;
    expect(readTaskComments).toBe(true);
  });
});
