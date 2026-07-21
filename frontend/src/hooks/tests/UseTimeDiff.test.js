import { renderHook, act } from '@testing-library/react';
import { useTimeDiff } from '../UseTimeDiff';

describe('useTimeDiff hook', () => {
  afterEach(() => jest.clearAllMocks());

  it('devuelve "day" como unidad por defecto', () => {
    const { result } = renderHook(() => useTimeDiff([]));
    expect(result.current).toBe('day');
  });

  it('devuelve "day" cuando tasksByDay es null', () => {
    const { result } = renderHook(() => useTimeDiff(null));
    expect(result.current).toBe('day');
  });

  it('devuelve "day" cuando tasksByDay es undefined', () => {
    const { result } = renderHook(() => useTimeDiff(undefined));
    expect(result.current).toBe('day');
  });

  it('devuelve "day" cuando tasksByDay tiene solo 1 elemento', () => {
    const tasks = [{ date: '2024-01-01' }];
    const { result } = renderHook(() => useTimeDiff(tasks));
    expect(result.current).toBe('day');
  });

  it('devuelve "day" cuando la diferencia es ≤ 16 días', () => {
    const tasks = [
      { date: '2024-01-01' },
      { date: '2024-01-10' }, // 9 días
    ];
    const { result } = renderHook(() => useTimeDiff(tasks));
    expect(result.current).toBe('day');
  });

  it('devuelve "week" cuando la diferencia es > 16 días y ≤ 16 semanas', async () => {
    const start = '2024-01-01';
    const end = '2024-02-01'; // 31 días
    const tasks = [{ date: start }, { date: end }];
    const { result } = renderHook(() => useTimeDiff(tasks));

    await act(async () => { await Promise.resolve(); });

    expect(result.current).toBe('week');
  });

  it('devuelve "month" cuando la diferencia es > 16 semanas (> 112 días)', async () => {
    const tasks = [
      { date: '2024-01-01' },
      { date: '2024-05-15' }, // ~135 días
    ];
    const { result } = renderHook(() => useTimeDiff(tasks));

    await act(async () => { await Promise.resolve(); });

    expect(result.current).toBe('month');
  });

  it('devuelve "month" para rango de más de 1 año', async () => {
    const tasks = [
      { date: '2023-01-01' },
      { date: '2024-06-01' },
    ];
    const { result } = renderHook(() => useTimeDiff(tasks));

    await act(async () => { await Promise.resolve(); });

    expect(result.current).toBe('month');
  });

  it('usa primer y último elemento para el rango con 3+ elementos', async () => {
    const tasks = [
      { date: '2024-01-01' },
      { date: '2024-02-01' },
      { date: '2024-05-15' }, // 135 días total → month
    ];
    const { result } = renderHook(() => useTimeDiff(tasks));

    await act(async () => { await Promise.resolve(); });

    expect(result.current).toBe('month');
  });

  it('devuelve "day" para diferencia exacta de 16 días', async () => {
    const tasks = [
      { date: '2024-01-01' },
      { date: '2024-01-17' }, // 16 días exactos — NOT > 16, so stays day
    ];
    const { result } = renderHook(() => useTimeDiff(tasks));

    await act(async () => { await Promise.resolve(); });

    expect(result.current).toBe('day');
  });
});
