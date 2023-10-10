import { defineMessages } from 'react-intl';

export default defineMessages({
  projectStatsTitle: {
    id: 'projects.stats.title',
    defaultMessage: 'Time statistics',
  },
  projectStatsError: {
    id: 'project.stats.timeline.fetching.error',
    defaultMessage: 'An error occured while loading project stats',
  },
  averageMappingTime: {
    id: 'projects.stats.average_mapping_time',
    defaultMessage: 'Average mapping time per Task',
  },
  averageValidationTime: {
    id: 'projects.stats.average_validation_time',
    defaultMessage: 'Average validation time per Task',
  },
  timeToFinishMapping: {
    id: 'projects.stats.time_finish_mapping',
    defaultMessage: 'Estimated time to finish mapping',
  },
  timeToFinishValidating: {
    id: 'projects.stats.time_finish_validation',
    defaultMessage: 'Estimated time to finish validation',
  },
  status: {
    id: 'project.stats.tasks.tatus',
    defaultMessage: 'Tasks by status',
  },
  tasksToMap: {
    id: 'project.stats.tasks.needs_mapping',
    defaultMessage: 'Tasks to map',
  },
  tasksToValidate: {
    id: 'project.stats.tasks.needs_validation',
    defaultMessage: 'Tasks to validate',
  },
  contributors: {
    id: 'project.stats.contributors.title',
    defaultMessage: 'Contributors',
  },
  totalContributors: {
    id: 'project.stats.contributors.total',
    defaultMessage: 'Total contributors',
  },
  usersExperience: {
    id: 'project.stats.experience.title',
    defaultMessage: 'Users by experience on Tasking Manager',
  },
  usersLevel: {
    id: 'project.stats.level.title',
    defaultMessage: 'Users by level',
  },
  mappers: {
    id: 'project.stats.contributors.mappers',
    defaultMessage: 'Mappers',
  },
  validators: {
    id: 'project.stats.contributors.validators',
    defaultMessage: 'Validators',
  },
  lessThan1MonthExp: {
    id: 'project.stats.contributors.experience.1',
    defaultMessage: 'Less than 1 month',
  },
  lessThan3MonthExp: {
    id: 'project.stats.contributors.experience.3',
    defaultMessage: '1 to 3 months',
  },
  lessThan6MonthExp: {
    id: 'project.stats.contributors.experience.6',
    defaultMessage: '3 to 6 months',
  },
  lessThan12MonthExp: {
    id: 'project.stats.contributors.experience.12',
    defaultMessage: '6 to 12 months',
  },
  moreThan1YearExp: {
    id: 'project.stats.contributors.experience.year',
    defaultMessage: 'More than 1 year',
  },
  totalEdits: {
    id: 'project.stats.totalEdits',
    defaultMessage: 'Total map edits',
  },
  changesets: {
    id: 'project.stats.changesets',
    defaultMessage: 'Changesets',
  },
  edits: {
    id: 'project.stats.edits',
    defaultMessage: 'Edits',
  },
});
