import * as config from '../index';

it('exports API_URL', () => {
  expect(typeof config.API_URL).toBe('string');
});
it('exports EDITS_API_URL', () => {
  expect(typeof config.EDITS_API_URL).toBe('string');
});
it('exports ORG_URL', () => {
  expect(typeof config.ORG_URL).toBe('string');
});
it('exports ORG_NAME', () => {
  expect(typeof config.ORG_NAME).toBe('string');
});
it('exports ORG_CODE', () => {
  expect(typeof config.ORG_CODE).toBe('string');
});
it('exports ORG_TWITTER', () => {
  expect(typeof config.ORG_TWITTER).toBe('string');
});
it('exports ORG_FB', () => {
  expect(typeof config.ORG_FB).toBe('string');
});
it('exports ORG_INSTAGRAM', () => {
  expect(typeof config.ORG_INSTAGRAM).toBe('string');
});
it('exports ORG_YOUTUBE', () => {
  expect(typeof config.ORG_YOUTUBE).toBe('string');
});
it('exports ORG_GITHUB', () => {
  expect(typeof config.ORG_GITHUB).toBe('string');
});
it('exports DEFAULT locale to be english', () => {
  expect(config.DEFAULT_LOCALE).toBe('en');
});
it('exports PROJECTCARD_CONTRIBUTION_SHOWN_THRESHOLD', () => {
  expect(typeof config.PROJECTCARD_CONTRIBUTION_SHOWN_THRESHOLD).toBe('number');
});
it('exports INTERMEDIATE_LEVEL_COUNT', () => {
  expect(typeof config.INTERMEDIATE_LEVEL_COUNT).toBe('number');
});
it('exports ADVANCED_LEVEL_COUNT', () => {
  expect(typeof config.ADVANCED_LEVEL_COUNT).toBe('number');
});
