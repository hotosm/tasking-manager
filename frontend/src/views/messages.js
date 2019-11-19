import { defineMessages } from 'react-intl';

/**
 * Internationalized messages for use on header.
 */
export default defineMessages({
  pageNotFound: {
    id: 'notFound.page.title',
    defaultMessage: 'Page not found',
  },
  projectNotFound: {
    id: 'notFound.project.title',
    defaultMessage: 'Project {id} not found',
  },
  notFoundLead: {
    id: 'notFound.lead',
    defaultMessage: 'Check the URL or report this error.',
  },
  loginRequired: {
    id: 'loginPage.title',
    defaultMessage: 'Login or register an account',
  },
  profileSettings: {
    id: 'EmailVerification.link.profileSettings',
    defaultMessage: 'your profile settings',
  },
  emailVerified: {
    id: 'EmailVerification.status.verified',
    defaultMessage: 'Email confirmed successfully!',
  },
  verificationError: {
    id: 'EmailVerification.status.error',
    defaultMessage: 'Verification failed.',
  },
  verificationErrorExplanation: {
    id: 'EmailVerification.status.error.explanation',
    defaultMessage:
      'The verification of your email failed. Check if the URL on the browser matches with the URL sent to your email.',
  },
  emailVerifiedExplanation: {
    id: 'EmailVerification.status.verified.explanation',
    defaultMessage: 'Thanks for informing us your email address.',
  },
  successExtraLine: {
    id: 'EmailVerification.status.verified.explanation.extraLine',
    defaultMessage:
      'From now on, we will keep you updated on how you can make the difference by mapping on Tasking Manager. You can customize your notification preferences on {link}.',
  },
});
