import { defineMessages } from 'react-intl';

/**
 * Internationalized messages for use on general components.
 */
export default defineMessages({
  language: {
    id: 'localeSelect.language',
    defaultMessage: 'Language',
  },
  selectOrganisation: {
    id: 'formInputs.organisation.select',
    defaultMessage: 'Select organization',
  },
  country: {
    id: 'formInputs.country.select',
    defaultMessage: 'Country',
  },
  definition: {
    id: 'foooter.definition',
    defaultMessage:
      'Tasking Manager is a platform where individuals can team up for mapping in OpenStreetMap',
  },
  credits: {
    id: 'footer.credits',
    defaultMessage:
      'Free and Open Source Software brought to you by the Humanitarian OpenStreetMap Team.',
  },
  learn: {
    id: 'footer.learn',
    defaultMessage: 'Learn more about OpenStreetMap.',
  },
  privacyPolicy: {
    id: 'footer.privacyPolicy',
    defaultMessage: 'Privacy Policy',
  },
  license: {
    id: 'footer.license',
    defaultMessage:
      'Images and screenshots of the Tasking Manager may be shared under a Creative Commons Attribution-Sharealike 4.0 International License',
  },
  mappingLevelALL: {
    id: 'mapping.level.all',
    defaultMessage: 'All levels',
  },
  mappingLevelADVANCED: {
    id: 'mapping.level.advanced',
    defaultMessage: 'Advanced mapper',
  },
  mappingLevelINTERMEDIATE: {
    id: 'mapping.level.intermediate',
    defaultMessage: 'Intermediate mapper',
  },
  mappingLevelBEGINNER: {
    id: 'mapping.level.beginner',
    defaultMessage: 'Beginner mapper',
  },
  difficultyALL: {
    id: 'mapping.difficulty.all',
    defaultMessage: 'All',
  },
  difficultyEASY: {
    id: 'mapping.difficulty.advanced',
    defaultMessage: 'Easy',
  },
  difficultyMODERATE: {
    id: 'mapping.difficulty.moderate',
    defaultMessage: 'Moderate',
  },
  difficultyCHALLENGING: {
    id: 'mapping.difficulty.beginner',
    defaultMessage: 'Challenging',
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
  pointsOfInterest: {
    id: 'project.typesOfMapping.pointsOfInterest',
    defaultMessage: 'Points of interest',
  },
  webglUnsupportedTitle: {
    id: 'browser.webgl.unsupported.title',
    defaultMessage: 'WebGL Context Not Found',
  },
  webglUnsupportedDescription: {
    id: 'browser.webgl.unsupported.description',
    defaultMessage:
      'Your browser does not support WebGL, which is required to render map components. Please try using a different browser or check that <a>WebGL is enabled</a>.',
  },
  loading: {
    id: 'common.loading',
    defaultMessage: 'Loading...',
  },
  gpxNameAttribute: {
    id: 'editor.layer.gpx.name',
    defaultMessage: 'Task for project {projectId}. Do not edit outside of this area!',
  },
});
