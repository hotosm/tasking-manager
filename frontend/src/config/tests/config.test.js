import * as config from '../index';


it('exports API_URL', () => {
  expect(typeof(config.API_URL)).toBe('string');
});
it('exports ORG_URL', () => {
  expect(typeof(config.ORG_URL)).toBe('string');
});
it('exports ORG_NAME', () => {
  expect(typeof(config.ORG_NAME)).toBe('string');
});
it('exports ORG_CODE', () => {
  expect(typeof(config.ORG_CODE)).toBe('string');
});
