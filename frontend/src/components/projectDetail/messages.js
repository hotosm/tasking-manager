import { defineMessages } from 'react-intl';

/**
 * Internationalized messages for use on project cards.
 */
export default defineMessages({
  noProjectTeams: {
    id: 'project.detail.teams.empty',
    defaultMessage: "This project doesn't have any teams associated with.",
  },
  coordination: {
    id: 'project.detail.coordination',
    defaultMessage: 'Coordination',
  },
  projectCoordination: {
    id: 'project.detail.coordination.description',
    defaultMessage: 'This project is coordinated by {organisation} and was created by {user}.',
  },
  createdBy: {
    id: 'project.detail.createdBy',
    defaultMessage: 'Project created by {user}.',
  },
  noProjectContributors: {
    id: 'project.detail.contributorCount.zero',
    defaultMessage: 'No contributors yet',
  },
  projectTotalContributors: {
    id: 'project.detail.contributorCount',
    defaultMessage: '{number, plural, one {<b>#</b> contributor} other {<b>#</b> contributors}}',
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
  typesOfMapping: {
    id: 'project.detail.typesOfMapping',
    defaultMessage: 'Types of Mapping',
  },
  private: {
    id: 'project.detail.private',
    defaultMessage: 'Private',
  },
  editProject: {
    id: 'project.detail.editProject',
    defaultMessage: 'Edit project',
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
  loginTocomment: {
    id: 'project.detail.questionsAndComments.login',
    defaultMessage: 'Log in to be able to post comments.',
  },
  errorLoadingComments: {
    id: 'project.detail.questionsAndComments.fetching.error',
    defaultMessage: 'An error occured while loading questions and comments.',
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
  author: {
    id: 'project.detail.author',
    defaultMessage: 'Author',
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
  dueDateTooltip: {
    id: 'project.detail.sections.overview.dueDate',
    defaultMessage: 'Ideal date to complete the project',
  },
  description: {
    id: 'project.detail.sections.description',
    defaultMessage: 'Description',
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
  downloadOsmData: {
    id: 'project.detail.sections.downloadOsmData',
    defaultMessage: 'Download OSM Data',
  },
  errorDownloadOsmData: {
    id: 'project.detail.sections.errorDownloadOsmData',
    defaultMessage: 'Data Extraction Unavailable',
  },
  errorDownloadOsmDataDescription: {
    id: 'project.detail.sections.errorDownloadOsmDataDescription',
    defaultMessage:
      'The data extract you are attempting to download is currently inactive or unavailable. Please ensure that the extract is active and try again later.',
  },
  viewInOsmcha: {
    id: 'project.detail.sections.contributions.osmcha',
    defaultMessage: 'Changesets in OSMCha',
  },
  live: {
    id: 'project.detail.sections.contributions.live',
    defaultMessage: 'Live',
  },
  liveMonitoring: {
    id: 'project.detail.sections.contributions.liveMonitoring',
    defaultMessage: 'Live monitoring',
  },
  changesets: {
    id: 'project.detail.sections.contributions.changesets',
    defaultMessage: 'Changesets',
  },
  contributors: {
    id: 'project.detail.sections.contributors',
    defaultMessage: 'Contributors',
  },
  similarProjects: {
    id: 'project.detail.sections.similarProjects',
    defaultMessage: 'Similar projects',
  },
  contributorsError: {
    id: 'project.detail.sections.contributors.error',
    defaultMessage: 'An error occured while loading contributors',
  },
  timelineNotAvailable: {
    id: 'project.detail.sections.contributions.timelineError',
    defaultMessage: 'A timeline is going to be available after the first task has been mapped.',
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
  downloadProjectAOI: {
    id: 'projects.data.download.aoi',
    defaultMessage: 'Download AOI',
  },
  downloadTaskGrid: {
    id: 'projects.data.download.taskGrid',
    defaultMessage: 'Download Tasks Grid',
  },
  moreStats: {
    id: 'projects.link.stats',
    defaultMessage: 'More statistics',
  },
  mappedTasks: {
    id: 'projects.stats.mapped',
    defaultMessage: 'Mapped tasks',
  },
  validatedTasks: {
    id: 'projects.stats.validated',
    defaultMessage: 'Validated tasks',
  },
  shareMessage: {
    id: 'project.share.twitter',
    defaultMessage: 'Contribute mapping the project #{id} on {site}',
  },
  postOnFacebook: {
    id: 'project.share.facebook',
    defaultMessage: 'Post on Facebook',
  },
  shareOnLinkedIn: {
    id: 'project.share.linkedin',
    defaultMessage: 'Share on LinkedIn',
  },
  inaccessibleProjectTitle: {
    id: 'project.inaccessible.title',
    defaultMessage: "You don't have permission to access this project",
  },
  inaccessibleProjectDescription: {
    id: 'project.inaccessible.description',
    defaultMessage: 'Please contact the project manager to request access.',
  },
  exploreOtherProjects: {
    id: 'project.inaccessible.exploreOtherProjects',
    defaultMessage: 'Explore other projects',
  },
  noSimilarProjectsFound: {
    id: 'project.noSimilarProjectsFound',
    defaultMessage: 'Could not find any similar projects for this project',
  },
});
