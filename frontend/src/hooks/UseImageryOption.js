import { useMemo } from 'react';

export const IMAGERY_OPTIONS = [
  { label: 'Bing', value: 'Bing' },
  { label: 'Mapbox Satellite', value: 'Mapbox' },
  { label: 'ESRI World Imagery', value: 'EsriWorldImagery' },
  { label: 'ESRI World Imagery (Clarity) Beta', value: 'EsriWorldImageryClarity' },
  { label: 'Maxar Premium', value: 'Maxar-Premium' },
  { label: 'Maxar Standard', value: 'Maxar-Standard' },
  { label: 'Custom', value: 'custom' },
];

export const useImageryOption = (imagery) => {
  const getImagery = useMemo(() => {
    if (imagery) {
      const filtered = IMAGERY_OPTIONS.filter((i) => i.value === imagery);
      if (filtered.length) {
        return filtered[0];
      }
      return IMAGERY_OPTIONS[IMAGERY_OPTIONS.length - 1];
    } else {
      return null;
    }
  }, [imagery]);
  return getImagery;
};
