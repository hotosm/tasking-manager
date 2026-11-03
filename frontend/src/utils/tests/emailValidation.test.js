import { EMAIL_REGEX, EMAIL_INPUT_PATTERN } from '../emailValidation';

describe('EMAIL_REGEX', () => {
  it('accepts addresses with modern long TLDs (#7340)', () => {
    expect(EMAIL_REGEX.test('htm@klose.berlin')).toBe(true);
    expect(EMAIL_REGEX.test('user@example.software')).toBe(true);
    expect(EMAIL_REGEX.test('user@example.online')).toBe(true);
  });

  it('still accepts common short TLDs', () => {
    expect(EMAIL_REGEX.test('user@example.com')).toBe(true);
    expect(EMAIL_REGEX.test('user@sub.domain.org')).toBe(true);
    expect(EMAIL_REGEX.test('first.last+tag@example.co')).toBe(true);
  });

  it('rejects malformed addresses', () => {
    expect(EMAIL_REGEX.test('not-an-email')).toBe(false);
    expect(EMAIL_REGEX.test('user@')).toBe(false);
    expect(EMAIL_REGEX.test('@example.com')).toBe(false);
    expect(EMAIL_REGEX.test('user@example')).toBe(false);
  });

  it('exposes the same source string for the HTML pattern attribute', () => {
    expect(EMAIL_INPUT_PATTERN).toBe(EMAIL_REGEX.source);
  });
});
