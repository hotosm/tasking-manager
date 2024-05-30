import { renderHook } from '@testing-library/react';

import useGetContributors from '../UseGetContributors';
import { history } from '../../network/tests/mockData/taskHistory';

describe('test if useGetContributors', () => {
  it('with some history returns the correct result', () => {
    const { result } = renderHook(() => useGetContributors(history));
    const contributors = result.current();
    expect(contributors).toEqual(['user_123', 'test_user']);
  });
  it('with empty history returns null', () => {
    const { result } = renderHook(() => useGetContributors({}));
    const contributors = result.current;
    expect(contributors.length).toBe(0);
  });
  it('with empty taskHistory returns null', () => {
    const { result } = renderHook(() => useGetContributors({ taskHistory: [] }));
    const contributors = result.current;
    expect(contributors.length).toBe(0);
  });
});
