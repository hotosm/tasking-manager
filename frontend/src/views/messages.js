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
  newOrganisation: {
    id: 'teamsAndOrgs.management.organisation.creation',
    defaultMessage: 'Create new organisation',
  },
  newTeam: {
    id: 'teamsAndOrgs.management.team.creation',
    defaultMessage: 'Create new team',
  },
  newCampaign: {
    id: 'teamsAndOrgs.management.campaign.creation',
    defaultMessage: 'Create new campaign',
  },
  createOrganisation: {
    id: 'teamsAndOrgs.management.organisation.button.create',
    defaultMessage: 'Create organisation',
  },
  createTeam: {
    id: 'teamsAndOrgs.management.team.button.create',
    defaultMessage: 'Create team',
  },
  createCampaign: {
    id: 'teamsAndOrgs.management.campaign.button.create',
    defaultMessage: 'Create campaign',
  },
  myTeams: {
    id: 'teamsAndOrgs.management.button.my_teams',
    defaultMessage: 'My teams',
  },
  joinTeam: {
    id: 'teamsAndOrgs.management.button.join_team',
    defaultMessage: 'Join team',
  },
  leaveTeam: {
    id: 'teamsAndOrgs.management.button.leave_team',
    defaultMessage: 'Leave team',
  },
  cancel: {
    id: 'teamsAndOrgs.management.button.cancel',
    defaultMessage: 'Cancel',
  },
  manageOrganisation: {
    id: 'teamsAndOrgs.management.organisation.manage',
    defaultMessage: 'Manage organisation',
  },
  manageTeam: {
    id: 'teamsAndOrgs.management.team.manage',
    defaultMessage: 'Manage team',
  },
  manageCampaign: {
    id: 'teamsAndOrgs.management.campaign.manage',
    defaultMessage: 'Manage campaign',
  },
  teamInfo: {
    id: 'teamsAndOrgs.management.titles.team_information',
    defaultMessage: 'Team information',
  },
  campaignInfo: {
    id: 'teamsAndOrgs.management.titles.campaign_information',
    defaultMessage: 'Campaign information',
  },
  noLockedTasksMessage: {
    id: 'taskAction.messages.error.no_locked_tasks.text',
    defaultMessage: "You don't have any locked tasks. Access the Project #{currentProject} to select a task to map.",
  },
  goToProjectButton: {
    id: 'taskAction.go_to_project.button',
    defaultMessage: 'Go to Project #{project}',
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
  about: {
    id: 'pages.about.title',
    defaultMessage:
      'About Tasking Manager',
  },
  learn: {
    id: 'pages.learn.title',
    defaultMessage:
      'Learn',
  },
  contactUs: {
    id: 'pages.learn.title',
    defaultMessage:
      'Contact Us',
  }, 
  contactUsThanksTitle: {
    id: 'home.contact.thanksTitle',
    defaultMessage: 'Thank You!'
  },
  contactUsThanksError: {
    id: 'home.contact.thanksError',
    defaultMessage: 'One moment, there was a problem sending your message.'
  },
  contactUsThanksBody: {
    id: 'home.contact.thanksBody',
    defaultMessage: 'You\'ll be hearing from us soon!'
  },
  contactUsThanksProceed: {
    id: 'home.contact.thanksProceed',
    defaultMessage: 'Proceed'
  },
  howToValidate: {
    id: 'pages.learn.sections.howToValidate',
    defaultMessage:
      'How to validate',
  },
  howToMap: {
    id: 'pages.learn.sections.howToMap',
    defaultMessage:
      'How to map',
  },
  tmDescription: {
    id: 'pages.about.description',
    defaultMessage:
      'Tasking Manager is a mapping tool designed and built for the coordination of volunteers and the organization of groups for collaborative mapping in OpenStreetMap.',
  },
  osmDescription: {
    id: 'pages.about.OpenStreetMap.description',
    defaultMessage:
      '{osmLink} is the community-driven free and editable map of the world, supported by the not-for-profit OpenStreetMap Foundation. Read more on the {osmWikiLink} or join the discussion with your local OSM community.',
  },
  howItWorks: {
    id: 'pages.about.howItWorks.title',
    defaultMessage:
      'How does it work?',
  },
  howItWorksPart1: {
    id: 'pages.about.howItWorks.description.part_1',
    defaultMessage:
      'The Tasking Manager allows to divide up a mapping project into smaller tasks that can be completed rapidly with many people working on the same overall area. It shows which areas need to be mapped and which areas need to be reviewed for quality assurance.',
  },
  howItWorksPart2: {
    id: 'pages.about.howItWorks.description.part_2',
    defaultMessage:
      'This approach allows the distribution of tasks to many individual mappers in the context of emergency or other humanitarian mapping scenario. It also allows monitoring the overall project progress and helps improve the consistency of the mapping (e.g., elements to cover, specific tags to use, etc.).',
  },
  floss: {
    id: 'pages.about.floss.title',
    defaultMessage:
      'Free and Open Source Software',
  },
  flossDescription: {
    id: 'pages.about.floss.description',
    defaultMessage:
      'The Tasking Manager is Free and Open Source software. Please feel free to report issues and contribute.',
  },
  repositoryLink: {
    id: 'pages.about.floss.repository_link',
    defaultMessage:
      'The {code} is available for you.',
  },
  appCode: {
    id: 'pages.about.floss.application_code',
    defaultMessage:
      'application code',
  },
});
