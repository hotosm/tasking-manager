import { defineMessages } from 'react-intl';

/**
 * Internationalized messages for use on project creation.
 */
export default defineMessages({
  createProject: {
    id: 'management.projects.create.title',
    defaultMessage: 'Create new project',
  },
  cloneProject: {
    id: 'management.projects.clone.message',
    defaultMessage: 'The new project will be a clone of the project #{id} ({name}).',
  },
  clone: {
    id: 'management.projects.create.clone',
    defaultMessage: 'Clone',
  },
  areaSize: {
    id: 'management.projects.create.area_size',
    defaultMessage: 'Area size: {area} km{sq}',
  },
  areaOverLimitError: {
    id: 'management.projects.create.area_error',
    defaultMessage: 'Project area is higher than {n} squared kilometers.',
  },
  taskNumber: {
    id: 'management.projects.create.tasks',
    defaultMessage: 'Number of tasks: {n}',
  },
  step1: {
    id: 'management.projects.create.steps.1',
    defaultMessage: 'Step 1: define area',
  },
  step2: {
    id: 'management.projects.create.steps.2',
    defaultMessage: 'Step 2: set tasks sizes',
  },
  step3: {
    id: 'management.projects.create.steps.3',
    defaultMessage: 'Step 3: trim task grid',
  },
  step4: {
    id: 'management.projects.create.steps.4',
    defaultMessage: 'Step 4: review',
  },
  name: {
    id: 'management.projects.create.review_tasks.name',
    defaultMessage: 'Name',
  },
  organization: {
    id: 'management.projects.create.review_tasks.organization',
    defaultMessage: 'Organization',
  },
  creationFailed: {
    id: 'management.projects.create.review_tasks.failure.message',
    defaultMessage: 'It was not possible to save your project due to an error: {error}',
  },
  create: {
    id: 'management.projects.create.review_tasks.button.create',
    defaultMessage: 'Create',
  },
  reviewTaskNumberMessage: {
    id: 'management.projects.create.review_tasks.number',
    defaultMessage: 'Your project will be created with {n} tasks.',
  },
  task: {
    id: 'management.projects.create.review_tasks.task',
    defaultMessage: 'task',
  },
  tasks: {
    id: 'management.projects.create.review_tasks.tasks',
    defaultMessage: 'tasks',
  },
  trimTasksDescriptionLine1: {
    id: 'management.projects.create.trim_tasks.description.1',
    defaultMessage: 'Trim the task grid to the area of interest (optional).',
  },
  trimTasksDescriptionLine2: {
    id: 'management.projects.create.trim_tasks.description.2',
    defaultMessage:
      'You can keep the current tasks or trim the area for your project. This can take some time to execute.',
  },
  trimToAOI: {
    id: 'management.projects.create.trim_tasks.trim_to_aoi',
    defaultMessage: 'Trim the tasks to define the exact Area of Interest for mapping.',
  },
  tinyTasks: {
    id: 'management.projects.create.trim_tasks.tiny_tasks',
    defaultMessage:
      '{number, plural, one {There is # task smaller than {area}m². Would you like to discard it?} other {There are # tasks smaller than {area}m². Would you like to discard them?}}',
  },
  discard: {
    id: 'management.projects.create.trim_tasks.tiny_tasks.discard',
    defaultMessage: 'Discard',
  },
  taskSizes: {
    id: 'management.projects.create.task_sizes.description',
    defaultMessage: 'General task size',
  },
  smaller: {
    id: 'management.projects.create.task_sizes.smaller',
    defaultMessage: 'Smaller',
  },
  larger: {
    id: 'management.projects.create.task_sizes.larger',
    defaultMessage: 'Larger',
  },
  invalidFile: {
    id: 'management.projects.create.errors.invalid',
    defaultMessage:
      'It was not possible to read the geometries on the file. Verify it and upload again.',
  },
  unsupportedGeom: {
    id: 'management.projects.create.errors.unsupported_geom',
    defaultMessage: 'Unsupported geometry type {geometry}',
  },
  noFeatureCollection: {
    id: 'management.projects.create.errors.no_featurecollection',
    defaultMessage: 'type field is not FeatureCollection',
  },
  closedLinestring: {
    id: 'management.projects.create.errors.closed_linestring',
    defaultMessage: 'Points do not form a closed linestring',
  },
  noGeometry: {
    id: 'management.projects.create.errors.no_geometry',
    defaultMessage: "You need to define the project's area of interest.",
  },
  noOrganization: {
    id: 'management.projects.create.errors.no_organization',
    defaultMessage: 'Organization is a required field.',
  },
  fileSize: {
    id: 'management.projects.create.errors.fileSize',
    defaultMessage:
      'We only accept files up to {fileSize} MB. Please reduce the size of your file and try again.',
  },
  splitTaskDescription: {
    id: 'management.projects.create.split_task.description',
    defaultMessage:
      'Make tasks smaller by clicking on specific tasks or drawing an area on the map.',
  },
  reset: {
    id: 'management.projects.create.reset.button',
    defaultMessage: 'Reset',
  },
  showProjectsAOILayer: {
    id: 'management.projects.create.show_aois',
    defaultMessage: 'Show existing projects AoIs',
  },
  disabledAOILayer: {
    id: 'management.projects.create.show_aois.disabled',
    defaultMessage:
      "Zoom in to be able to activate the visualization of other projects' areas of interest.",
  },
  enableAOILayer: {
    id: 'management.projects.create.show_aois.enable',
    defaultMessage: "Enable the visualization of the existing projects' areas of interest.",
  },
  colorLegend: {
    id: 'management.projects.create.show_aois.legend',
    defaultMessage: 'Color legend:',
  },
  taskNumberMessage: {
    id: 'management.projects.create.split.tasks.number',
    defaultMessage: 'A new project will be created with {n} tasks.',
  },
  taskAreaMessage: {
    id: 'management.projects.create.split.tasks.area',
    defaultMessage: 'The size of each task is approximately {area} km{sq}.',
  },
  splitByDrawing: {
    id: 'management.projects.create.split_task.draw.button',
    defaultMessage: 'Draw area to split',
  },
  splitByClicking: {
    id: 'management.projects.create.split_task.click.button',
    defaultMessage: 'Click to split',
  },
  uploadError: {
    id: 'management.projects.create.upload_file.error',
    defaultMessage: 'Error when importing geometry. Verify if the file you uploaded is correct.',
  },
  backToPrevious: {
    id: 'management.projects.create.button.back',
    defaultMessage: 'Back to previous',
  },
  next: {
    id: 'management.projects.create.button.next',
    defaultMessage: 'Next',
  },
  trim: {
    id: 'management.projects.create.button.trim',
    defaultMessage: 'Trim',
  },
  trimError: {
    id: 'management.projects.create.trimError',
    defaultMessage: 'An error occured while trimming the geometry.',
  },
  SelfIntersectingAOIError: {
    id: 'management.projects.create.SelfIntersectingAOIError',
    defaultMessage: 'Invalid geometry - polygon is self intersecting.',
  },
  draw: {
    id: 'management.projects.create.button.draw',
    defaultMessage: 'Draw',
  },
  selectFile: {
    id: 'management.projects.create.button.select_file',
    defaultMessage: 'Select file',
  },
  arbitraryTasks: {
    id: 'management.projects.create.arbitrary_tasks',
    defaultMessage: 'Set tasks using uploaded polygons',
  },
  defineAreaDescription: {
    id: 'management.projects.create.draw.description',
    defaultMessage: 'Draw the Area of Interest on the map or import a file.',
  },
  importDescription: {
    id: 'management.projects.create.upload.description',
    defaultMessage:
      'The supported file formats are: GeoJSON, KML, OSM or zipped Shapefile. You can drag and drop a file over the map to import it.',
  },
});
