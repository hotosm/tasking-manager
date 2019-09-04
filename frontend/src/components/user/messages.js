import { defineMessages } from 'react-intl';

/**
 * Internationalized messages for use on header.
 */
export default defineMessages({
  mapper: {
    id: 'user.mapper',
    defaultMessage: '{level} mapper',
  },
  nextLevel: {
    id: 'user.nextLevel',
    defaultMessage: '{changesets} / {nextLevelThreshold} changesets to {level}',
  },
  personalInfo: {
    id: 'user.personalInfo',
    defaultMessage: 'Personal Information',
  },
  name: {
    id: 'user.name',
    defaultMessage: 'Name',
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
  slackUsername: {
    id: 'user.slack',
    defaultMessage: 'Username on HOT Slack',
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
  defaultEditorDescription: {
    id: 'user.settings.default_editor.description',
    defaultMessage:
      'Select the default editor that you want to use when fixing tasks. By selecting this option you will be able to skip the editor selection dialog after selecting a task to map or validate.',
  },
  becomeValidator: {
    id: 'user.settings.become_validator',
    defaultMessage: 'Become a validator',
  },
  becomeValidatorDescription: {
    id: 'user.settings.become_validator.description',
    defaultMessage:
      "If you feel sure of your skills as a mapper and you are looking for a new challenge, apply for the validator role. If your application is successful you can then start to validate other mapper's tasks.",
  },
  mentions: {
    id: 'user.notifications.mentions',
    defaultMessage: 'Mentions',
  },
  mentionsDescription: {
    id: 'user.notifications.mentions.description',
    defaultMessage: "Every time you're mentioned on a comment, you get a notification.",
  },
  projectUpdates: {
    id: 'user.notifications.projects',
    defaultMessage: 'Project updates',
  },
  projectUpdatesDescription: {
    id: 'user.notifications.projects.description',
    defaultMessage: "You get a notification if any project you've contributed made progress.",
  },
  comments: {
    id: 'user.notifications.comments',
    defaultMessage: 'Comments',
  },
  commentsDescription: {
    id: 'user.notifications.comments.description',
    defaultMessage:
      "You get a notification every time someone comments on the project you've contributed to.",
  },
  apply: {
    id: 'user.settings.become_validator.button',
    defaultMessage: 'Apply',
  },
  welcomeTitle: {
    id: 'user.welcome.title',
    defaultMessage: 'Welcome to Tasking Manager!',
  },
  interestsTitle: {
    id: 'user.interests.title',
    defaultMessage: "Tell us about you and the kind of projects you're interested in.",
  },
  interestsLead: {
    id: 'user.interests.lead',
    defaultMessage:
      "We'll ask you to select causes of your interest because this will help us recommend the right projects for you.",
  },
  completenessTitle: {
    id: 'user.completeness.title',
    defaultMessage: 'Complete your profile',
  },
  completenessLead0: {
    id: 'user.completeness.lead.start',
    defaultMessage: 'Start filling your information!',
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
  howToMapBuildings: {
    id: 'user.help.card.howToMapBuildings',
    defaultMessage: 'How to map buildings?',
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
    defaultMessage: "Looks like you haven't mapped any task yet.",
  },
  firstProjectText2: {
    id: 'user.welcome.firstProject.text2',
    defaultMessage: "Fortunately, it's very easy to map one!",
  },
  firstProjectText3: {
    id: 'user.welcome.firstProject.text3',
    defaultMessage:
      'You can start mapping by selecting one of the project below, recommended for you.',
  },
  osmCardTitle: {
    id: 'user.osm.title',
    defaultMessage: 'OSM Details',
  },
  joinedOSM: {
    id: 'user.osm.joined',
    defaultMessage: 'Joined OSM',
  },
  totalChangesets: {
    id: 'user.osm.changesets',
    defaultMessage: 'Total changesets',
  },
  osmHistory: {
    id: 'user.osm.history.link',
    defaultMessage: 'Edit history',
  },
  osmProfile: {
    id: 'user.osm.profile.link',
    defaultMessage: 'OSM profile',
  },
  changePicture: {
    id: 'user.osm.changePicture.link',
    defaultMessage: 'Change picture',
  },
  osmHeatMap: {
    id: 'user.osm.heatMap.link',
    defaultMessage: 'Edit heat map',
  },
});
// It will be useful when we enable the placeholders
// placeholder: {
//   id: 'user.form.placeholder',
//   defaultMessage: 'Enter your {field}'
// },
// selectPlaceholder: {
//   id: 'user.form.select.placeholder',
//   defaultMessage: 'Select your {field}'
// },
// twitter: {
//   id: 'user.form.twitter',
//   defaultMessage: 'Twitter handle'
// },
// facebook: {
//   id: 'user.form.facebook',
//   defaultMessage: 'Facebook ID'
// },
// linkedin: {
//   id: 'user.form.linkedin',
//   defaultMessage: 'Linkedin ID'
// },
