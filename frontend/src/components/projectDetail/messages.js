import { defineMessages } from 'react-intl';

/**
 * Internationalized messages for use on project cards.
 */
export default defineMessages({
  projectCoordination: {
    id: 'project.detail.coordination',
    defaultMessage: 'This project is coordinated by {organisation}',
  },
  noProjectTeams: {
    id: 'project.detail.teams.empty',
    defaultMessage: "This project doesn't have any teams associated with.",
  },
  projectTotalContributors: {
    id: 'project.detail.contributorCount',
    defaultMessage: '{number} total contributors',
  },
  projectLastContribution: {
    id: 'project.detail.lastContribution',
    defaultMessage: 'Last contribution',
  },
  percentMapped: {
    id: 'project.detail.percentMapped',
    defaultMessage: 'Mapped',
  },
  percentValidated: {
    id: 'project.detail.percentValidated',
    defaultMessage: 'Validated',
  },
  projectPriorityURGENT: {
    id: 'project.detail.projectPriorityUrgent',
    defaultMessage: 'Urgent',
  },
  projectPriorityHIGH: {
    id: 'project.detail.projectPriorityHigh',
    defaultMessage: 'High',
  },
  projectPriorityMEDIUM: {
    id: 'project.detail.projectPriorityMedium',
    defaultMessage: 'Medium',
  },
  projectPriorityLOW: {
    id: 'project.detail.projectPriorityLow',
    defaultMessage: 'Low',
  },
  dueDateRelativeRemainingDays: {
    id: 'project.detail.dueDateLeft',
    defaultMessage: '{daysLeftHumanize} left',
  },
  createdBy: {
    id: 'project.createdBy',
    defaultMessage: '{id} | Created by {user}',
  },
  typesOfMapping: {
    id: 'project.detail.typesOfMapping',
    defaultMessage: 'Types of Mapping',
  },
  editor: {
    id: 'project.detail.editor',
    defaultMessage: 'Editor',
  },
  selectEditor: {
    id: 'project.detail.editor.select',
    defaultMessage: 'Select editor',
  },
  tasks: {
    id: 'project.detail.tasks',
    defaultMessage: 'Tasks',
  },
  instructions: {
    id: 'project.detail.instructions',
    defaultMessage: 'Instructions',
  },
  imagery: {
    id: 'project.detail.imagery',
    defaultMessage: 'Imagery',
  },
  customTMSLayer: {
    id: 'project.detail.imagery.tms',
    defaultMessage: 'Custom TMS Layer',
  },
  customWMSLayer: {
    id: 'project.detail.imagery.wms',
    defaultMessage: 'Custom WMS Layer',
  },
  customWMTSLayer: {
    id: 'project.detail.imagery.wmts',
    defaultMessage: 'Custom WMTS Layer',
  },
  contribute: {
    id: 'project.selectTask.footer.button.contribute',
    defaultMessage: 'Contribute',
  },
  readMore: {
    id: 'project.readMoreButton',
    defaultMessage: 'Read more',
  },
  readLess: {
    id: 'project.readLessButton',
    defaultMessage: 'Read less',
  },
  addToFavorites: {
    id: 'project.detail.addToFavorites',
    defaultMessage: 'Add to Favorites',
  },
  removeFromFavorites: {
    id: 'project.detail.removeFromFavorites',
    defaultMessage: 'Remove from Favorites',
  },
  noComments: {
    id: 'project.detail.questionsAndComments.none',
    defaultMessage:
      'There are currently no questions or comments on this project. Be the first to post one!',
  },
  post: {
    id: 'project.detail.questionsAndComments.button',
    defaultMessage: 'Post',
  },
  share: {
    id: 'project.detail.share',
    defaultMessage: 'Share',
  },
  team: {
    id: 'project.detail.team',
    defaultMessage: 'Team',
  },
  validationTeam: {
    id: 'project.detail.validation_team',
    defaultMessage: 'Validation team',
  },
  teamsAndPermissions: {
    id: 'project.detail.teams_permissions',
    defaultMessage: 'Teams & Permissions',
  },
  whoCanMap: {
    id: 'project.detail.mapping_permissions',
    defaultMessage: 'Who can map?',
  },
  whoCanValidate: {
    id: 'project.detail.validation_permissions',
    defaultMessage: 'Who can validate?',
  },
  zoomToTasks: {
    id: 'project.detail.zoomToTasks',
    defaultMessage: 'Zoom to tasks',
  },
  selectATaskCardTitle: {
    id: 'project.detail.cards.selectATask.title',
    defaultMessage: '1. Select a task',
  },
  mapThroughOSMCardTitle: {
    id: 'project.detail.cards.mapthroughosm.title',
    defaultMessage: '2. Map with OpenStreetMap',
  },
  submitYourWorkCardTitle: {
    id: 'project.detail.cards.submityourwork.title',
    defaultMessage: '3. Submit your work',
  },
  selectATaskCardDescription: {
    id: 'project.detail.cards.selectATask.description',
    defaultMessage:
      'Projects are divided into sets of smaller tasks and adapted to fit your skill level.',
  },
  mapThroughOSMCardDescription: {
    id: 'project.detail.cards.mapthroughosm.description',
    defaultMessage:
      'If you are new to mapping, we recommend checking the Learn page for instructions before you begin.',
  },
  submitYourWorkCardDescription: {
    id: 'project.detail.cards.submityourwork.description',
    defaultMessage: 'Submitting your work is crucial to make sure your data is saved.',
  },
  overview: {
    id: 'project.detail.sections.overview',
    defaultMessage: 'Overview',
  },
  howToContribute: {
    id: 'project.detail.sections.howToContribute',
    defaultMessage: 'How to contribute',
  },
  questionsAndComments: {
    id: 'project.detail.sections.questionsAndComments',
    defaultMessage: 'Questions and comments',
  },
  contributions: {
    id: 'project.detail.sections.contributions',
    defaultMessage: 'Contributions',
  },
  contributionsTimeline: {
    id: 'project.detail.sections.contributionsTimeline',
    defaultMessage: 'Contributions timeline',
  },
  viewInOsmcha: {
    id: 'project.detail.sections.contributions.osmcha',
    defaultMessage: 'Changesets in OSMCha',
  },
  contributors: {
    id: 'project.detail.sections.contributors',
    defaultMessage: 'Contributors',
  },
  relatedProjects: {
    id: 'project.detail.sections.relatedProjects',
    defaultMessage: 'Related projects',
  },
  timelineNotAvailable: {
    id: 'project.detail.sections.contributions.timelineError',
    defaultMessage: 'The timeline will be available when at least one task is mapped.',
  },
  date: {
    id: 'project.detail.visualisation.date',
    defaultMessage: 'Date',
  },
  validated: {
    id: 'project.detail.visualisation.validated',
    defaultMessage: 'Validated',
  },
  mapped: {
    id: 'project.detail.visualisation.mapped',
    defaultMessage: 'Mapped',
  },
  status_DRAFT: {
    id: 'project.status.draft',
    defaultMessage: 'Draft',
  },
  status_ARCHIVED: {
    id: 'project.status.archived',
    defaultMessage: 'Archived',
  },
  status_PUBLISHED: {
    id: 'project.status.published',
    defaultMessage: 'Published',
  },
  permissions_ANY: {
    id: 'project.permissions.any',
    defaultMessage: 'All users',
  },
  permissions_LEVEL: {
    id: 'project.permissions.level',
    defaultMessage: 'Users with intermediate or advanced level',
  },
  permissions_TEAMS: {
    id: 'project.permissions.teams',
    defaultMessage: '{team} members',
  },
  permissions_TEAMS_LEVEL: {
    id: 'project.permissions.teamsAndLevel',
    defaultMessage: 'Intermediate and advanced {team} members',
  },
});
