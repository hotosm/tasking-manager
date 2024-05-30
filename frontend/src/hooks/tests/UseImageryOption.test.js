import { renderHook } from '@testing-library/react-hooks';

import { useImageryOption } from '../UseImageryOption';

describe('useImageryOption', () => {
  it('returns custom if a custom imagery is used', () => {
    const { result } = renderHook(() =>
      useImageryOption('https://tiles.osm.org/{zoom}/{x}/{y}.png'),
    );
    expect(result.current).toEqual({ label: 'Custom', value: 'custom' });
  });
  it('with Bing', () => {
    const { result } = renderHook(() => useImageryOption('Bing'));
    expect(result.current).toEqual({ label: 'Bing', value: 'Bing' });
  });
  it('with Maxar-Premium', () => {
    const { result } = renderHook(() => useImageryOption('Maxar-Premium'));
    expect(result.current).toEqual({ label: 'Maxar Premium', value: 'Maxar-Premium' });
  });
  it('with EsriWorldImagery', () => {
    const { result } = renderHook(() => useImageryOption('EsriWorldImagery'));
    expect(result.current).toEqual({ label: 'ESRI World Imagery', value: 'EsriWorldImagery' });
  });
  it('when receives null, returns null', () => {
    const { result } = renderHook(() => useImageryOption(null));
    expect(result.current).toEqual(null);
  });
});
