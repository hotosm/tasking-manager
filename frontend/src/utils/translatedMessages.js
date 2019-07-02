import en from '../locales/en.json';
import pt from '../locales/pt.json';
import * as config from '../config';


const translatedMessages = {
  en: en,
  pt: pt
}


function getTranslatedMessages(locale) {
  return translatedMessages[locale] || translatedMessages[config.DEFAULT_LOCALE]
}

export default getTranslatedMessages;
