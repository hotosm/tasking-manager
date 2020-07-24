import {
  translateCountry,
  countriesList,
  getCountryCode,
  isLangSupported,
  formatCountryList,
  formatFilterCountriesData,
} from '../countries';

it('test if countriesList return an object', () => {
  const countries = countriesList();
  expect(typeof countries).toBe('object');
  expect(countries.BR).toBe('Brazil');
  expect(countries.DE).toBe('Germany');
});

it('test getCountryCode function', () => {
  expect(getCountryCode('Brazil')).toBe('BR');
  expect(getCountryCode('Germany')).toBe('DE');
  expect(getCountryCode('United States of America')).toBe('US');
  expect(getCountryCode('United States')).toBe('');
});

it('test if language code is supported by the countries translation library we are using', () => {
  expect(isLangSupported('yy')).toBeFalsy();
  expect(isLangSupported('pt-BR')).toBeTruthy();
  expect(isLangSupported('pt')).toBeTruthy();
  expect(isLangSupported('ja')).toBeTruthy();
  expect(isLangSupported('fa')).toBeTruthy();
  expect(isLangSupported('sw')).toBeTruthy();
  expect(isLangSupported('ml')).toBeTruthy();
  expect(isLangSupported('mg')).toBeTruthy();
  expect(isLangSupported('nl-NL')).toBeTruthy();
  expect(isLangSupported('zh-TW')).toBeTruthy();
});

describe('translate a country name from English to', () => {
  it('Spanish', () => {
    expect(translateCountry('Germany', 'es')).toBe('Alemania');
    expect(translateCountry('Brazil', 'es')).toBe('Brasil');
    expect(translateCountry('Saudi Arabia', 'es')).toBe('Arabia Saudita');
    expect(translateCountry('Saudi Arabia', 'es-AR')).toBe('Arabia Saudita');
    expect(translateCountry('Saudi Arabia', 'es-ES')).toBe('Arabia Saudita');
  });
  it('Portuguese', () => {
    expect(translateCountry('Germany', 'pt')).toBe('Alemanha');
    expect(translateCountry('Brazil', 'pt')).toBe('Brasil');
    expect(translateCountry('Japan', 'pt')).toBe('Japão');
    expect(translateCountry('Australia', 'pt')).toBe('Austrália');
    expect(translateCountry('Saudi Arabia', 'pt-BR')).toBe('Arábia Saudita');
    expect(translateCountry('Unexistent country', 'pt-BR')).toBe('Unexistent country');
  });
  it('Arabic', () => {
    expect(translateCountry('Saudi Arabia', 'ar')).toBe('السعودية');
  });
});

it('format list of countries on the format required by react-select', () => {
  const french = formatCountryList('fr');
  expect(french.length).toBeGreaterThan(0);
  expect(typeof french[0]).toBe('object');
  expect(typeof french[0].value).toBe('string');
  expect(typeof french[0].label).toBe('string');
});

describe('format list of countries in a format required by explore projects page selector', () => {
  it('to Portuguese', () => {
    expect(formatFilterCountriesData(['Brazil', 'Australia'], 'pt')).toEqual([
      { name: 'Brasil', value: 'Brazil' },
      { name: 'Austrália', value: 'Australia' },
    ]);
  });
  it('to Spanish', () => {
    expect(formatFilterCountriesData(['Brazil', 'Australia'], 'es')).toEqual([
      { name: 'Brasil', value: 'Brazil' },
      { name: 'Australia', value: 'Australia' },
    ]);
  });
  it('to English', () => {
    expect(formatFilterCountriesData(['Brazil', 'Australia'], 'en')).toEqual([
      { name: 'Brazil', value: 'Brazil' },
      { name: 'Australia', value: 'Australia' },
    ]);
  });
});
