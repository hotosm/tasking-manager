import { renderHook, act } from '@testing-library/react';

import { useAsync } from '../UseAsync';

describe('useAsync', () => {
  it('with successful result', async () => {
    const mockFn = jest.fn();
    const testFn = () =>
      new Promise((resolve, reject) => {
        mockFn();
        resolve();
      });
    const { result } = renderHook(() => useAsync(testFn));
    expect(result.current.status).toBe('idle');
    await act(async () => await result.current.execute());
    expect(mockFn).toHaveBeenCalled();
    expect(result.current.status).toBe('success');
    expect(result.current.error).toBeNull();
  });
  it('with unsuccessful result', async () => {
    const mockFn = jest.fn();
    const testFn = () =>
      new Promise((resolve, reject) => {
        mockFn();
        reject();
      });
    const { result } = renderHook(() => useAsync(testFn));
    expect(result.current.status).toBe('idle');
    await act(async () => await result.current.execute());
    expect(mockFn).toHaveBeenCalled();
    expect(result.current.status).toBe('error');
    expect(result.current.error).not.toBeNull();
  });
});
