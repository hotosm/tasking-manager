import { defineMessages } from 'react-intl';

/**
 * Internationalized messages for use on project cards.
 */
export default defineMessages({
  projectTotalContributors: {
    id: 'project.card.contributorCount',
    defaultMessage: '{number} total contributors',
  },
  projectLastContribution: {
    id: 'project.card.lastContribution',
    defaultMessage: 'Last contribution',
  },
  percentMapped: {
    id: 'project.card.percentMapped',
    defaultMessage: ' Mapped',
  },
  percentValidated: {
    id: 'project.card.percentValidated',
    defaultMessage: ' Validated',
  },
  projectPriorityURGENT: {
    id: 'project.card.projectPriorityUrgent',
    defaultMessage: 'Urgent',
  },
  projectPriorityHIGH: {
    id: 'project.card.projectPriorityHigh',
    defaultMessage: 'High',
  },
  projectPriorityMEDIUM: {
    id: 'project.card.projectPriorityMedium',
    defaultMessage: 'Medium',
  },
  projectPriorityLOW: {
    id: 'project.card.projectPriorityLow',
    defaultMessage: 'Low',
  },
  dueDateRelativeRemainingDays: {
    id: 'project.card.dueDateLeft',
    defaultMessage: '{daysLeftHumanize} left',
  },
  createBy: {
    id: 'project.createdBy',
    defaultMessage: 'Created by {user}',
  },
  typesOfMapping: {
    id: 'project.typesOfMapping',
    defaultMessage: 'Types of Mapping',
  },
  editor: {
    id: 'project.editor',
    defaultMessage: 'Editor',
  },
  selectEditor: {
    id: 'project.editor.select',
    defaultMessage: 'Select editor',
  },
  tasks: {
    id: 'project.tasks',
    defaultMessage: 'Tasks',
  },
  instructions: {
    id: 'project.instructions',
    defaultMessage: 'Instructions',
  },
  imagery: {
    id: 'project.imagery',
    defaultMessage: 'Imagery',
  },
  customTMSLayer: {
    id: 'project.imagery.tms',
    defaultMessage: 'Custom TMS Layer',
  },
  customWMSLayer: {
    id: 'project.imagery.wms',
    defaultMessage: 'Custom WMS Layer',
  },
  customWMTSLayer: {
    id: 'project.imagery.wmts',
    defaultMessage: 'Custom WMTS Layer',
  },
  contribute: {
    id: 'project.selectTask.footer.button.contribute',
    defaultMessage: 'Contribute',
  },
  mapRandomTask: {
    id: 'project.selectTask.footer.button.mapRandomTask',
    defaultMessage: 'Map random task',
  },
  validateRandomTask: {
    id: 'project.selectTask.footer.button.validateRandomTask',
    defaultMessage: 'Validate random task',
  },
  readMore: {
    id: 'project.readMoreButton',
    defaultMessage: 'Read more'
  },
  addToFavorites: {
    id: 'project.detail.addToFavorites',
    defaultMessage: 'Add to Favorites'
  },
  share: {
    id: 'project.detail.share',
    defaultMessage: 'Share'
  },
  countrymap: {
    id: 'project.detail.countrymap',
    defaultMessage: 'Country Map'
  },
  taskmap: {
    id: 'project.detail.countrymap',
    defaultMessage: 'Task Map'
  },
  selectATaskCardTitle: {
    id: 'project.detail.cards.selectATask.title',
    defaultMessage: '1. Select a task'
  },
  mapThroughOSMCardTitle: {
    id: 'project.detail.cards.mapthroughosm.title',
    defaultMessage: '2. Map through OpenStreetMap'
  },
  submitYourWorkCardTitle: {
    id: 'project.detail.cards.submityourwork.title',
    defaultMessage: '3. Submit your Work'
  },
  selectATaskCardDescription: {
    id: 'project.detail.cards.selectATask.description',
    defaultMessage: 'Projects are subdivided into a set of tasks managable in size and adapted to your skill level'
  },
  mapThroughOSMCardDescription: {
    id: 'project.detail.cards.mapthroughosm.description',
    defaultMessage: 'If you are new to mapping, we recommend checking the How It Works page before you start mapping.'
  },
  submitYourWorkCardDescription: {
    id: 'project.detail.cards.submityourwork.description',
    defaultMessage: "Submitting your work is cruicial. If you don't do it, it will not be merged into the project."
  },
});
