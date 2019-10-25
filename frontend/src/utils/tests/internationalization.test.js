import { getTranslatedMessages, getSupportedLocale } from '../internationalization';

it('passing a non existante locale code should return the default locale', () => {
  expect(typeof getTranslatedMessages('xy')).toBe('object');
  expect(getTranslatedMessages('xy')).toEqual(getTranslatedMessages('en'));
});
it('passing a non existante locale code should return the default locale', () => {
  expect(getTranslatedMessages('pt')).not.toEqual(getTranslatedMessages('en'));
});

it('get a supported locale', () => {
  expect(getSupportedLocale('pt')).toEqual({ label: 'Português', value: 'pt' });
});

it('get a generic supported locale', () => {
  expect(getSupportedLocale('pt-br')).toEqual({ label: 'Português', value: 'pt' });
  expect(getSupportedLocale('en-gb')).toEqual({ label: 'English', value: 'en' });
});
it('get a unsupported locale returns {}', () => {
  expect(getSupportedLocale('xt')).toEqual({});
});
