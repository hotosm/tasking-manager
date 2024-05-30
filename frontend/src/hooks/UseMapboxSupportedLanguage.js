import { useSelector } from 'react-redux';
import MapboxLanguage from '@mapbox/mapbox-gl-language';

const { supportedLanguages } = new MapboxLanguage();

const defaultLocale = 'en';

/**
 * A React custom hook to check if the locale language is supported by Mapbox GL or not
 *
 * Returns `en` if the locale is not supported, else returns preferred locale
 *
 */
export default function useMapboxSupportedLanguage() {
  const locale = useSelector((state) => state.preferences.locale);

  if (!locale) return defaultLocale;

  const language = locale.substr(0, 2);
  if (supportedLanguages.includes(language)) return language;

  return defaultLocale;
}
