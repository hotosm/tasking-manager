import { shouldPolyfill } from '@formatjs/intl-locale/should-polyfill';
import { shouldPolyfill as shouldPolyfillPluralRules } from '@formatjs/intl-pluralrules/should-polyfill';
import { shouldPolyfill as shouldPolyfillRelativeTimeFormat } from '@formatjs/intl-relativetimeformat/should-polyfill';

export const polyfill = async (locale) => {
  if (shouldPolyfill()) {
    await import('@formatjs/intl-locale/polyfill');
  }
  if (shouldPolyfillPluralRules(locale)) {
    const unsupportedLocalePluralRules = shouldPolyfillPluralRules(locale);
    await import('@formatjs/intl-pluralrules/polyfill-force');
    await import(`@formatjs/intl-pluralrules/locale-data/${unsupportedLocalePluralRules}`);
  }
  if (shouldPolyfillRelativeTimeFormat(locale)) {
    const unsupportedLocaleRelativeTimeFormat = shouldPolyfillRelativeTimeFormat(locale);
    await import('@formatjs/intl-relativetimeformat/polyfill-force');
    await import(
      `@formatjs/intl-relativetimeformat/locale-data/${unsupportedLocaleRelativeTimeFormat}`
    );
  }
};
