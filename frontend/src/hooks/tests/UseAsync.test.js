import { renderHook } from '@testing-library/react-hooks';

import { useAsync } from '../UseAsync';

describe('useAsync', () => {
  it('with successful result', async () => {
    const mockFn = jest.fn();
    const testFn = () =>
      new Promise((resolve, reject) => {
        mockFn();
        resolve();
      });
    const { result, waitForNextUpdate } = renderHook(() => useAsync(testFn));
    expect(result.current.status).toBe('idle');
    result.current.execute();
    expect(mockFn).toHaveBeenCalled();
    expect(result.current.status).toBe('pending');
    await waitForNextUpdate();
    expect(result.current.status).toBe('success');
  });
  it('with unsuccessful result', async () => {
    const mockFn = jest.fn();
    const testFn = () =>
      new Promise((resolve, reject) => {
        mockFn();
        reject();
      });
    const { result, waitForNextUpdate } = renderHook(() => useAsync(testFn));
    expect(result.current.status).toBe('idle');
    result.current.execute();
    expect(mockFn).toHaveBeenCalled();
    expect(result.current.status).toBe('pending');
    await waitForNextUpdate();
    expect(result.current.status).toBe('error');
  });
});
