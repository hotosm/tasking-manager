import { getCountries, getCountry, getSupportedLangs } from '@hotosm/iso-countries-languages';

export function translateCountry(name, locale) {
  const code = getCountryCode(name);
  if (code && isLangSupported(locale)) return getCountry(locale.split('-')[0], code);
  return name;
}

export function countriesList() {
  return getCountries('en');
}

export function getCountryCode(name) {
  const data = countriesList();
  var newData = Object.keys(data).reduce((obj, key) => {
    obj[data[key]] = key;
    return obj;
  }, {});
  return newData[name] || '';
}

export function isLangSupported(code) {
  if (getSupportedLangs().includes(code.split('-')[0])) return true;
  return false;
}

export function formatCountryList(locale) {
  if (locale && isLangSupported(locale)) {
    const countries = getCountries(locale.split('-')[0]);
    return Object.keys(countries).map((key) => ({ label: countries[key], value: key }));
  }
}

export const formatFilterCountriesData = (countries, locale) =>
  countries.map((country) => ({
    name: locale.includes('en') ? country : translateCountry(country, locale),
    value: locale.includes('en') ? country : translateCountry(country, 'en'),
  }));
