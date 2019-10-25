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
});
