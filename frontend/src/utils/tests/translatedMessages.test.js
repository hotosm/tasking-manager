import getTranslatedMessages from '../translatedMessages';


it('passing a non existante locale code should return the default locale', () => {
  expect(
    typeof(getTranslatedMessages('xy'))
  ).toBe('object');
  expect(
    getTranslatedMessages('xy')
  ).toEqual(getTranslatedMessages('en'));
});
it('passing a non existante locale code should return the default locale', () => {
  expect(
    getTranslatedMessages('pt')
  ).not.toEqual(getTranslatedMessages('en'));
});
