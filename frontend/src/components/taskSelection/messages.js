import { defineMessages } from 'react-intl';

/**
 * Internationalized messages for use on header.
 */
export default defineMessages({
  createBy: {
    id: 'project.createdBy',
    defaultMessage: '{id} | Created by {user}',
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
  taskLastUpdate: {
    id: 'project.tasks.list.lastUpdate',
    defaultMessage: 'Last updated by {user}',
  },
  taskStatus_READY: {
    id: 'project.tasks.status.ready',
    defaultMessage: 'Ready to map',
  },
  taskStatus_MAPPED: {
    id: 'project.tasks.status.mapped',
    defaultMessage: 'Mapped',
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
    defaultMessage: 'Validated',
  },
  taskStatus_INVALIDATED: {
    id: 'project.tasks.status.invalidated',
    defaultMessage: 'Invalidated',
  },
  taskStatus_BADIMAGERY: {
    id: 'project.tasks.status.badImagery',
    defaultMessage: 'Bad imagery',
  },
  taskStatus_SPLIT: {
    id: 'project.tasks.status.split',
    defaultMessage: 'Splitted',
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
    defaultMessage: 'Ready to validate',
  },
  filterReadyToMap: {
    id: 'project.tasks.filter.readyToMap',
    defaultMessage: 'Ready to map',
  },
});
