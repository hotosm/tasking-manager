// .storybook/config.js

import { addDecorator,configure } from '@storybook/react';
import { setIntlConfig, withIntl } from 'storybook-addon-intl';
 
// Load the locale data for all your defined locales
import { addLocaleData } from 'react-intl';
import de from 'react-intl/locale-data/de';
import en from 'react-intl/locale-data/en';
import es from 'react-intl/locale-data/es';
import fr from 'react-intl/locale-data/fr';
import ja from 'react-intl/locale-data/ja';
import ko from 'react-intl/locale-data/ko';
import pt from 'react-intl/locale-data/pt';

import getTranslatedMessages from '../src/utils/translatedMessages';

 
const req = require.context('../src', true, /\.stories.js$/);

function loadStories() {
  req.keys().forEach(filename => req(filename));
}

/* React-Intl */
addLocaleData([...en, ...fr, ...es, ...de, ...ja, ...ko, ...pt]);
 
// Provide your formats (optional)
const formats = {
    'en': {
            'date': {
                'year-only': {
                    'year': '2-digit',
                },
            },
        },
    'de': {
            'date': {
                'year-only': {
                    'year': 'numeric',
                },
            },
        },
};
 
const getFormats = (locale) => formats[locale];
const getMessages = (locale) => getTranslatedMessages(locale);
 
// Set intl configuration
setIntlConfig({
    locales: ['en','pt', 'de'],
    defaultLocale: 'en',
    getMessages,
    getFormats,
});
 
// Register decorator
addDecorator(withIntl);
 
configure(loadStories, module);