import { defineMessages } from 'react-intl';

/**
 * Internationalized messages for use on project edit.
 */
export default defineMessages({
  privacy: {
    id: 'projects.formInputs.privacy.title',
    defaultMessage: 'Privacy',
  },
  privateProject: {
    id: 'projects.formInputs.privacy.field',
    defaultMessage: 'Private project',
  },
  privacyDescription: {
    id: 'projects.formInputs.privacy.description',
    defaultMessage:
      'Private means that only the users that are project team members can access, map or validate this project. This option overrides the mapping and validation permissions.',
  },
  teams: {
    id: 'projects.formInputs.teams.title',
    defaultMessage: 'Teams',
  },
  organisation: {
    id: 'projects.formInputs.organisation.title',
    defaultMessage: 'Organization',
  },
  campaign: {
    id: 'projects.formInputs.campaign.title',
    defaultMessage: 'Campaign',
  },
  categories: {
    id: 'projects.formInputs.categories.title',
    defaultMessage: 'Categories',
  },
  organisationDescription: {
    id: 'projects.formInputs.organisation.description',
    defaultMessage:
      'Organization that is coordinating the project, if there is any. The managers of that organization will have administration rights over the project.',
  },
  selectLicense: {
    id: 'projects.formInputs.license.select',
    defaultMessage: 'Select license',
  },
  selectOrganisation: {
    id: 'projects.formInputs.organisation.select',
    defaultMessage: 'Select organization',
  },
  selectCampaign: {
    id: 'projects.formInputs.campaign.select',
    defaultMessage: 'Select campaigns',
  },
  permissions_ANY: {
    id: 'projects.formInputs.permissions.any',
    defaultMessage: 'Any user',
  },
  permissions_LEVEL: {
    id: 'projects.formInputs.permissions.level',
    defaultMessage: 'Only users with intermediate or advanced level',
  },
  permissions_TEAMS: {
    id: 'projects.formInputs.permissions.teams',
    defaultMessage: 'Only team members',
  },
  permissions_TEAMS_LEVEL: {
    id: 'projects.formInputs.permissions.teamsAndLevel',
    defaultMessage: 'Only intermediate and advanced team members',
  },
  mappingPermissionDescription: {
    id: 'projects.formInputs.permissions.mapping.description',
    defaultMessage: 'Define which users can map this project.',
  },
  validationPermissionDescription: {
    id: 'projects.formInputs.permissions.validation.description',
    defaultMessage: 'Define which users can validate this project.',
  },
  mappingPermission: {
    id: 'projects.formInputs.permissions.mapping.title',
    defaultMessage: 'Mapping permissions',
  },
  validationPermission: {
    id: 'projects.formInputs.permissions.validation.title',
    defaultMessage: 'Validation permissions',
  },
  mappingValidationSection: {
    id: 'projects.sections.mapping_validation.title',
    defaultMessage: 'Mapping, validation and invalidation',
  },
  mappingValidationSectionDescription: {
    id: 'projects.sections.mapping_validation.description',
    defaultMessage:
      'Use this if for some reason you need to map, validate or invalidate all tasks in this project in a single step.',
  },
  messageContributors: {
    id: 'projects.actions.message_contributors.title',
    defaultMessage: 'Message all contributors',
  },
  messageContributorsDescription: {
    id: 'projects.actions.message_contributors.description',
    defaultMessage:
      'This will send a message to every contributor of the current project. Please use this feature carefully.',
  },
  messageContributorsTranslationAlert: {
    id: 'projects.actions.message_contributors.translation_alert',
    defaultMessage:
      'This message will not be translated to the different languages of the users, so you may want to include your own translations.',
  },
  messageContributorsSuccess: {
    id: 'projects.actions.message_contributors.success',
    defaultMessage: 'Contributors were messaged successfully.',
  },
  messageContributorsError: {
    id: 'projects.actions.message_contributors.error',
    defaultMessage: 'Failed to message all contributors for an unknown reason.',
  },
  mapAll: {
    id: 'projects.actions.map_all_tasks.title',
    defaultMessage: 'Map all tasks',
  },
  mapAllConfirmation: {
    id: 'projects.actions.map_all_tasks.confirmation',
    defaultMessage:
      'Are you sure you want to mark all tasks in this project as mapped? You cannot undo this.',
  },
  mapAllDescription: {
    id: 'projects.actions.map_all_tasks.description',
    defaultMessage:
      "This will mark all tasks (except 'unavailable' ones) as mapped. Please use this only if you are sure of what you are doing.",
  },
  mapAllSuccess: {
    id: 'projects.actions.map_all_tasks.success',
    defaultMessage: 'The tasks were mapped successfully.',
  },
  mapAllError: {
    id: 'projects.actions.map_all_tasks.error',
    defaultMessage: 'Mapping all the tasks failed for an unknown reason.',
  },
  invalidateAll: {
    id: 'projects.actions.invalidate_all_tasks.title',
    defaultMessage: 'Invalidate all tasks',
  },
  invalidateAllConfirmation: {
    id: 'projects.actions.invalidate_all_tasks.confirmation',
    defaultMessage:
      'Are you sure you want to invalidate all tasks in this project? You cannot undo this.',
  },
  invalidateAllDescription: {
    id: 'projects.actions.invalidate_all_tasks.description',
    defaultMessage:
      "This will mark all tasks (except 'unavailable' ones) as 'more mapping needed'. Please use this only if you are sure of what you are doing.",
  },
  invalidateAllSuccess: {
    id: 'projects.actions.invalidate_all_tasks.success',
    defaultMessage: "The tasks were set as 'more mapping needed' successfully.",
  },
  invalidateAllError: {
    id: 'projects.actions.invalidate_all_tasks.error',
    defaultMessage: 'Invalidating all the tasks failed for an unknown reason.',
  },
  validateAllTasks: {
    id: 'projects.actions.validate_all_tasks.title',
    defaultMessage: 'Validate all tasks',
  },
  validateAllTasksConfirmation: {
    id: 'projects.actions.validate_all_tasks.confirmation',
    defaultMessage: 'Are you sure you want to validate all tasks? You cannot undo this.',
  },
  validateAllTasksDescription: {
    id: 'projects.actions.validate_all_tasks.description',
    defaultMessage:
      "This will change the status of all tasks (except 'unavailable' ones) to 'finished'. Please use this only if you are sure of what you are doing.",
  },
  validateAllSuccess: {
    id: 'projects.actions.validate_all_tasks.success',
    defaultMessage: 'The tasks were validated successfully.',
  },
  validateAllError: {
    id: 'projects.actions.validate_all_tasks.error',
    defaultMessage: 'Validating all the tasks failed for an unknown reason.',
  },
  resetBadImagery: {
    id: 'projects.actions.reset_bad_imagery_tasks.title',
    defaultMessage: 'Reset tasks marked as unavailable',
  },
  resetBadImageryConfirmation: {
    id: 'projects.actions.reset_bad_imagery_tasks.confirmation',
    defaultMessage:
      'Are you sure you want to reset all tasks marked as unavailable in this project? You cannot undo this.',
  },
  resetBadImageryDescription: {
    id: 'projects.actions.reset_bad_imagery_tasks.description',
    defaultMessage:
      "This will change the status of those tasks to 'ready for mapping'. Please use this only if you are sure of what you are doing.",
  },
  resetBadImageryButton: {
    id: 'projects.actions.reset_bad_imagery_tasks.button',
    defaultMessage: 'Reset all unavailable tasks',
  },
  resetBadImagerySuccess: {
    id: 'projects.actions.reset_bad_imagery_tasks.success',
    defaultMessage: 'The tasks marked as unavailable were reset successfully.',
  },
  resetBadImageryError: {
    id: 'projects.actions.reset_bad_imagery_tasks.error',
    defaultMessage: 'Resetting the tasks failed for an unknown reason.',
  },
  resetAll: {
    id: 'projects.actions.reset_all_tasks.title',
    defaultMessage: 'Reset tasks',
  },
  resetAllButton: {
    id: 'projects.actions.reset_all_tasks.button',
    defaultMessage: 'Reset all tasks',
  },
  resetAllDescription: {
    id: 'projects.actions.reset_all_tasks.description',
    defaultMessage: 'Reset all tasks in the project to ready to map, preserving history.',
  },
  resetAllSuccess: {
    id: 'projects.actions.reset_all_tasks.success',
    defaultMessage: 'All tasks were reset successfully.',
  },
  resetAllError: {
    id: 'projects.actions.reset_all_tasks.error',
    defaultMessage: 'Resetting all the tasks failed for an unknown reason.',
  },
  cloneProject: {
    id: 'projects.actions.clone_project.button',
    defaultMessage: 'Clone project',
  },
  cloneProjectDescription: {
    id: 'projects.actions.clone_project.description',
    defaultMessage:
      'This will copy all descriptions, instructions, metadata etc to a new project. The Area of Interest, tasks and the priority areas will not be copied. You will have to redraw/import these. Your newly cloned project will be in draft status.',
  },
  transferProject: {
    id: 'projects.actions.transfer_project.button',
    defaultMessage: 'Transfer project',
  },
  transferProjectTitle: {
    id: 'projects.actions.transfer_project.title',
    defaultMessage: 'Transfer project ownership',
  },
  transferProjectAlert: {
    id: 'projects.actions.transfer_project.alert',
    defaultMessage: 'In case of wrong transfer, contact the new owner to revert the change.',
  },
  transferProjectSuccess: {
    id: 'projects.actions.transfer_project.success',
    defaultMessage: 'The project was transferred successfully.',
  },
  transferProjectError: {
    id: 'projects.actions.transfer_project.error',
    defaultMessage: 'The project transfer failed.',
  },
  deleteProject: {
    id: 'projects.actions.delete_project.title',
    defaultMessage: 'Delete project',
  },
  deleteProjectAlert: {
    id: 'projects.actions.delete_project.alert',
    defaultMessage: 'You can only delete projects that has no received contributions.',
  },
  deleteProjectSuccess: {
    id: 'projects.actions.delete_project.success',
    defaultMessage: 'The project was deleted successfully.',
  },
  deleteProjectError: {
    id: 'projects.actions.delete_project.error',
    defaultMessage:
      'The project deletion failed. If this project has received some contributions, you should archive it instead.',
  },
  taskReset: {
    id: 'projects.actions.task_reset.title',
    defaultMessage: 'Task reset',
  },
  taskResetButton: {
    id: 'projects.actions.task_reset.button',
    defaultMessage: 'Reset all tasks',
  },
  cancel: {
    id: 'projects.actions.modal.cancel.button',
    defaultMessage: 'Cancel',
  },
  canNotUndo: {
    id: 'projects.actions.alerts.can_not_undo',
    defaultMessage: 'This cannot be undone.',
  },
  warning: {
    id: 'projects.actions.alerts.warning',
    defaultMessage: 'Warning',
  },
  taskResetConfirmation: {
    id: 'projects.actions.task_reset.confirmation',
    defaultMessage: 'Are you sure you want to reset all tasks? You cannot undo this.',
  },
  status: {
    id: 'projects.formInputs.status',
    defaultMessage: 'Status',
  },
  priority: {
    id: 'projects.formInputs.priority',
    defaultMessage: 'Priority',
  },
  license: {
    id: 'projects.formInputs.license',
    defaultMessage: 'Required license',
  },
  language: {
    id: 'projects.formInputs.language',
    defaultMessage: 'Default language',
  },
  mappingEditors: {
    id: 'projects.formInputs.mapping_editors',
    defaultMessage: 'Editors for mapping',
  },
  validationEditors: {
    id: 'projects.formInputs.validation_editors',
    defaultMessage: 'Editors for validation',
  },
  customEditor: {
    id: 'projects.formInputs.editors.options.custom',
    defaultMessage: 'Custom editor',
  },
  randomTaskSelection: {
    id: 'projects.formInputs.random_task_selection',
    defaultMessage: 'Enforce random task selection',
  },
  randomTaskSelectionMapping: {
    id: 'projects.formInputs.random_task_selection.mapping',
    defaultMessage: 'Enforce random task selection on mapping',
  },
  randomTaskSelectionDescription: {
    id: 'projects.formInputs.random_task_selection.description',
    defaultMessage:
      'If checked, users must edit tasks at random for the initial editing stage (managers and admins are exempt).',
  },
  imageryURL: {
    id: 'projects.formInputs.imagery',
    defaultMessage: 'Imagery URL',
  },
  imageryURLNote: {
    id: 'projects.formInputs.imagery.note',
    defaultMessage: 'Follow this format for TMS URLs: {exampleUrl}',
  },
  priorityAreas_draw_polygon: {
    id: 'projects.formInputs.priority_areas.options.polygon',
    defaultMessage: 'Draw polygon',
  },
  priorityAreas_draw_rectangle: {
    id: 'projects.formInputs.priority_areas.options.rectangle',
    defaultMessage: 'Draw rectangle',
  },
  clearAll: {
    id: 'projects.formInputs.priority_areas.action.clear',
    defaultMessage: 'Clear all',
  },
  name: {
    id: 'projects.formInputs.name',
    defaultMessage: 'Name of the project',
  },
  dueDate: {
    id: 'projects.formInputs.dueDate',
    defaultMessage: 'Due date',
  },
  dueDateDescription: {
    id: 'projects.formInputs.dueDate.description',
    defaultMessage:
      'Define the ideal date to have the project finished. The date format is day/month/year.',
  },
  description: {
    id: 'projects.formInputs.description',
    defaultMessage: 'Description',
  },
  shortDescription: {
    id: 'projects.formInputs.shortDescription',
    defaultMessage: 'Short description',
  },
  instructions: {
    id: 'projects.formInputs.instructions',
    defaultMessage: 'Detailed instructions',
  },
  osmchaFilterId: {
    id: 'projects.formInputs.osmcha_filter_id',
    defaultMessage: 'OSMCha filter ID',
  },
  osmchaFilterIdDescription: {
    id: 'projects.formInputs.osmcha_filter_id.description',
    defaultMessage:
      'Optional id of a saved OSMCha filter to apply when viewing the project in OSMCha, if you desire custom filtering. Note that this replaces all standard filters. Example: 095e8b31-b3cb-4b36-a106-02826fb6a109 (for convenience, you can also paste an OSMCha URL here that uses a saved filter and the filter id will be extracted for you).',
  },
  priorityAreasDescription: {
    id: 'projects.formInputs.priority_areas.description',
    defaultMessage:
      'If you want mappers to work on the highest priority areas first, draw one or more polygons within the project area.',
  },
  mappingTypes: {
    id: 'projects.formInputs.mapping_types',
    defaultMessage: 'Types of mapping',
  },
  idPresets: {
    id: 'projects.formInputs.id_presets',
    defaultMessage: 'iD editor presets',
  },

  userRole: {
    id: 'projects.formInputs.user_role',
    defaultMessage: 'User role',
  },
  mapperLevel: {
    id: 'projects.formInputs.mapper_level',
    defaultMessage: 'Mapper level',
  },
  mapperLevelDescription: {
    id: 'projects.formInputs.mapper_level.description',
    defaultMessage: 'Setting the level will help mappers to find suitable projects to work on.',
  },
  perTaskInstructions: {
    id: 'projects.formInputs.per_task_instructions',
    defaultMessage: 'Per task instructions',
  },
  perTaskInstructionsDescription: {
    id: 'projects.formInputs.per_task_instructions.descriptions',
    defaultMessage:
      'Add any information that can be useful to users while mapping a task. "{x}", "{y}" and "{z}" will be replaced by the corresponding parameters for each task. "{x}", "{y}" and "{z}" parameters can only be be used on tasks generated in the Tasking Manager and not on imported tasks.',
  },
  perTaskInstructionsExample: {
    id: 'projects.formInputs.per_task_instructions.example',
    defaultMessage:
      'Example: This task involves loading extra data. Click [here](http://localhost:8111/import?new_layer=true&amp;url=http://www.domain.com/data/{x}/{y}/{z}/routes_2009.osm) to load the data into JOSM.',
  },
  changesetComment: {
    id: 'projects.formInputs.changesetComment',
    defaultMessage: 'Changeset comment',
  },
  changesetCommentExample: {
    id: 'projects.formInputs.changesetComment.example',
    defaultMessage: 'Example: #hotosm-project-470 #missingmaps Buildings mapping.',
  },
  changesetCommentDescription: {
    id: 'projects.formInputs.changesetComment.description',
    defaultMessage:
      'Default comments added to uploaded changeset comment field. Users should also be encouraged to add text describing what they mapped. Hashtags are sometimes used for analysis later, but should be human informative and not overused, #group #event for example.',
  },
  projectPriorityURGENT: {
    id: 'project.formInputs.priority.options.urgent',
    defaultMessage: 'Urgent',
  },
  projectPriorityHIGH: {
    id: 'project.formInputs.priority.options.high',
    defaultMessage: 'High',
  },
  projectPriorityMEDIUM: {
    id: 'project.formInputs.priority.options.medium',
    defaultMessage: 'Medium',
  },
  projectPriorityLOW: {
    id: 'project.formInputs.priority.options.low',
    defaultMessage: 'Low',
  },
  statusDRAFT: {
    id: 'project.formInputs.status.options.draft',
    defaultMessage: 'Draft',
  },
  statusARCHIVED: {
    id: 'project.formInputs.status.options.archived',
    defaultMessage: 'Archived',
  },
  statusPUBLISHED: {
    id: 'project.formInputs.status.options.published',
    defaultMessage: 'Published',
  },
  userRoleALL: {
    id: 'project.formInputs.user_role.options.all',
    defaultMessage: 'All roles',
  },
  userRoleMAPPER: {
    id: 'project.formInputs.user_role.options.mapper',
    defaultMessage: 'Mapper',
  },
  subjectPlaceholder: {
    id: 'project.formInputs.placeholders.subject',
    defaultMessage: 'Subject *',
  },
  messagePlaceholder: {
    id: 'project.formInputs.placeholders.message',
    defaultMessage: 'Message *',
  },
  mapperLevelALL: {
    id: 'project.formInputs.mapper_level.options.all',
    defaultMessage: 'All levels',
  },
  mapperLevelADVANCED: {
    id: 'project.formInputs.mapper_level.options.advanced',
    defaultMessage: 'Advanced',
  },
  mapperLevelINTERMEDIATE: {
    id: 'project.formInputs.mapper_level.options.intermediate',
    defaultMessage: 'Intermediate',
  },
  mapperLevelBEGINNER: {
    id: 'project.formInputs.mapper_level.options.beginner',
    defaultMessage: 'Beginner',
  },
  filterByOrg: {
    id: 'project.formInputs.teams.actions.filter.organisations',
    defaultMessage: 'Filter teams by organizations',
  },
  selectTeam: {
    id: 'project.formInputs.teams.actions.select',
    defaultMessage: 'Select a team...',
  },
  selectRole: {
    id: 'project.formInputs.teams.actions.select.role',
    defaultMessage: 'Select a role...',
  },
  add: {
    id: 'project.formInputs.teams.actions.add',
    defaultMessage: 'Add',
  },
  update: {
    id: 'project.formInputs.teams.actions.update',
    defaultMessage: 'Update',
  },
  preview: {
    id: 'project.messages.preview',
    defaultMessage: 'Preview',
  },
  customEditorName: {
    id: 'projects.formInputs.custom_editor.name',
    defaultMessage: 'Name',
  },
  customEditorDescription: {
    id: 'projects.formInputs.custom_editor.description',
    defaultMessage: 'Description',
  },
  customEditorUrl: {
    id: 'projects.formInputs.custom_editor.url',
    defaultMessage: 'URL',
  },
  customEditorEnabled: {
    id: 'projects.formInputs.custom_editor.enabled',
    defaultMessage: 'Enabled',
  },
  deleteCustomEditor: {
    id: 'projects.formInputs.custom_editor.delete',
    defaultMessage: 'Delete Custom Editor',
  },
  removeCustomEditor: {
    id: 'projects.formInputs.custom_editor.remove',
    defaultMessage: 'Remove Custom Editor',
  },
  confirmDeleteCustomEditor: {
    id: 'projects.formInputs.custom_editor.delete.confirm',
    defaultMessage:
      'This will remove the custom editor from the project. Are you sure you don\'t want to disable the custom editor by toggling the "Enabled" checkbox above?',
  },
});
