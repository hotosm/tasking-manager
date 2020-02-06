import { defineMessages } from 'react-intl';

/**
 * Internationalized messages for use on task selection.
 */
export default defineMessages({
  lockError: {
    id: 'project.tasks.lock_error.generic',
    defaultMessage: "It wasn't possible to lock this task for you...",
  },
  lockErrorDescription: {
    id: 'project.tasks.lock_error.generic.description',
    defaultMessage:
      'Some error occurred when trying to lock this task. Check if your user matches the level, role and permissions required by this project.',
  },
  anotherLockedTask: {
    id: 'project.tasks.lock_error.another_project',
    defaultMessage: 'We found another mapping task already locked by you',
  },
  anotherProjectLockTextSingular: {
    id: 'project.tasks.lock_error.another_project.description.singular',
    defaultMessage:
      'It is on the Project #{project}. You will need to update the status of that task before you can map another task.',
  },
  anotherProjectLockTextPlural: {
    id: 'project.tasks.lock_error.another_project.description.plural',
    defaultMessage:
      'It is on the Project #{project}. You will need to update the status of that task before you can map another task.',
  },
  currentProjectLockTextSingular: {
    id: 'project.tasks.lock_error.current_project.description.singular',
    defaultMessage:
      'The task #{taskId} was previously locked by you. You will need to update the status of that task before you can map another task.',
  },
  currentProjectLockTextPlural: {
    id: 'project.tasks.lock_error.current_project.description.plural',
    defaultMessage:
      'Some tasks were previously locked by you on this project. You will need to update the status of those tasks before you can map another task.',
  },
  goToProject: {
    id: 'project.tasks.lock_error.go_to_project.button',
    defaultMessage: 'Go to Project #{project}',
  },
  workOnTasksSingular: {
    id: 'project.tasks.lock_error.work_on_tasks.singular.button',
    defaultMessage: '{mapOrValidate} that task',
  },
  workOnTasksPlural: {
    id: 'project.tasks.lock_error.work_on_tasks.plural.button',
    defaultMessage: '{mapOrValidate} those tasks',
  },
  legend: {
    id: 'project.tasks.map.legend',
    defaultMessage: 'Legend',
  },
  typesOfMapping: {
    id: 'project.typesOfMapping',
    defaultMessage: 'Types of Mapping',
  },
  roads: {
    id: 'project.typesOfMapping.roads',
    defaultMessage: 'Roads',
  },
  buildings: {
    id: 'project.typesOfMapping.buildings',
    defaultMessage: 'Buildings',
  },
  landUse: {
    id: 'project.typesOfMapping.landUse',
    defaultMessage: 'Land use',
  },
  waterways: {
    id: 'project.typesOfMapping.waterways',
    defaultMessage: 'Waterways',
  },
  other: {
    id: 'project.typesOfMapping.other',
    defaultMessage: 'Other',
  },
  editor: {
    id: 'project.editor',
    defaultMessage: 'Editor',
  },
  selectEditor: {
    id: 'project.editor.select',
    defaultMessage: 'Select editor',
  },
  startAnotherEditor: {
    id: 'project.editor.start_another_editor',
    defaultMessage: 'Start another editor',
  },
  task: {
    id: 'project.task',
    defaultMessage: 'Task',
  },
  tasks: {
    id: 'project.tasks',
    defaultMessage: 'Tasks',
  },
  taskId: {
    id: 'project.taskId',
    defaultMessage: 'Task #{id}',
  },
  instructions: {
    id: 'project.instructions',
    defaultMessage: 'Instructions',
  },
  contributions: {
    id: 'project.contributions',
    defaultMessage: 'contributions',
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
  customLayer: {
    id: 'project.imagery.customLayer',
    defaultMessage: 'Custom Layer',
  },
  noImageryDefined: {
    id: 'project.imagery.noDefined',
    defaultMessage: 'Any available source',
  },
  mapATask: {
    id: 'project.selectTask.footer.button.mapRandomTask',
    defaultMessage: 'Map a task',
  },
  mapSelectedTask: {
    id: 'project.selectTask.footer.button.mapSelectedTask',
    defaultMessage: 'Map selected task',
  },
  mapAnotherTask: {
    id: 'project.selectTask.footer.button.mapAnotherTask',
    defaultMessage: 'Map another task',
  },
  validateATask: {
    id: 'project.selectTask.footer.button.validateRandomTask',
    defaultMessage: 'Validate a task',
  },
  validateSelectedTask: {
    id: 'project.selectTask.footer.button.validateSelectedTask',
    defaultMessage: 'Validate selected task',
  },
  validateAnotherTask: {
    id: 'project.selectTask.footer.button.validateAnotherTask',
    defaultMessage: 'Validate another task',
  },
  selectAnotherProject: {
    id: 'project.selectTask.footer.button.selectAnotherProject',
    defaultMessage: 'Select another project',
  },
  resumeMapping: {
    id: 'project.selectTask.footer.button.resumeMapping',
    defaultMessage: 'Resume mapping',
  },
  resumeValidation: {
    id: 'project.selectTask.footer.button.resumeValidation',
    defaultMessage: 'Resume validation',
  },
  taskLastUpdate: {
    id: 'project.tasks.list.lastUpdate',
    defaultMessage: 'Last updated by {user}',
  },
  taskStatus_READY: {
    id: 'project.tasks.status.ready',
    defaultMessage: 'Available for mapping',
  },
  taskStatus_MAPPED: {
    id: 'project.tasks.status.mapped',
    defaultMessage: 'Ready for validation',
  },
  taskStatus_LOCKED: {
    id: 'project.tasks.status.locked',
    defaultMessage: 'Locked',
  },
  taskStatus_LOCKED_FOR_MAPPING: {
    id: 'project.tasks.status.lockedForMapping',
    defaultMessage: 'Locked for mapping',
  },
  taskStatus_LOCKED_FOR_VALIDATION: {
    id: 'project.tasks.status.lockedForValidation',
    defaultMessage: 'Locked for validation',
  },
  taskStatus_VALIDATED: {
    id: 'project.tasks.status.validated',
    defaultMessage: 'Finished',
  },
  taskStatus_INVALIDATED: {
    id: 'project.tasks.status.invalidated',
    defaultMessage: 'More mapping needed',
  },
  taskStatus_BADIMAGERY: {
    id: 'project.tasks.status.badImagery',
    defaultMessage: 'Unavailable',
  },
  taskStatus_SPLIT: {
    id: 'project.tasks.status.split',
    defaultMessage: 'Split',
  },
  sortById: {
    id: 'project.tasks.sorting.id',
    defaultMessage: 'Sort by task number',
  },
  sortByLastUpdate: {
    id: 'project.tasks.sorting.date',
    defaultMessage: 'Last updated first',
  },
  filterAll: {
    id: 'project.tasks.filter.all',
    defaultMessage: 'All',
  },
  filterReadyToValidate: {
    id: 'project.tasks.filter.readyToValidate',
    defaultMessage: 'Ready for validation',
  },
  filterReadyToMap: {
    id: 'project.tasks.filter.readyToMap',
    defaultMessage: 'Available for mapping',
  },
  noTasksFound: {
    id: 'project.tasks.filter.noTasksFound',
    defaultMessage: 'No tasks were found.',
  },
  completion: {
    id: 'project.tasks.action.completion',
    defaultMessage: 'Completion',
  },
  history: {
    id: 'project.tasks.action.history',
    defaultMessage: 'History',
  },
  finishMappingTitle: {
    id: 'project.tasks.action.finish_mapping.title',
    defaultMessage: 'Once you have finished mapping',
  },
  instructionsSelect: {
    id: 'project.tasks.action.instructions.select_task',
    defaultMessage: 'Select one of the options below that matches your edit status',
  },
  instructionsComment: {
    id: 'project.tasks.action.instructions.leave_comment',
    defaultMessage: 'Leave a comment (optional)',
  },
  instructionsSubmit: {
    id: 'project.tasks.action.instructions.submit_task',
    defaultMessage: 'Submit your work',
  },
  comment: {
    id: 'project.tasks.action.comment.title',
    defaultMessage: 'Comment',
  },
  commentPlaceholder: {
    id: 'project.tasks.action.comment.input.placeholder',
    defaultMessage: 'Write a comment on this task',
  },
  editStatus: {
    id: 'project.tasks.action.selection.title',
    defaultMessage: 'Edit status',
  },
  badImagery: {
    id: 'project.tasks.action.options.bad_imagery',
    defaultMessage: 'It was not possible to map due to poor imagery',
  },
  incomplete: {
    id: 'project.tasks.action.options.mapping_incomplete',
    defaultMessage: 'I could not map everything',
  },
  completelyMapped: {
    id: 'project.tasks.action.options.mapping_complete',
    defaultMessage: 'I completely mapped this task',
  },
  markAsValid: {
    id: 'project.tasks.action.options.validate',
    defaultMessage: 'Validate and mark as finished',
  },
  markAsInvalid: {
    id: 'project.tasks.action.options.invalidate',
    defaultMessage: 'More mapping is needed',
  },
  splitTask: {
    id: 'project.tasks.action.split_task',
    defaultMessage: 'Split task',
  },
  selectAnotherTask: {
    id: 'project.tasks.action.select_another_task',
    defaultMessage: 'Select another task',
  },
  submitTask: {
    id: 'project.tasks.action.submit_task',
    defaultMessage: 'Submit task',
  },
  taskActivity: {
    id: 'project.tasks.history.title',
    defaultMessage: 'Task activity',
  },
  taskHistoryComment: {
    id: 'project.tasks.history.comment',
    defaultMessage: 'commented',
  },
  taskHistoryLockedMapping: {
    id: 'project.tasks.history.lockedmapping',
    defaultMessage: 'locked for mapping',
  },
  taskHistoryLockedValidation: {
    id: 'project.tasks.history.lockedvalidation',
    defaultMessage: 'locked for validation',
  },
  taskHistoryAutoUnlockedMapping: {
    id: 'project.tasks.history.autounlockedmapping',
    defaultMessage: 'automatically unlocked for mapping',
  },
  taskHistoryAutoUnlockedValidation: {
    id: 'project.tasks.history.autounlockedvalidation',
    defaultMessage: 'automatically unlocked for validation',
  },
  taskHistoryBadImagery: {
    id: 'project.tasks.history.badimagery',
    defaultMessage: 'marked as bad imagery',
  },
  taskHistoryMapped: {
    id: 'project.tasks.history.mapped',
    defaultMessage: 'marked as mapped',
  },
  taskHistoryValidated: {
    id: 'project.tasks.history.validated',
    defaultMessage: 'marked as validated',
  },
  taskHistoryInvalidated: {
    id: 'project.tasks.history.invalidated',
    defaultMessage: 'marked as invalidated',
  },
  taskHistorySplit: {
    id: 'project.tasks.history.split',
    defaultMessage: 'split a task',
  },
  taskHistoryReady: {
    id: 'project.tasks.history.ready',
    defaultMessage: 'marked as ready',
  },
  map: {
    id: 'project.tasks.action.map',
    defaultMessage: 'Map',
  },
  mapped: {
    id: 'project.tasks.action.mapped',
    defaultMessage: 'Mapped',
  },
  validate: {
    id: 'project.tasks.action.validate',
    defaultMessage: 'Validate',
  },
  validated: {
    id: 'project.tasks.action.validated',
    defaultMessage: 'Validated',
  },
  total: {
    id: 'project.tasks.number.total',
    defaultMessage: 'Total',
  },
  lockedBy: {
    id: 'project.tasks.locked_by_user',
    defaultMessage: '{lockStatus} by {user}',
  },
  mappingLevelALL: {
    id: 'project.level.all',
    defaultMessage: 'All levels',
  },
  mappingLevelADVANCED: {
    id: 'mapping.level.advanced',
    defaultMessage: 'Advanced',
  },
  mappingLevelINTERMEDIATE: {
    id: 'mapping.level.intermediate',
    defaultMessage: 'Intermediate',
  },
  mappingLevelBEGINNER: {
    id: 'mapping.level.beginner',
    defaultMessage: 'Beginner',
  },
});
