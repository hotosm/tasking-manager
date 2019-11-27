import { defineMessages } from 'react-intl';

/**
 * Internationalized messages for use on header.
 */
export default defineMessages({
  createProject: {
    id: 'management.project.create.title',
    defaultMessage:
      'Create project',
  },
  areaSize: {
    id: 'management.project.create.areaSize',
    defaultMessage:
      'Area size: {area} km{sq}',
  },
  taskNumber: {
    id: 'management.project.create.tasks',
    defaultMessage:
      'Number of tasks: {n}',
  },
  step1: {
    id: 'management.project.create.steps.1',
    defaultMessage:
      'Step 1: define area',
  },
  step2: {
    id: 'management.project.create.steps.2',
    defaultMessage:
      'Step 2: Set tasks sizes',
  },
  step3: {
    id: 'management.project.create.steps.3',
    defaultMessage:
      'Step 3: Trim task grid',
  },
  step4: {
    id: 'management.project.create.steps.4',
    defaultMessage:
      'Step 4: Review',
  },
  name: {
    id: 'management.project.create.review_tasks.name',
    defaultMessage: 'Name',
  },
  create: {
    id: 'management.project.create.review_tasks.button.create',
    defaultMessage: 'Create',
  },
  reviewTaskNumberMessage: {
    id: 'management.project.create.review_tasks.number',
    defaultMessage:
      'Your project will be created with {n} tasks.',
  },
  task: {
    id: 'management.project.create.review_tasks.task',
    defaultMessage: 'task',
  },
  tasks: {
    id: 'management.project.create.review_tasks.tasks',
    defaultMessage: 'tasks',
  },
  trimTasksDescriptionLine1: {
    id: 'management.project.create.trim_tasks.description.1',
    defaultMessage:
      'Trim the task grid to the area of interest (optional).',
  },
  trimTasksDescriptionLine2: {
    id: 'management.project.create.trim_tasks.description.2',
    defaultMessage:
      'You can keep all the current tasks, or clip them to the area of interest of your project. This can take some time to execute.',
  },
  trimToAOI: {
    id: 'management.project.create.trim_tasks.description.2',
    defaultMessage:
      'Clip tasks to the Area of Interest',
  },
  taskSizes: {
    id: 'management.project.create.task_sizes.description',
    defaultMessage:
      'General task size',
  },
  smaller: {
    id: 'management.project.create.task_sizes.smaller',
    defaultMessage:
      'Smaller',
  },
  larger: {
    id: 'management.project.create.task_sizes.larger',
    defaultMessage:
      'Larger',
  },
  splitTaskDescription: {
    id: 'management.project.create.split_task.description',
    defaultMessage:
      'Make tasks smaller by clicking on specific tasks or drawing an area on the map.',
  },
  reset: {
    id: 'management.project.create.reset.button',
    defaultMessage:
      'Reset',
  },
  taskNumberMessage: {
    id: 'management.project.create.split.tasks.numer',
    defaultMessage:
      'A new project will be created with {n} tasks.',
  },
  taskAreaMessage: {
    id: 'management.project.create.split.tasks.area',
    defaultMessage:
      'The size of each task is approximately {area} km{sq}.',
  },
  splitByDrawing: {
    id: 'management.project.create.split_task.draw.button',
    defaultMessage:
      'Draw area to split',
  },
  splitByClicking: {
    id: 'management.project.create.split_task.click.button',
    defaultMessage:
      'Click to split',
  },
  uploadError: {
    id: 'management.project.create.upload_file.error',
    defaultMessage:
      'Error when importing geometry. Verify if the file you uploaded is correct.',
  },
  backToPrevious: {
    id: 'management.project.create.button.back',
    defaultMessage:
      'Back to previous',
  },
  next: {
    id: 'management.project.create.button.next',
    defaultMessage:
      'Next',
  },
  trim: {
    id: 'management.project.create.button.trim',
    defaultMessage:
      'Trim',
  },
  draw: {
    id: 'management.project.create.button.draw',
    defaultMessage:
      'Draw',
  },
  uploadFile: {
    id: 'management.project.create.button.upload_file',
    defaultMessage:
      'Upload file',
  },
  deleteArea: {
    id: 'management.project.create.button.delete_area',
    defaultMessage:
      'Delete area',
  },
  arbitraryTasks: {
    id: 'management.project.create.arbitrary_tasks',
    defaultMessage:
      'Arbitrary tasks',
  },
  drawDescription: {
    id: 'management.project.create.draw.description',
    defaultMessage:
      'Draw the Area of Interest on the map.',
  },
  importDescription: {
    id: 'management.project.create.upload.description',
    defaultMessage:
      'Import a GeoJSON, KML, OSM or zipped SHP file.',
  },
  option1: {
    id: 'management.project.create.options.1',
    defaultMessage:
      'Option 1',
  },
  option2: {
    id: 'management.project.create.options.2',
    defaultMessage:
      'Option 2',
  },
});
