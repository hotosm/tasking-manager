import { defineMessages } from 'react-intl';

/**
 * Internationalized messages for use on user components.
 */
export default defineMessages({
  nextLevel: {
    id: 'user.nextLevel',
    defaultMessage: '{changesets} / {nextLevelThreshold} changesets to {level}',
  },
  personalInfo: {
    id: 'user.personalInfo',
    defaultMessage: 'Personal information',
  },
  name: {
    id: 'user.name',
    defaultMessage: 'Name',
  },
  organisations: {
    id: 'user.organisations',
    defaultMessage: 'Organizations',
  },
  city: {
    id: 'user.city',
    defaultMessage: 'City',
  },
  country: {
    id: 'user.country',
    defaultMessage: 'Country',
  },
  email: {
    id: 'user.email',
    defaultMessage: 'Email',
  },
  gender: {
    id: 'user.gender',
    defaultMessage: 'Gender',
  },
  female: {
    id: 'user.gender.female',
    defaultMessage: 'Female',
  },
  male: {
    id: 'user.gender.male',
    defaultMessage: 'Male',
  },
  preferNotToSay: {
    id: 'user.gender.preferNotToSay',
    defaultMessage: 'Prefer not to say',
  },
  selfDescribe: {
    id: 'user.gender.selfDescribe',
    defaultMessage: 'Prefer to self-describe:',
  },
  genderPrivacy: {
    id: 'user.gender.privacy',
    defaultMessage:
      'Your gender information will be used only for statistics purposes and will not be exposed to other users.',
  },
  emailPrivacy: {
    id: 'user.email.privacy',
    defaultMessage:
      'Your email address will be used only to send you notifications and updates about Tasking Manager. It will not be shared with other users or organizations.',
  },
  slackUsername: {
    id: 'user.slack',
    defaultMessage: 'Username on {org} Slack',
  },
  osmChaUsername: {
    id: 'user.osmCha',
    defaultMessage: 'Changesets on OSMCha',
  },
  urlDetectedError: {
    id: 'user.personalInfo.error',
    defaultMessage: 'Type only your username, not the URL.',
  },
  save: {
    id: 'user.form.save',
    defaultMessage: 'Save',
  },
  settings: {
    id: 'user.settings.title',
    defaultMessage: 'Settings',
  },
  notifications: {
    id: 'user.notifications.title',
    defaultMessage: 'Notifications',
  },
  expertMode: {
    id: 'user.settings.expert_mode',
    defaultMessage: 'Expert mode',
  },
  expertModeDescription: {
    id: 'user.settings.expert_mode.description',
    defaultMessage:
      'Expert mode makes advanced and experimental features available. Most users should leave this off.',
  },
  defaultEditor: {
    id: 'user.settings.default_editor',
    defaultMessage: 'Default editor',
  },
  selectDefaultEditor: {
    id: 'user.settings.select_default_editor',
    defaultMessage: 'Select default editor',
  },
  defaultEditorDescription: {
    id: 'user.settings.default_editor.description',
    defaultMessage:
      'Select the default editor you want to use when mapping tasks. By selecting a default option, you will not need to select an editor each time you map.',
  },
  language: {
    id: 'user.settings.language',
    defaultMessage: 'Language',
  },
  languageDescription: {
    id: 'user.settings.language.description',
    defaultMessage:
      'Define your preferred language. It will also affect the language of the maps you see on Tasking Manager.',
  },
  becomeValidator: {
    id: 'user.settings.become_validator',
    defaultMessage: 'Become a validator',
  },
  becomeValidatorDescription: {
    id: 'user.settings.become_validator.description',
    defaultMessage:
      'Validators check the quality of map edits completed and provide feedback for mappers on how to improve. If you are an experienced mapper, apply to become a validator.',
  },
  mentions: {
    id: 'user.notifications.mentions',
    defaultMessage: 'Mentions emails',
  },
  mentionsDescription: {
    id: 'user.notifications.mentions.description',
    defaultMessage: 'Receive an email every time your username is mentioned on a comment.',
  },
  teamUpdates: {
    id: 'user.notifications.teams',
    defaultMessage: 'Team announcements emails',
  },
  teamUpdatesDescription: {
    id: 'user.notifications.teams.description',
    defaultMessage: 'Receive emails with announcements sent by team managers.',
  },
  projectUpdates: {
    id: 'user.notifications.projects',
    defaultMessage: 'Project updates',
  },
  taskUpdates: {
    id: 'user.notifications.tasks',
    defaultMessage: 'Tasks validation emails',
  },
  required: {
    id: 'user.settings.required',
    defaultMessage: 'Required fields',
  },
  projectUpdatesDescription: {
    id: 'user.notifications.projects.description',
    defaultMessage: 'You get a notification when a project you have contributed to makes progress.',
  },
  taskUpdatesDescription: {
    id: 'user.notifications.task.description',
    defaultMessage: 'Receive an email when a task you have contributed to is validated.',
  },
  questionsAndComments: {
    id: 'user.notifications.questionsAndComments',
    defaultMessage: 'Questions and comments',
  },
  questionsAndCommentsDescription: {
    id: 'user.notifications.questionsAndComments.description',
    defaultMessage:
      "Receive a notification every time someone posts in the 'Questions and comments' section of the projects you have contributed to or created.",
  },
  taskComments: {
    id: 'user.notifications.taskComments',
    defaultMessage: 'Task comments',
  },
  taskCommentsDescription: {
    id: 'user.notifications.taskComments.description',
    defaultMessage:
      'Receive a notification every time someone posts a comment on the tasks you have contributed to.',
  },
  learnHow: {
    id: 'user.settings.become_validator.button',
    defaultMessage: 'Learn how',
  },
  welcomeTitle: {
    id: 'user.welcome.title',
    defaultMessage: 'Welcome to Tasking Manager!',
  },
  interestsUpdateSuccess: {
    id: 'user.interests.update.success',
    defaultMessage: 'Interests updated successfully.',
  },
  interestsUpdateError: {
    id: 'user.interests.update.error',
    defaultMessage: 'Interests update failed.',
  },
  interestsH3: {
    id: 'user.interests.h3',
    defaultMessage: 'Interests',
  },
  interestsLead: {
    id: 'user.interests.lead',
    defaultMessage: 'Select causes of interest to help us recommend the right projects for you.',
  },
  completenessTitle: {
    id: 'user.completeness.title',
    defaultMessage: 'Complete your profile',
  },
  completenessLead0: {
    id: 'user.completeness.lead.start',
    defaultMessage: 'Please provide your information',
  },
  completenessLead1: {
    id: 'user.completeness.lead.high',
    defaultMessage: "You're almost done!",
  },
  completenessLead2: {
    id: 'user.completeness.lead.complete',
    defaultMessage: 'Your profile is complete!',
  },
  completenessButton: {
    id: 'user.completeness.button',
    defaultMessage: 'Complete my profile',
  },
  helpTitle: {
    id: 'user.help.card.title',
    defaultMessage: 'Need help?',
  },
  howToMap: {
    id: 'user.help.card.howToMap',
    defaultMessage: 'How to map?',
  },
  quickStart: {
    id: 'user.help.card.quickStart',
    defaultMessage: 'Quickstart guide',
  },
  whatIsOSM: {
    id: 'user.help.card.whatIsOSM',
    defaultMessage: 'What is OpenStreetMap?',
  },
  firstProjectTitle: {
    id: 'user.welcome.firstProject.title',
    defaultMessage: 'Contribute to your first project',
  },
  firstProjectText1: {
    id: 'user.welcome.firstProject.text1',
    defaultMessage: "Looks like you haven't mapped any tasks yet.",
  },
  firstProjectText2: {
    id: 'user.welcome.firstProject.text2',
    defaultMessage: "Fortunately, it's very easy to map one!",
  },
  firstProjectText3: {
    id: 'user.welcome.firstProject.text3',
    defaultMessage:
      'You can start mapping by choosing one of the projects below, recommended just for you!',
  },
  osmCardTitle: {
    id: 'user.osm.title',
    defaultMessage: 'OpenStreetMap details',
  },
  joinedOSM: {
    id: 'user.osm.joined',
    defaultMessage: 'Joined OpenStreetMap',
  },
  totalChangesets: {
    id: 'user.osm.changesets',
    defaultMessage: 'Total changesets',
  },
  osmHistory: {
    id: 'user.osm.history.link',
    defaultMessage: 'Changesets history',
  },
  editOSMProfile: {
    id: 'user.osm.profile.edit.link',
    defaultMessage: 'Edit OpenStreetMap profile',
  },
  apiKey: {
    id: 'user.settings.apiKey.title',
    defaultMessage: 'API Key',
  },
  apiDocs: {
    id: 'user.settings.apiDocs',
    defaultMessage: 'API Documentation',
  },
  apiKeyDescription: {
    id: 'user.settings.apiKey.description',
    defaultMessage:
      'With this API Key, you can authenticate and use all the resources of the Tasking Manager API. For more details, check out the {link}.',
  },
  emailConfirmationMsg: {
    id: 'user.settings.email.confirmation',
    defaultMessage: 'Please check your email account in order to confirm your email address.',
  },
  emailResend: {
    id: 'user.settings.email.resend',
    defaultMessage: 'Resend validation email',
  },
  myProjects: {
    id: 'users.detail.MyProjects',
    defaultMessage: 'My projects',
  },
  myTasks: {
    id: 'users.detail.MyTasks',
    defaultMessage: 'My tasks',
  },
  myTeams: {
    id: 'users.detail.MyTeams',
    defaultMessage: 'My teams',
  },
  myContribs: {
    id: 'users.detail.MyContribs',
    defaultMessage: 'My contributions',
  },
  myStats: {
    id: 'users.detail.MyStats',
    defaultMessage: 'My stats',
  },
  enterUsername: {
    id: 'users.list.search.username',
    defaultMessage: 'Search by username',
  },
  totalUsers: {
    id: 'users.list.total',
    defaultMessage: 'Total number of users: {total}',
  },
  setRole: {
    id: 'users.list.actions.setRole',
    defaultMessage: 'Set role',
  },
  setLevel: {
    id: 'users.list.actions.setLevel',
    defaultMessage: 'Set mapper level',
  },
  userAttributeUpdationSuccess: {
    id: 'users.list.attribute.updation.success',
    defaultMessage:
      'User {attribute, select, role {role} mapperLevel {mapper level} other {attribute}} updated',
  },
  userAttributeUpdationFailure: {
    id: 'users.list.attribute.updation.failure',
    defaultMessage:
      'Failed to update user {attribute, select, role {role} mapperLevel {mapper level} other {attribute}}. Please try again.',
  },
  mapperLevelALL: {
    id: 'user.mapper_level.options.all',
    defaultMessage: 'All levels',
  },
  mapperLevelADVANCED: {
    id: 'user.mapper_level.options.advanced',
    defaultMessage: 'Advanced',
  },
  mapperLevelINTERMEDIATE: {
    id: 'user.mapper_level.options.intermediate',
    defaultMessage: 'Intermediate',
  },
  mapperLevelBEGINNER: {
    id: 'user.mapper_level.options.beginner',
    defaultMessage: 'Beginner',
  },
  userRoleALL: {
    id: 'user.user_role.options.all',
    defaultMessage: 'All roles',
  },
  userRoleADMIN: {
    id: 'user.user_role.options.admin',
    defaultMessage: 'Admin',
  },
  userRoleREAD_ONLY: {
    id: 'user.user_role.options.read_only',
    defaultMessage: 'Blocked',
  },
  userRoleMAPPER: {
    id: 'user.user_role.options.mapper',
    defaultMessage: 'Mapper',
  },
  clearFilters: {
    id: 'user.nav.clearFilters',
    defaultMessage: 'Clear filters',
  },
});
