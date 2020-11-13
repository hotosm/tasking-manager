import { defineMessages } from 'react-intl';

/**
 * Internationalized messages for use on task selection.
 */
export default defineMessages({
  unsavedChanges: {
    id: 'project.tasks.unsaved_map_changes.title',
    defaultMessage: 'You have some unsaved map changes',
  },
  unsavedChangesToSplit: {
    id: 'project.tasks.unsaved_map_changes.split',
    defaultMessage: 'Save or undo it to be able to split the task',
  },
  unsavedChangesToUnlock: {
    id: 'project.tasks.unsaved_map_changes.unlock',
    defaultMessage: 'Save or undo it to be able to select another task',
  },
  closeModal: {
    id: 'project.tasks.unsaved_map_changes.actions.close_modal',
    defaultMessage: 'Close',
  },
  josmError: {
    id: 'project.tasks.josm_error',
    defaultMessage: 'Connection with JOSM failed',
  },
  josmErrorDescription: {
    id: 'project.tasks.josm_error.description',
    defaultMessage:
      'Please verify if JOSM is running on your computer and the remote control is enabled.',
  },
  lockError: {
    id: 'project.tasks.lock_error.generic',
    defaultMessage: "It wasn't possible to lock this task for you...",
  },
  lockErrorDescription: {
    id: 'project.tasks.lock_error.generic.description',
    defaultMessage:
      'Some error occurred when trying to lock this task. Check if your user matches the level, role and permissions required by this project.',
  },
  lockErrorLicense: {
    id: 'project.tasks.lock_error.license.title',
    defaultMessage: 'This project has a required license.',
  },
  lockErrorLicenseDescription: {
    id: 'project.tasks.lock_error.license.description',
    defaultMessage: 'Please accept this license in order to collaborate in this project. ',
  },
  acceptLicense: {
    id: 'project.tasks.lock_error.license.accept',
    defaultMessage: 'Accept',
  },
  cancel: {
    id: 'project.tasks.lock_error.cancel',
    defaultMessage: 'Cancel',
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
  editor: {
    id: 'project.editor',
    defaultMessage: 'Editor',
  },
  selectEditor: {
    id: 'project.editor.select',
    defaultMessage: 'Select editor',
  },
  filterPlaceholder: {
    id: 'project.input.placeholders.filter',
    defaultMessage: 'Filter tasks by id or username',
  },
  reloadEditor: {
    id: 'project.editor.reload_editor',
    defaultMessage: 'Reload editor',
  },
  openEditor: {
    id: 'project.editor.open_editor',
    defaultMessage: 'Open editor',
  },
  showSidebar: {
    id: 'project.sidebar.show',
    defaultMessage: 'Show sidebar',
  },
  hideSidebar: {
    id: 'project.sidebar.hide',
    defaultMessage: 'Hide sidebar',
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
  changesetComment: {
    id: 'project.changesetComment',
    defaultMessage: 'Changeset comment',
  },
  contributions: {
    id: 'project.contributions',
    defaultMessage: 'contributions',
  },
  registered: {
    id: 'project.contributions.registered',
    defaultMessage: 'Registered on',
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
    defaultMessage:
      '{number, plural, one {Validate selected task} other {Validate # selected tasks}}',
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
  seeTaskHistory: {
    id: 'project.tasks.list.details',
    defaultMessage: 'See task history',
  },
  zoomToTask: {
    id: 'project.tasks.list.zoom',
    defaultMessage: 'Zoom map to task',
  },
  copyTaskLink: {
    id: 'project.tasks.list.copyLink',
    defaultMessage: 'Copy task link',
  },
  taskLinkCopied: {
    id: 'project.tasks.list.linkCopied',
    defaultMessage: 'Task link copied to the clipboard',
  },
  taskStatus_PRIORITY_AREAS: {
    id: 'project.tasks.priority_areas',
    defaultMessage: 'Priority areas',
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
  writeComment: {
    id: 'project.input.placeholder.write_comment',
    defaultMessage: 'Write a comment',
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
    defaultMessage: 'Task status',
  },
  revertVALIDATED: {
    id: 'project.tasks.action.invalidate',
    defaultMessage: 'Request revalidation',
  },
  confirmRevertVALIDATED: {
    id: 'project.tasks.action.invalidate.confirmation',
    defaultMessage: 'Task status will be changed to "Ready for validation".',
  },
  revertBADIMAGERY: {
    id: 'project.tasks.action.set_as_ready',
    defaultMessage: 'Request mapping',
  },
  confirmRevertBADIMAGERY: {
    id: 'project.tasks.action.set_as_ready.confirmation',
    defaultMessage: 'Task status will be changed to "Available for mapping".',
  },
  proceed: {
    id: 'project.tasks.action.proceed.confirmation',
    defaultMessage: 'Do want to proceed?',
  },
  yes: {
    id: 'project.tasks.action.confirmation.yes',
    defaultMessage: 'Yes',
  },
  no: {
    id: 'project.tasks.action.confirmation.no',
    defaultMessage: 'No',
  },
  mappedQuestion: {
    id: 'project.tasks.action.options.mapped_question',
    defaultMessage: 'Is this task completely mapped?',
  },
  validatedQuestion: {
    id: 'project.tasks.action.options.validated_question',
    defaultMessage: 'Is this task well mapped?',
  },
  complete: {
    id: 'project.tasks.action.options.complete',
    defaultMessage: 'Yes',
  },
  incomplete: {
    id: 'project.tasks.action.options.incomplete',
    defaultMessage: 'No',
  },
  badImagery: {
    id: 'project.tasks.action.options.bad_imagery',
    defaultMessage: 'The imagery is bad',
  },
  splitTask: {
    id: 'project.tasks.action.split_task',
    defaultMessage: 'Split task',
  },
  selectAnotherTask: {
    id: 'project.tasks.action.select_another_task',
    defaultMessage: 'Select another task',
  },
  stopValidation: {
    id: 'project.tasks.action.stop_validation',
    defaultMessage: 'Stop validation',
  },
  tasksMap: {
    id: 'project.tasks.action.tasks_map',
    defaultMessage: 'Tasks map',
  },
  submitTask: {
    id: 'project.tasks.action.submit_task',
    defaultMessage: 'Submit task',
  },
  submitTasks: {
    id: 'project.tasks.action.submit_tasks',
    defaultMessage: 'Submit tasks',
  },
  taskActivity: {
    id: 'project.tasks.history.title',
    defaultMessage: 'Task {n}',
  },
  taskUnavailable: {
    id: 'project.tasks.history.unavailable',
    defaultMessage: 'Task unavailable',
  },
  taskSplitDescription: {
    id: 'project.tasks.history.split.description',
    defaultMessage: 'The task {id} was split and its history is not available anymore',
  },
  taskData: {
    id: 'project.tasks.activity.data.links',
    defaultMessage: 'Task data',
  },
  projectId: {
    id: 'project.tasks.activity.project_id',
    defaultMessage: 'Project #{id}',
  },
  overpassDownload: {
    id: 'project.tasks.activity.overpass.download',
    defaultMessage: 'Download from Overpass',
  },
  overpassVisualization: {
    id: 'project.tasks.activity.overpass.visualization',
    defaultMessage: 'Visualize with Overpass',
  },
  taskOnOSMCha: {
    id: 'project.tasks.activity.osmcha',
    defaultMessage: 'View changesets in OSMCha',
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
    defaultMessage: 'marked as unavailable',
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
    defaultMessage: 'marked as more mapping needed',
  },
  taskHistorySplit: {
    id: 'project.tasks.history.split',
    defaultMessage: 'split a task',
  },
  taskHistoryReady: {
    id: 'project.tasks.history.ready',
    defaultMessage: 'marked as ready for mapping',
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
  taskExtraInfo: {
    id: 'project.tasks.extra_information.title',
    defaultMessage: 'Specific task information',
  },
  mappingLevelALL: {
    id: 'project.level.all',
    defaultMessage: 'All levels',
  },
  mappingLevelADVANCED: {
    id: 'project.level.advanced',
    defaultMessage: 'Advanced',
  },
  mappingLevelINTERMEDIATE: {
    id: 'project.level.intermediate',
    defaultMessage: 'Intermediate',
  },
  mappingLevelBEGINNER: {
    id: 'project.level.beginner',
    defaultMessage: 'Beginner',
  },
  mappingLevelNEWUSER: {
    id: 'project.level.new_users',
    defaultMessage: 'New users',
  },
  statistics: {
    id: 'project.contributions.stats',
    defaultMessage: 'Statistics',
  },
  mappedByUser: {
    id: 'project.contributions.user.select.mapped',
    defaultMessage: 'Select tasks mapped by {username}',
  },
  validatedByUser: {
    id: 'project.contributions.user.select.validated',
    defaultMessage: 'Select tasks validated by {username}',
  },
  allUserTasks: {
    id: 'project.contributions.user.select.all',
    defaultMessage: 'Select all tasks mapped or validated by {username}',
  },
  permissionErrorTitle: {
    id: 'project.permissions.error.title',
    defaultMessage: 'You are not ready to work on this project...',
  },
  permissionError_userLevelToValidate: {
    id: 'project.permissions.error.userLevelToValidate',
    defaultMessage:
      'Only users with intermediate or advanced experience level can validate this project.',
  },
  permissionError_userLevelToMap: {
    id: 'project.permissions.error.userLevelToMap',
    defaultMessage:
      'Only users with intermediate or advanced experience level can map this project.',
  },
  permissionError_userIsNotValidationTeamMember: {
    id: 'project.permissions.error.userIsNotValidationTeamMember',
    defaultMessage:
      'You need to be member of one of the validation teams to be able to validate this project.',
  },
  permissionError_userIsNotMappingTeamMember: {
    id: 'project.permissions.error.userIsNotMappingTeamMember',
    defaultMessage:
      'You need to be member of one of the mapping teams to be able to map this project.',
  },
});
