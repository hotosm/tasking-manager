import { renderHook } from '@testing-library/react-hooks';

import { useTimeDiff } from '../UseTimeDiff';

describe('useTimeDiff', () => {
  it('returns day if time interval smaller than 17 days', () => {
    const tasksByDay = [{ date: '2020-03-15' }, { date: '2020-03-31' }];
    const { result } = renderHook(() => useTimeDiff(tasksByDay));
    expect(result.current).toBe('day');
  });
  it('returns week if time interval bigger than 16 days', () => {
    const tasksByDay = [{ date: '2020-03-14' }, { date: '2020-03-31' }];
    const { result } = renderHook(() => useTimeDiff(tasksByDay));
    expect(result.current).toBe('week');
  });
  it('returns week if time interval smaller than 16 weeks', () => {
    const tasksByDay = [{ date: '2019-12-10' }, { date: '2020-03-31' }];
    const { result } = renderHook(() => useTimeDiff(tasksByDay));
    expect(result.current).toBe('week');
  });
  it('returns month if time interval bigger than 16 weeks', () => {
    const tasksByDay = [{ date: '2019-12-09' }, { date: '2020-03-31' }];
    const { result } = renderHook(() => useTimeDiff(tasksByDay));
    expect(result.current).toBe('month');
  });
  it('returns day if tasksByDay is empty', () => {
    const { result } = renderHook(() => useTimeDiff(null));
    expect(result.current).toBe('day');
  });
  it('returns day if tasksByDay have only one item', () => {
    const tasksByDay = [{ date: '2019-12-09' }];
    const { result } = renderHook(() => useTimeDiff(tasksByDay));
    expect(result.current).toBe('day');
  });
});
