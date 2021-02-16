import { renderHook } from '@testing-library/react-hooks';

import { useOrganisationLevel, useGetLevel } from '../UseOrganisationLevel';

describe('useOrganisationLevel', () => {
  it('returns level 1 for a null value on completed actions', () => {
    const { result } = renderHook(() => useOrganisationLevel(null));
    const [currentLevel, nextLevelThreshold] = result.current;
    expect(currentLevel).toEqual({ level: 1, tier: 'free', minActions: 0, fee: 0 });
    expect(nextLevelThreshold).toBe(1000);
  });
  it('returns level 1 for an org with 800 completed actions', () => {
    const { result } = renderHook(() => useOrganisationLevel(900));
    const [currentLevel, nextLevelThreshold] = result.current;
    expect(currentLevel).toEqual({ level: 1, tier: 'free', minActions: 0, fee: 0 });
    expect(nextLevelThreshold).toBe(1000);
  });
  it('returns level 2 fo  r an org with 1900 completed actions', () => {
    const { result } = renderHook(() => useOrganisationLevel(1900));
    const [currentLevel, nextLevelThreshold] = result.current;
    expect(currentLevel).toEqual({ level: 2, tier: 'low', minActions: 1000, fee: 2500 });
    expect(nextLevelThreshold).toBe(10000);
  });
  it('returns level 3 for an org with 19000 completed actions', () => {
    const { result } = renderHook(() => useOrganisationLevel(19000));
    const [currentLevel, nextLevelThreshold] = result.current;
    expect(currentLevel).toEqual({ level: 3, tier: 'medium', minActions: 10000, fee: 7500 });
    expect(nextLevelThreshold).toBe(25000);
  });
  it('returns level 4 for an org with 30000 completed actions', () => {
    const { result } = renderHook(() => useOrganisationLevel(30000));
    const [currentLevel, nextLevelThreshold] = result.current;
    expect(currentLevel).toEqual({ level: 4, tier: 'high', minActions: 25000, fee: 20000 });
    expect(nextLevelThreshold).toBe(50000);
  });
  it('returns level 5 for an org with 50001 completed actions', () => {
    const { result } = renderHook(() => useOrganisationLevel(50001));
    const [currentLevel, nextLevelThreshold] = result.current;
    expect(currentLevel).toEqual({ level: 5, tier: 'veryHigh', minActions: 50000, fee: 35000 });
    expect(nextLevelThreshold).toBe(null);
  });
});

describe('useGetLevel', () => {
  it('returns level 1 object', () => {
    const { result } = renderHook(() => useGetLevel(1));
    expect(result.current).toEqual({ level: 1, tier: 'free', minActions: 0, fee: 0 });
  });
  it('returns level 2 object', () => {
    const { result } = renderHook(() => useGetLevel(2000));
    expect(result.current).toEqual({ level: 2, tier: 'low', minActions: 1000, fee: 2500 });
  });
  it('returns level 3 object', () => {
    const { result } = renderHook(() => useGetLevel(19000));
    expect(result.current).toEqual({ level: 3, tier: 'medium', minActions: 10000, fee: 7500 });
  });
  it('returns level 4 object', () => {
    const { result } = renderHook(() => useGetLevel(30000));
    expect(result.current).toEqual({ level: 4, tier: 'high', minActions: 25000, fee: 20000 });
  });
  it('returns level 5 object', () => {
    const { result } = renderHook(() => useGetLevel(51000));
    expect(result.current).toEqual({ level: 5, tier: 'veryHigh', minActions: 50000, fee: 35000 });
  });
});
