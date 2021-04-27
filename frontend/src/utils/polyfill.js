import { shouldPolyfill } from '@formatjs/intl-locale/should-polyfill';
import { shouldPolyfill as shouldPolyfillPluralRules } from '@formatjs/intl-pluralrules/should-polyfill';
import { shouldPolyfill as shouldPolyfillRelativeTimeFormat } from '@formatjs/intl-relativetimeformat/should-polyfill';

export const polyfill = async (locale) => {
  if (shouldPolyfill()) {
    await import('@formatjs/intl-locale/polyfill');
  }
  if (shouldPolyfillPluralRules()) {
    await import('@formatjs/intl-pluralrules/polyfill');
  }
  if (shouldPolyfillRelativeTimeFormat()) {
    await import('@formatjs/intl-relativetimeformat/polyfill');
  }
  /* Safari 12- and IE */
  if (Intl.PluralRules.polyfilled) {
    switch (locale) {
      default:
        await import('@formatjs/intl-pluralrules/locale-data/en');
        break;
      case 'cs':
        await import('@formatjs/intl-pluralrules/locale-data/cs');
        break;
      case 'de':
        await import('@formatjs/intl-pluralrules/locale-data/de');
        break;
      case 'el':
        await import('@formatjs/intl-pluralrules/locale-data/el');
        break;
      case 'es':
        await import('@formatjs/intl-pluralrules/locale-data/es');
        break;
      case 'fa':
        await import('@formatjs/intl-pluralrules/locale-data/fa');
        break;
      case 'fr':
        await import('@formatjs/intl-pluralrules/locale-data/fr');
        break;
      case 'he':
        await import('@formatjs/intl-pluralrules/locale-data/he');
        break;
      case 'hu':
        await import('@formatjs/intl-pluralrules/locale-data/hu');
        break;
      case 'id':
        await import('@formatjs/intl-pluralrules/locale-data/id');
        break;
      case 'it':
        await import('@formatjs/intl-pluralrules/locale-data/it');
        break;
      case 'ja':
        await import('@formatjs/intl-pluralrules/locale-data/ja');
        break;
      case 'ko':
        await import('@formatjs/intl-pluralrules/locale-data/ko');
        break;
      case 'nl':
        await import('@formatjs/intl-pluralrules/locale-data/nl');
        break;
      case 'pt':
        await import('@formatjs/intl-pluralrules/locale-data/pt');
        break;
      case 'sv':
        await import('@formatjs/intl-pluralrules/locale-data/sv');
        break;
      case 'sw':
        await import('@formatjs/intl-pluralrules/locale-data/sw');
        break;
      case 'tr':
        await import('@formatjs/intl-pluralrules/locale-data/tr');
        break;
      case 'uk':
        await import('@formatjs/intl-pluralrules/locale-data/uk');
        break;
      case 'zh':
        await import('@formatjs/intl-pluralrules/locale-data/zh');
        break;
    }
  }

  /* Safari 13- and IE */
  if (Intl.RelativeTimeFormat.polyfilled) {
    switch (locale) {
      default:
        await import('@formatjs/intl-relativetimeformat/locale-data/en');
        break;
      case 'cs':
        await import('@formatjs/intl-relativetimeformat/locale-data/cs');
        break;
      case 'de':
        await import('@formatjs/intl-relativetimeformat/locale-data/de');
        break;
      case 'el':
        await import('@formatjs/intl-relativetimeformat/locale-data/el');
        break;
      case 'es':
        await import('@formatjs/intl-relativetimeformat/locale-data/es');
        break;
      case 'fa':
        await import('@formatjs/intl-relativetimeformat/locale-data/fa');
        break;
      case 'fr':
        await import('@formatjs/intl-relativetimeformat/locale-data/fr');
        break;
      case 'he':
        await import('@formatjs/intl-relativetimeformat/locale-data/he');
        break;
      case 'hu':
        await import('@formatjs/intl-relativetimeformat/locale-data/hu');
        break;
      case 'id':
        await import('@formatjs/intl-relativetimeformat/locale-data/id');
        break;
      case 'it':
        await import('@formatjs/intl-relativetimeformat/locale-data/it');
        break;
      case 'ja':
        await import('@formatjs/intl-relativetimeformat/locale-data/ja');
        break;
      case 'ko':
        await import('@formatjs/intl-relativetimeformat/locale-data/ko');
        break;
      case 'nl':
        await import('@formatjs/intl-relativetimeformat/locale-data/nl');
        break;
      case 'pt':
        await import('@formatjs/intl-relativetimeformat/locale-data/pt');
        break;
      case 'sv':
        await import('@formatjs/intl-relativetimeformat/locale-data/sv');
        break;
      case 'sw':
        await import('@formatjs/intl-relativetimeformat/locale-data/sw');
        break;
      case 'tr':
        await import('@formatjs/intl-relativetimeformat/locale-data/tr');
        break;
      case 'uk':
        await import('@formatjs/intl-relativetimeformat/locale-data/uk');
        break;
      case 'zh':
        await import('@formatjs/intl-relativetimeformat/locale-data/zh');
        break;
    }
  }
};
