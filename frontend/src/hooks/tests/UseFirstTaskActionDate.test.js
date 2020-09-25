import { renderHook } from '@testing-library/react-hooks';

import useFirstTaskActionDate from '../UseFirstTaskActionDate';
import { history } from '../../network/tests/mockData/taskHistory';

describe('test if useFirstTaskActionDate', () => {
  it('with some history returns the correct result', () => {
    const { result } = renderHook(() => useFirstTaskActionDate(history));
    const firstDate = result.current;
    expect(firstDate).toBe('2020-04-08T10:18:22.020469Z');
  });
  it('with empty history returns null', () => {
    const { result } = renderHook(() => useFirstTaskActionDate({}));
    const firstDate = result.current;
    expect(firstDate).toBe(null);
  });
  it('with empty taskHistory returns null', () => {
    const { result } = renderHook(() => useFirstTaskActionDate({ taskHistory: [] }));
    const firstDate = result.current;
    expect(firstDate).toBe(null);
  });
});
