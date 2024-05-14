import { renderHook } from '@testing-library/react-hooks';

import { useAvatarText } from '../UseAvatarText';

describe('useAvatarText sizeClasses', () => {
  it('with multiple words name returns the initials', () => {
    const { result } = renderHook(() => useAvatarText('long user name'));
    expect(result.current).toBe('lun');
  });
  it('with more than 3 words name returns the 3 first initials', () => {
    const { result } = renderHook(() => useAvatarText('one two three four five'));
    expect(result.current).toBe('ott');
  });
  it('with single word returns the initial', () => {
    const { result } = renderHook(() => useAvatarText('Venus'));
    expect(result.current).toBe('V');
  });
  it('with multiple words username returns the initials', () => {
    const { result } = renderHook(() => useAvatarText(null, 'long user name'));
    expect(result.current).toBe('lun');
  });
  it('with more than 3 words username returns the 3 first initials', () => {
    const { result } = renderHook(() => useAvatarText(null, 'one two three four five'));
    expect(result.current).toBe('ott');
  });
  it('with single word username returns the initial', () => {
    const { result } = renderHook(() => useAvatarText(null, 'Venus'));
    expect(result.current).toBe('V');
  });
  it('with number returns the number', () => {
    const { result } = renderHook(() => useAvatarText(null, null, '+123'));
    expect(result.current).toBe('+123');
  });
});
