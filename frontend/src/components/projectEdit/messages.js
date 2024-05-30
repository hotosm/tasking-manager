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
  teamsPermissionNote: {
    id: 'projects.teams.teamsPermissionNote',
    defaultMessage:
      'Note: Mappers have mapping permissions. Validators have mapping and validation permissions. Project managers have mapping and validation permissions as well as the access to the management sections.',
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
  admins: {
    id: 'projects.formInputs.admins.title',
    defaultMessage: 'TM Admins',
  },
  selectImagery: {
    id: 'projects.formInputs.imagery.select',
    defaultMessage: 'Select imagery',
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
    defaultMessage: 'Invalidate all validated tasks',
  },
  invalidateAllConfirmation: {
    id: 'projects.actions.invalidate_all_tasks.confirmation',
    defaultMessage:
      'Are you sure you want to invalidate all validated tasks in this project? You cannot undo this.',
  },
  invalidateAllDescription: {
    id: 'projects.actions.invalidate_all_tasks.description',
    defaultMessage:
      "This will mark all validated tasks as 'more mapping needed'. Please use this only if you are sure of what you are doing.",
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
    defaultMessage: 'Validate all mapped tasks',
  },
  validateAllTasksConfirmation: {
    id: 'projects.actions.validate_all_tasks.confirmation',
    defaultMessage: 'Are you sure you want to validate all mapped tasks? You cannot undo this.',
  },
  validateAllTasksDescription: {
    id: 'projects.actions.validate_all_tasks.description',
    defaultMessage:
      "This will change the status of all mapped tasks to 'finished'. Please use this only if you are sure of what you are doing.",
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
  revertVALIDATEDTasks: {
    id: 'projects.actions.revert_validated_tasks.button',
    defaultMessage: 'Revert validated tasks',
  },
  revertVALIDATEDTasksTitle: {
    id: 'projects.actions.revert_validated_tasks.title',
    defaultMessage: 'Revert validated tasks',
  },
  revertVALIDATEDTasksDescription: {
    id: 'projects.actions.revert_validated_tasks.description',
    defaultMessage: 'Revert all validated tasks by a specified user and mark it as mapped',
  },
  revertVALIDATEDTasksSuccess: {
    id: 'projects.actions.revert_validated_tasks.success',
    defaultMessage: 'The tasks were reverted successfully.',
  },
  revertBADIMAGERYTasks: {
    id: 'projects.actions.revert_unavailable_tasks.button',
    defaultMessage: 'Revert unavailable tasks',
  },
  revertBADIMAGERYTasksTitle: {
    id: 'projects.actions.revert_unavailable_tasks.title',
    defaultMessage: 'Revert unavailable tasks',
  },
  revertBADIMAGERYTasksDescription: {
    id: 'projects.actions.revert_unavailable_tasks.description',
    defaultMessage:
      'Revert all tasks marked as unavailable by a specified user and mark it as ready to map',
  },
  revertBADIMAGERYTasksSuccess: {
    id: 'projects.actions.revert_unavailable_tasks.success',
    defaultMessage: 'The tasks were reverted successfully.',
  },
  revertTasksError: {
    id: 'projects.actions.revert_validated_tasks.error',
    defaultMessage: 'The tasks reversion failed.',
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
    defaultMessage:
      'This feature is only available to the project author, organisation manager and TM admin.',
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
  typeHere: {
    id: 'projects.formInputs.type',
    defaultMessage: 'Type here...',
  },
  translations: {
    id: 'projects.formInputs.language.translations',
    defaultMessage: 'Translations',
  },
  selectLanguage: {
    id: 'projects.formInputs.language.select',
    defaultMessage: 'Select a language above to translate.',
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
  rapidPowerUser: {
    id: 'projects.formInputs.rapid_power_user',
    defaultMessage: 'Enable RapiD Power User Features',
  },
  rapidPowerUserDescription: {
    id: 'projects.formInputs.rapid_power_user.description',
    defaultMessage: 'If checked, RapiD will load with the power user dialog enabled.',
  },
  imagery: {
    id: 'projects.formInputs.imagery',
    defaultMessage: 'Imagery',
  },
  imageryURLNote: {
    id: 'projects.formInputs.imagery.note',
    defaultMessage: 'Follow this format for TMS URLs: {exampleUrl}',
  },
  drawPolygon: {
    id: 'projects.formInputs.priority_areas.options.polygon',
    defaultMessage: 'Draw polygon',
  },
  drawRectangle: {
    id: 'projects.formInputs.priority_areas.options.rectangle',
    defaultMessage: 'Draw rectangle',
  },
  clearAll: {
    id: 'projects.formInputs.priority_areas.action.clear',
    defaultMessage: 'Clear all',
  },
  selectFile: {
    id: 'projects.formInputs.priority_areas.action.selectFile',
    defaultMessage: 'Select File',
  },
  importDescription: {
    id: 'projects.formInputs.priority_areas.upload.description',
    defaultMessage:
      'The supported file formats are: GeoJSON, KML, OSM or zipped Shapefile. You can drag and drop a file over the map to import it.',
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
      'If you want mappers to work on the highest priority areas first, draw one or more polygons within the project area or import a file.',
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
  difficulty: {
    id: 'projects.formInputs.difficulty',
    defaultMessage: 'Difficulty',
  },
  difficultyDescription: {
    id: 'projects.formInputs.difficulty.description',
    defaultMessage:
      'Setting the difficulty will help mappers to find suitable projects to work on.',
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
  nonEditableComment: {
    id: 'projects.formInputs.non_editable_comment',
    defaultMessage: 'This default comment is not editable.',
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
  difficultyALL: {
    id: 'project.formInputs.mapper_level.options.all',
    defaultMessage: 'All levels',
  },
  difficultyCHALLENGING: {
    id: 'project.formInputs.mapper_level.options.challenging',
    defaultMessage: 'Challenging',
  },
  difficultyMODERATE: {
    id: 'project.formInputs.mapper_level.options.moderate',
    defaultMessage: 'Moderate',
  },
  difficultyEASY: {
    id: 'project.formInputs.mapper_level.options.easy',
    defaultMessage: 'Easy',
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
  customEditorEnabledForMapping: {
    id: 'projects.formInputs.custom_editor.enabled.mapping',
    defaultMessage: 'Enabled for mapping',
  },
  customEditorEnabledForValidation: {
    id: 'projects.formInputs.custom_editor.enabled.validation',
    defaultMessage: 'Enabled for validation',
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
  noMappingEditor: {
    id: 'projects.formInputs.noMappingEditor',
    defaultMessage: 'At least one editor must be enabled for mapping',
  },
  noValidationEditor: {
    id: 'projects.formInputs.noValidationEditor',
    defaultMessage: 'At least one editor must be enabled for validation',
  },
  extraIdParams: {
    id: 'projects.formInputs.extraIdParams',
    defaultMessage: 'Additional iD URL parameters',
  },
  extraIdParamsDescription: {
    id: 'projects.formInputs.extraIdParams.description',
    defaultMessage:
      'Any additional URL parameters that you want include when loading iD editor (both the embedded and the external ones). Use & to separate different parameters. Example: {text}.',
  },
  extraIdParamsDescriptionLink: {
    id: 'projects.formInputs.extraIdParams.description.link',
    defaultMessage: 'Check the {link} for more information.',
  },
  iDAPIDocs: {
    id: 'projects.formInputs.extraIdParams.iDAPIDocs',
    defaultMessage: 'iD editor documentation',
  },
});
