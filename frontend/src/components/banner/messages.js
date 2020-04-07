import { defineMessages } from 'react-intl';

/**
 * Internationalized messages for use on general components.
 */
export default defineMessages({
  aboutInfoCollect: {
    id: 'banner.title',
    defaultMessage: 'About the information we collect',
  },
  disagree: {
    id: 'banner.button.disagree',
    defaultMessage: 'I do not agree',
  },
  agree: {
    id: 'banner.button.agree',
    defaultMessage: 'I agree',
  },
  privacyPolicy: {
    id: 'banner.privacyPolicy',
    defaultMessage: 'privacy policy',
  },
  bannerText: {
    id: 'banner.text',
    defaultMessage:
      'We use cookies and similar technologies to recognize and analyze your visits, and measure traffic usage and activity. You can learn about how we use the data about your visit or information you provide reading our {link}. By clicking "I Agree", you consent to the use of cookies.',
  },
});
