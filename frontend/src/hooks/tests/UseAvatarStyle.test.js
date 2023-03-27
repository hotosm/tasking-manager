import { renderHook } from '@testing-library/react';

import { useAvatarStyle } from '../UseAvatarStyle';

describe('useAvatarStyle sizeClasses', () => {
  it('with null size returns medium size', () => {
    const { result } = renderHook(() => useAvatarStyle(null, false, null));
    expect(result.current.sizeClasses).toBe('user-picture-medium f5');
  });
  it('with medium size returns same as null size', () => {
    const { result } = renderHook(() => useAvatarStyle('medium', false, null));
    expect(result.current.sizeClasses).toBe('user-picture-medium f5');
  });
  it('with large size returns correct classes', () => {
    const { result } = renderHook(() => useAvatarStyle('large', false, null));
    expect(result.current.sizeClasses).toBe('h3 w3 f2');
  });
  it('with small size returns correct classes', () => {
    const { result } = renderHook(() => useAvatarStyle('small', false, null));
    expect(result.current.sizeClasses).toBe('f6');
  });
});

describe('useAvatarStyle closeIconStyle', () => {
  it('with null size returns medium size', () => {
    const { result } = renderHook(() => useAvatarStyle(null, false, null));
    expect(result.current.closeIconStyle).toEqual({ left: '0.4rem' });
  });
  it('with medium size returns same as null size', () => {
    const { result } = renderHook(() => useAvatarStyle('medium', false, null));
    expect(result.current.closeIconStyle).toEqual({ left: '0.4rem' });
  });
  it('with large size returns correct classes', () => {
    const { result } = renderHook(() => useAvatarStyle('large', false, null));
    expect(result.current.closeIconStyle).toEqual({ marginLeft: '3rem' });
  });
  it('with small size returns correct classes', () => {
    const { result } = renderHook(() => useAvatarStyle('small', false, null));
    expect(result.current.closeIconStyle).toEqual({ marginLeft: '0' });
  });
});

describe('useAvatarStyle textPadding', () => {
  it('with null size and disabled editMode', () => {
    const { result } = renderHook(() => useAvatarStyle(null, false, null));
    expect(result.current.textPadding).toEqual({ paddingTop: '0.375rem' });
  });
  it('with medium size and disabled editMode', () => {
    const { result } = renderHook(() => useAvatarStyle('medium', false, null));
    expect(result.current.textPadding).toEqual({ paddingTop: '0.375rem' });
  });
  it('with null size and enabled editMode', () => {
    const { result } = renderHook(() => useAvatarStyle(null, true, null));
    expect(result.current.textPadding).toEqual({ top: '-0.75rem' });
  });
  it('with medium size and enabled editMode', () => {
    const { result } = renderHook(() => useAvatarStyle('medium', true, null));
    expect(result.current.textPadding).toEqual({ top: '-0.75rem' });
  });
  it('with large size and disabled editMode', () => {
    const { result } = renderHook(() => useAvatarStyle('large', false, null));
    expect(result.current.textPadding).toEqual({ paddingTop: '0.625rem' });
  });
  it('with large size and enabled editMode', () => {
    const { result } = renderHook(() => useAvatarStyle('large', true, null));
    expect(result.current.textPadding).toEqual({ top: '-0.5rem' });
  });
  it('with small size and disabled editMode', () => {
    const { result } = renderHook(() => useAvatarStyle('small', false, null));
    expect(result.current.textPadding).toEqual({ paddingTop: '0.225rem' });
  });
  it('with small size and enabled editMode', () => {
    const { result } = renderHook(() => useAvatarStyle('small', true, null));
    expect(result.current.textPadding).toEqual({ top: '-0.5rem' });
  });
});

describe('useAvatarStyle sizeStyle', () => {
  it('with null size and null picture returns {}', () => {
    const { result } = renderHook(() => useAvatarStyle(null, false, null));
    expect(result.current.sizeStyle).toEqual({});
  });
  it('with medium size and null picture returns {}', () => {
    const { result } = renderHook(() => useAvatarStyle('medium', false, null));
    expect(result.current.sizeStyle).toEqual({});
  });
  it('with large size and null picture returns {}', () => {
    const { result } = renderHook(() => useAvatarStyle('large', false, null));
    expect(result.current.sizeStyle).toEqual({});
  });
  it('with null size and picture returns backgroundImage', () => {
    const { result } = renderHook(() => useAvatarStyle(null, false, 'file.jpg'));
    expect(result.current.sizeStyle).toEqual({ backgroundImage: 'url("file.jpg")' });
  });
  it('with medium size and picture returns backgroundImage', () => {
    const { result } = renderHook(() => useAvatarStyle('medium', false, 'file.jpg'));
    expect(result.current.sizeStyle).toEqual({ backgroundImage: 'url("file.jpg")' });
  });
  it('with large size and picture returns backgroundImage', () => {
    const { result } = renderHook(() => useAvatarStyle('large', false, 'file.jpg'));
    expect(result.current.sizeStyle).toEqual({ backgroundImage: 'url("file.jpg")' });
  });
  it('with small size and null picture returns only height and width', () => {
    const { result } = renderHook(() => useAvatarStyle('small', false, null));
    expect(result.current.sizeStyle).toEqual({ height: '1.5rem', width: '1.5rem' });
  });
  it('with small size and picture returns height, width and backgroundImage', () => {
    const { result } = renderHook(() =>
      useAvatarStyle('small', false, 'https://image.co/file2.jpg'),
    );
    expect(result.current.sizeStyle).toEqual({
      height: '1.5rem',
      width: '1.5rem',
      backgroundImage: 'url("https://image.co/file2.jpg")',
    });
  });
});
