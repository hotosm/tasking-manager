import { renderHook, act } from '@testing-library/react';
import { useAsync } from '../UseAsync';

describe('useAsync hook', () => {
  afterEach(() => jest.clearAllMocks());

  it('tiene estado inicial "idle"', () => {
    const asyncFn = jest.fn().mockResolvedValue('data');
    const { result } = renderHook(() => useAsync(asyncFn));
    expect(result.current.status).toBe('idle');
  });

  it('el valor inicial es null', () => {
    const asyncFn = jest.fn().mockResolvedValue('data');
    const { result } = renderHook(() => useAsync(asyncFn));
    expect(result.current.value).toBeNull();
  });

  it('el error inicial es null', () => {
    const asyncFn = jest.fn().mockResolvedValue('data');
    const { result } = renderHook(() => useAsync(asyncFn));
    expect(result.current.error).toBeNull();
  });

  it('expone la función execute', () => {
    const asyncFn = jest.fn().mockResolvedValue('data');
    const { result } = renderHook(() => useAsync(asyncFn));
    expect(typeof result.current.execute).toBe('function');
  });

  it('cambia al estado "success" tras una resolución exitosa', async () => {
    const asyncFn = jest.fn().mockResolvedValue('resultado');
    const { result } = renderHook(() => useAsync(asyncFn));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.status).toBe('success');
    expect(result.current.value).toBe('resultado');
  });

  it('cambia al estado "error" tras un rechazo', async () => {
    const asyncFn = jest.fn().mockRejectedValue(new Error('fallo'));
    const { result } = renderHook(() => useAsync(asyncFn));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error.message).toBe('fallo');
  });

  it('ejecuta inmediatamente cuando immediate=true', async () => {
    const asyncFn = jest.fn().mockResolvedValue('auto');
    const { result } = renderHook(() => useAsync(asyncFn, true));

    // Wait for immediate execution
    await act(async () => {
      await Promise.resolve();
    });

    expect(asyncFn).toHaveBeenCalled();
  });

  it('NO ejecuta automáticamente cuando immediate=false (default)', () => {
    const asyncFn = jest.fn().mockResolvedValue('no-auto');
    renderHook(() => useAsync(asyncFn, false));
    expect(asyncFn).not.toHaveBeenCalled();
  });

  it('execute pasa el parámetro a asyncFunction', async () => {
    const asyncFn = jest.fn((param) => Promise.resolve(param));
    const { result } = renderHook(() => useAsync(asyncFn));

    await act(async () => {
      await result.current.execute('mi-param');
    });

    expect(asyncFn).toHaveBeenCalledWith('mi-param');
    expect(result.current.value).toBe('mi-param');
  });

  it('usa null como parámetro por defecto si execute se llama sin argumentos', async () => {
    const asyncFn = jest.fn((param) => Promise.resolve(param));
    const { result } = renderHook(() => useAsync(asyncFn));

    await act(async () => {
      await result.current.execute();
    });

    expect(asyncFn).toHaveBeenCalledWith(null);
  });

  it('resetea error a null al iniciar nueva ejecución', async () => {
    const asyncFn = jest.fn()
      .mockRejectedValueOnce(new Error('fallo'))
      .mockResolvedValueOnce('ok');
    const { result } = renderHook(() => useAsync(asyncFn));

    await act(async () => { await result.current.execute(); });
    expect(result.current.error).toBeInstanceOf(Error);

    await act(async () => { await result.current.execute(); });
    expect(result.current.error).toBeNull();
    expect(result.current.value).toBe('ok');
  });
});
