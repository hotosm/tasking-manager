import { defineMessages } from 'react-intl';

/**
 * Internationalized messages for use on project cards.
 */
export default defineMessages({
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
    defaultMessage: ' Mapped',
  },
  percentValidated: {
    id: 'project.detail.percentValidated',
    defaultMessage: ' Validated',
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
  createBy: {
    id: 'project.detail.createdBy',
    defaultMessage: 'Created by {user}',
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
  addToFavorites: {
    id: 'project.detail.addToFavorites',
    defaultMessage: 'Add to Favorites',
  },
  removeFromFavorites: {
    id: 'project.detail.removeFromFavorites',
    defaultMessage: 'Remove from Favorites',
  },
  share: {
    id: 'project.detail.share',
    defaultMessage: 'Share',
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
    defaultMessage: '2. Map through OpenStreetMap',
  },
  submitYourWorkCardTitle: {
    id: 'project.detail.cards.submityourwork.title',
    defaultMessage: '3. Submit your Work',
  },
  selectATaskCardDescription: {
    id: 'project.detail.cards.selectATask.description',
    defaultMessage:
      'Projects are subdivided into a set of tasks managable in size and adapted to your skill level.',
  },
  mapThroughOSMCardDescription: {
    id: 'project.detail.cards.mapthroughosm.description',
    defaultMessage:
      'If you are new to mapping, we recommend checking the How It Works page before you start mapping.',
  },
  submitYourWorkCardDescription: {
    id: 'project.detail.cards.submityourwork.description',
    defaultMessage:
      "Submitting your work is cruicial. If you don't do it, it will not be merged into the project.",
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
    defaultMessage: 'Questions & Comments',
  },
  contributions: {
    id: 'project.detail.sections.contributions',
    defaultMessage: 'Contributions',
  },
  contributionsTimeline: {
    id: 'project.detail.sections.contributionsTimeline',
    defaultMessage: 'Contributions timeline',
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
});
