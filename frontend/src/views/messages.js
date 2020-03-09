import { defineMessages } from 'react-intl';

/**
 * Internationalized messages for use on views.
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
  sectionNotAllowed: {
    id: 'management.forbiddenAccess.title',
    defaultMessage: 'You are not allowed to access the management area.',
  },
  loginRequired: {
    id: 'loginPage.title',
    defaultMessage: 'Login or register an account',
  },
  manageUsers: {
    id: 'management.users.title',
    defaultMessage: 'Manage users',
  },
  enterUsername: {
    id: 'management.users.username_enter',
    defaultMessage: 'Search by username',
  },
  totalUsers: {
    id: 'management.users.total_users',
    defaultMessage: 'Total number of users: {total}',
  },
  newOrganisation: {
    id: 'teamsAndOrgs.management.organisation.creation',
    defaultMessage: 'Create new organization',
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
    defaultMessage: 'Create organization',
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
  cancelRequest: {
    id: 'teamsAndOrgs.management.button.cancel_request',
    defaultMessage: 'Cancel request',
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
    defaultMessage: 'Manage organization',
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
  manageCategory: {
    id: 'management.category.manage',
    defaultMessage: 'Manage category',
  },
  categoryInfo: {
    id: 'management.interest.title',
    defaultMessage: 'Category information',
  },
  newCategory: {
    id: 'management.category.creation',
    defaultMessage: 'Create new category',
  },
  createCategory: {
    id: 'management.category.button.create',
    defaultMessage: 'Create category',
  },
  noLockedTasksMessage: {
    id: 'taskAction.messages.error.no_locked_tasks.text',
    defaultMessage:
      "You don't have any locked tasks. Access the Project #{currentProject} to select a task to map.",
  },
  goToProjectButton: {
    id: 'taskAction.go_to_project.button',
    defaultMessage: 'Go to Project #{project}',
  },
  profileSettings: {
    id: 'EmailVerification.link.profileSettings',
    defaultMessage: 'Your profile settings',
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
    defaultMessage: 'Thanks for providing your email address.',
  },
  successExtraLine: {
    id: 'EmailVerification.status.verified.explanation.extraLine',
    defaultMessage:
      'From now on, we will keep you updated on how you can make the difference by mapping on Tasking Manager. You can customize your notification preferences on {link}.',
  },
  about: {
    id: 'pages.about.title',
    defaultMessage: 'About Tasking Manager',
  },
  learn: {
    id: 'pages.learn.title',
    defaultMessage: 'Learn',
  },
  contactUs: {
    id: 'pages.concact.title',
    defaultMessage: 'Contact Us',
  },
  contactUsThanksTitle: {
    id: 'home.contact.thanksTitle',
    defaultMessage: 'Thank You!',
  },
  contactUsThanksError: {
    id: 'home.contact.thanksError',
    defaultMessage: 'One moment, there was a problem sending your message.',
  },
  contactUsThanksBody: {
    id: 'home.contact.thanksBody',
    defaultMessage: "You'll be hearing from us soon!",
  },
  contactUsThanksProceed: {
    id: 'home.contact.thanksProceed',
    defaultMessage: 'Proceed',
  },
  howToValidate: {
    id: 'pages.learn.sections.howToValidate',
    defaultMessage: 'How to validate',
  },
  howToMap: {
    id: 'pages.learn.sections.howToMap',
    defaultMessage: 'How to map',
  },
  tmDescription: {
    id: 'pages.about.description',
    defaultMessage:
      'The Tasking Manager is a mapping tool designed and built for the coordination of volunteers and the organization of groups for collaborative mapping in OpenStreetMap.',
  },
  osmDescription: {
    id: 'pages.about.OpenStreetMap.description',
    defaultMessage:
      '{osmLink} is the community-driven free and editable map of the world, supported by the not-for-profit OpenStreetMap Foundation. Read more on the {osmWikiLink} or join the discussion with your local OSM community.',
  },
  howItWorks: {
    id: 'pages.about.howItWorks.title',
    defaultMessage: 'How does it work?',
  },
  howItWorksPart1: {
    id: 'pages.about.howItWorks.description.part_1',
    defaultMessage:
      'The Tasking Manager allows you to divide up a mapping project into smaller tasks that can be completed rapidly with many people working on the same overall area. It shows which areas need to be mapped and which areas need to be reviewed for quality assurance.',
  },
  floss: {
    id: 'pages.about.floss.title',
    defaultMessage: 'Free and Open Source Software',
  },
  flossDescription: {
    id: 'pages.about.floss.description',
    defaultMessage:
      'The Tasking Manager has been built by the {hotLink} and it is  Free and Open Source software. Please feel free to report issues and contribute.',
  },
  repositoryLink: {
    id: 'pages.about.floss.repository_link',
    defaultMessage: 'The {code} is available for you.',
  },
  appCode: {
    id: 'pages.about.floss.application_code',
    defaultMessage: 'application code',
  },
  editProject: {
    id: 'pages.edit_project.title',
    defaultMessage: 'Edit project',
  },
  save: {
    id: 'pages.edit_project.buttons.save',
    defaultMessage: 'Save',
  },
  goToProjectPage: {
    id: 'pages.edit_project.buttons.go_to_project',
    defaultMessage: 'Go to project page',
  },
  updateSuccess: {
    id: 'pages.edit_project.actions.update.success',
    defaultMessage: 'Project updated successfully.',
  },
  updateError: {
    id: 'pages.edit_project.actions.update.error',
    defaultMessage: 'Project update failed: {error}',
  },
  projectEditSection_description: {
    id: 'pages.edit_project.sections.description',
    defaultMessage: 'Description',
  },
  projectEditSection_instructions: {
    id: 'pages.edit_project.sections.instructions',
    defaultMessage: 'Instructions',
  },
  projectEditSection_metadata: {
    id: 'pages.edit_project.sections.metadata',
    defaultMessage: 'Metadata',
  },
  projectEditSection_priority_areas: {
    id: 'pages.edit_project.sections.priority_areas',
    defaultMessage: 'Priority areas',
  },
  projectEditSection_imagery: {
    id: 'pages.edit_project.sections.imagery',
    defaultMessage: 'Imagery',
  },
  projectEditSection_permissions: {
    id: 'pages.edit_project.sections.permissions',
    defaultMessage: 'Permissions',
  },
  projectEditSection_settings: {
    id: 'pages.edit_project.sections.settings',
    defaultMessage: 'Settings',
  },
  projectEditSection_actions: {
    id: 'pages.edit_project.sections.actions',
    defaultMessage: 'Actions',
  },
  projectEditSection_custom_editor: {
    id: 'pages.edit_project.sections.custom_editor',
    defaultMessage: 'Custom Editor',
  },
});
