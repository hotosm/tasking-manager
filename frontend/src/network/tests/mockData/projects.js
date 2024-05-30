import { TM_DEFAULT_CHANGESET_COMMENT } from '../../../config';
import { formatISO, nextDay } from 'date-fns';

export const PROJECT_ID_WITH_RANDOM_TASK_ENFORCED = 963;
export const PROJECT_ID_ALL_VALIDATED = 6;
export const PROJECT_ID_ALL_MAPPED = 3;

const status = {
  [PROJECT_ID_ALL_VALIDATED]: {
    mappedPercent: 100,
    validatedPercent: 100,
  },
  [PROJECT_ID_ALL_MAPPED]: {
    mappedPercent: 100,
  },
};

export const getProjectSummary = (id) => ({
  projectId: id,
  defaultLocale: 'en',
  author: 'test_user',
  created: '2019-08-27T12:18:07.186897Z',
  dueDate: '2020-04-07T12:20:42.460024Z',
  lastUpdated: '2020-06-22T10:16:16.076317Z',
  projectPriority: 'URGENT',
  campaigns: [
    {
      id: 3,
      name: 'Environment Conservation',
    },
    {
      id: 5,
      name: 'Women security',
    },
  ],
  organisation: 32,
  organisationName: 'HOT',
  organisationLogo: 'https://www.missingmaps.org/assets/graphics/content/logos/hot_logo.png',
  countryTag: ['Bolivia'],
  osmchaFilterId: '9322aa63-cccc-4d0d-9f93-403678e52345',
  mappingTypes: ['BUILDINGS'],
  changesetComment: `${TM_DEFAULT_CHANGESET_COMMENT}-${id} #brumado-buildings`,
  percentMapped: status[id]?.mappedPercent || 16,
  percentValidated: status[id]?.validatedPercent || 6,
  percentBadImagery: 0,
  aoiCentroid: {
    type: 'Point',
    coordinates: [-41.669134813, -14.20341561],
  },
  difficulty: 'EASY',
  mappingPermission: 'ANY',
  validationPermission: 'LEVEL',
  allowedUsernames: [],
  enforceRandomTaskSelection: id === PROJECT_ID_WITH_RANDOM_TASK_ENFORCED,
  private: false,
  teams: [],
  projectInfo: {
    locale: 'en',
    name: 'La Paz Buildings',
    shortDescription: 'La Paz buildings mapping  [here](http://localhost:8111/import).',
    description: 'La Paz buildings mapping  [here](http://localhost:8111/import).',
    instructions:
      'Project Specific Mapping Notes: Bing appears to be the best imagery for the area, you may need to align it with GPS or existing roads, but will likely need to adjust the roads with this better/most recent imagery.* `Please improve existing incorrectly mapped elements by moving and adjusting, rather than deleting, if they do not line up with the imagery.`',
    perTaskInstructions:
      'This task involves loading extra data. Click [here](http://localhost:8111/import?new_layer=true&amp;url=http://www.domain.com/data/{x}/{y}/{z}/routes_2009.osm) to load the data into JOSM.',
  },
  shortDescription: null,
  status: 'PUBLISHED',
  imagery: null,
  licenseId: null,
  idPresets: ['building/house', 'building/residential', 'building'],
  mappingEditors: ['ID', 'JOSM'],
  validationEditors: ['JOSM', 'POTLATCH_2', 'FIELD_PAPERS', 'ID'],
});

export const getProjectStats = (id) => ({
  projectId: Number(id),
  'projectArea(in sq.km)': 3506.03997973834,
  totalMappers: 105,
  totalTasks: 2779,
  totalComments: 47,
  totalMappingTime: 2186584,
  totalValidationTime: 589857,
  totalTimeSpent: 2776441,
  averageMappingTime: 679.2743087915502,
  averageValidationTime: 202.14427690198767,
  percentMapped: 100,
  percentValidated: 100,
  percentBadImagery: 0,
  aoiCentroid: {
    type: 'Point',
    coordinates: [-7.56545195794146, 13.0603087530714],
  },
  timeToFinishMapping: 0,
  timeToFinishValidating: 0,
});

export const projects = {
  mapResults: [],
  results: [
    {
      projectId: 7935,
      locale: 'en',
      name: 'NRCS_Duduwa Mapping',
      shortDescription:
        'Nepal Red Cross society is mapping Duduwa Rural municipality under the Preparedness For Emergency Response  programme. The current Action is a continuation and consolidation of the previous two projects aiming at enhancing preparedness for emergency response through the development and establishment of national systems and mechanisms, in line with the new Federal structure and in the framework of the DRR/M Act (2074). \nThe Action is in line with the DG ECHO in terms of Preparedness for emergency response in the Western Parts.',
      difficulty: 'EASY',
      priority: 'MEDIUM',
      organisationName: 'IFRC',
      organisationLogo: 'https://dummyimage.com/600x400/000/fff',
      campaigns: [{ id: 74, name: 'Banke Nepal' }],
      percentMapped: 75,
      percentValidated: 5,
      status: 'PUBLISHED',
      activeMappers: 0,
      lastUpdated: '2020-05-01T11:03:43.689732Z',
      dueDate: nextDay(new Date(), 1),
      totalContributors: 50,
      country: ['Nepal'],
    },
    {
      projectId: 8006,
      locale: 'en',
      name: 'NRCS_Khajura Mapping',
      shortDescription:
        'Nepal Red Cross society is mapping Khajura Rural municipality under the Preparedness For Emergency Response  programme. The current Action is a continuation and consolidation of the previous two projects aiming at enhancing preparedness for emergency response through the development and establishment of national systems and mechanisms, in line with the new Federal structure and in the framework of the DRR/M Act (2074). \nThe Action is in line with the DG ECHO in terms of Preparedness for emergency response in the Western Parts.',
      difficulty: 'EASY',
      priority: 'MEDIUM',
      organisationName: 'IFRC',
      organisationLogo: null,
      campaigns: [{ id: 74, name: 'Banke Nepal' }],
      percentMapped: 87,
      percentValidated: 0,
      status: 'DRAFT',
      activeMappers: 0,
      lastUpdated: '2020-04-26T12:28:30.870191Z',
      dueDate: null,
      totalContributors: 79,
      country: ['Nepal'],
    },
  ],
  pagination: {
    hasNext: false,
    hasPrev: false,
    nextNum: null,
    page: 1,
    pages: 1,
    prevNum: null,
    perPage: 14,
    total: 2,
  },
};

export const projectDetail = {
  projectId: 8653,
  status: 'PUBLISHED',
  projectPriority: 'URGENT',
  areaOfInterest: {
    type: 'MultiPolygon',
    coordinates: [
      [
        [
          [83.771175, 28.095768],
          [83.773586, 28.095757],
          [83.773428, 28.094146],
          [83.770834, 28.094479],
          [83.771175, 28.095768],
        ],
      ],
    ],
  },
  aoiBBOX: [83.770834, 28.094146, 83.773586, 28.095768],
  tasks: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'MultiPolygon',
          coordinates: [
            [
              [
                [83.771175, 28.095768],
                [83.773586, 28.095757],
                [83.773428, 28.094146],
                [83.770834, 28.094479],
                [83.771175, 28.095768],
              ],
            ],
          ],
        },
        properties: {
          taskId: 1,
          taskX: 48018,
          taskY: 38100,
          taskZoom: 16,
          taskIsSquare: false,
          taskStatus: 'READY',
          lockedBy: null,
          mappedBy: null,
        },
      },
    ],
  },
  defaultLocale: 'it',
  projectInfo: {
    locale: 'en',
    name: 'Sample Project',
    shortDescription: 'Test short description italian',
    description: 'Test description',
    instructions: 'Testing detailed instructions',
    perTaskInstructions: 'Tests',
  },
  projectInfoLocales: [
    {
      locale: 'en',
      name: 'Test',
      shortDescription: 'Test short description italian',
      description: 'Test description',
      instructions: 'Testing detailed instructions',
      perTaskInstructions: 'Tests',
    },
    {
      locale: 'it',
      name: 'ddd',
      shortDescription: 'sdsddsd',
      description: 'ddsdsdsd',
      instructions: 'dfsfsdfds',
      perTaskInstructions: '',
    },
  ],
  difficulty: 'EASY',
  mappingPermission: 'ANY',
  validationPermission: 'LEVEL',
  enforceRandomTaskSelection: false,
  private: false,
  changesetComment: '#hot-tm-stage-project-8653',
  osmchaFilterId: null,
  dueDate: null,
  imagery: null,
  idPresets: null,
  extraIdParams: null,
  rapidPowerUser: false,
  mappingTypes: ['ROADS', 'BUILDINGS'],
  campaigns: [],
  organisation: 42,
  organisationName: 'Kathmandu Living Labs',
  organisationSlug: 'kathmandu-living-labs',
  organisationLogo: 'https://cdn.hotosm.org/tasking-manager/uploads/1652896455106_main-logo.png',
  countryTag: ['Nepal'],
  licenseId: null,
  allowedUsernames: [],
  priorityAreas: [
    {
      type: 'Polygon',
      coordinates: [
        [
          [83.771758319, 28.095285382],
          [83.772567059, 28.095301974],
          [83.772523174, 28.094837405],
          [83.771689356, 28.094876119],
          [83.771758319, 28.095285382],
        ],
      ],
    },
  ],
  created: '2022-05-19T04:59:47.310401Z',
  lastUpdated: '2023-01-16T04:39:46.201406Z',
  author: 'Aadesh Baral',
  activeMappers: 0,
  percentMapped: 0,
  percentValidated: 0,
  percentBadImagery: 0,
  taskCreationMode: 'GRID',
  teams: [],
  mappingEditors: ['ID', 'JOSM', 'CUSTOM'],
  validationEditors: ['ID', 'JOSM', 'CUSTOM'],
  interests: [],
};

export const userTouchedProjects = {
  mappedProjects: [
    {
      projectId: 8629,
      name: 'tessttt',
      tasksMapped: 1,
      tasksValidated: 0,
      status: 'DRAFT',
      centroid: {
        type: 'Point',
        coordinates: [47.119799174, 14.300025921],
      },
    },
  ],
};

export const taskDetail = (taskId) => ({
  taskId: taskId,
  projectId: 5871,
  taskStatus: 'LOCKED_FOR_MAPPING',
  lockHolder: 'helnershingthapa',
  taskHistory: [
    {
      historyId: 10764790,
      taskId: null,
      action: 'LOCKED_FOR_MAPPING',
      actionText: null,
      actionDate: '2023-03-16T16:49:29.977470Z',
      actionBy: 'helnershingthapa',
      pictureUrl:
        'https://www.openstreetmap.org/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBNXQ2Q3c9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--fe41f1b2a5d6cf492a7133f15c81f105dec06ff7/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaDdCem9MWm05eWJXRjBPZ2h3Ym1jNkZISmxjMmw2WlY5MGIxOXNhVzFwZEZzSGFXbHBhUT09IiwiZXhwIjpudWxsLCJwdXIiOiJ2YXJpYXRpb24ifX0=--058ac785867b32287d598a314311e2253bd879a3/unnamed.webp',
      issues: null,
    },
  ],
  taskAnnotation: [],
  perTaskInstructions: '',
  autoUnlockSeconds: 7200,
  lastUpdated: formatISO(new Date()),
  numberOfComments: null,
});

export const projectComments = {
  chat: [
    {
      id: 1,
      message:
        "<p>@happy_me we do want 'significant' roads that lead to houses. Rule of thumb I use for picking classification is the usage over condition/what it looks like. If it's the main 'path' to one or maybe several homes, I would pick service; even if a vehicle can't drive it, that can be reflected with additional tags, but the road still functions as access to the home(s).</p>",
      pictureUrl:
        'https://www.openstreetmap.org/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBNXQ2Q3c9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--fe41f1b2a5d6cf492a7133f15c81f105dec06ff7/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaDdCem9MWm05eWJXRjBPZ2h3Ym1jNkZISmxjMmw2WlY5MGIxOXNhVzFwZEZzSGFXbHBhUT09IiwiZXhwIjpudWxsLCJwdXIiOiJ2YXJpYXRpb24ifX0=--058ac785867b32287d598a314311e2253bd879a3/unnamed.webp',
      timestamp: '2023-01-10T05:44:34.724909Z',
      username: 'helnershingthapa',
    },
    {
      id: 2,
      message: '<p>hello world</p>',
      pictureUrl:
        'https://www.openstreetmap.org/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBNXQ2Q3c9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--fe41f1b2a5d6cf492a7133f15c81f105dec06ff7/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaDdCem9MWm05eWJXRjBPZ2h3Ym1jNkZISmxjMmw2WlY5MGIxOXNhVzFwZEZzSGFXbHBhUT09IiwiZXhwIjpudWxsLCJwdXIiOiJ2YXJpYXRpb24ifX0=--058ac785867b32287d598a314311e2253bd879a3/unnamed.webp',
      timestamp: '2023-01-03T10:54:25.805150Z',
      username: 'helnershingthapa',
    },
    {
      id: 3,
      message: '<p>asdadadasdasdasd</p>',
      pictureUrl:
        'https://www.openstreetmap.org/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBeFJheFE9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--a765e2377a288bccae85da6604300251d9de6d39/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaDdCem9MWm05eWJXRjBTU0lJYW5CbkJqb0dSVlE2RkhKbGMybDZaVjkwYjE5c2FXMXBkRnNIYVdscGFRPT0iLCJleHAiOm51bGwsInB1ciI6InZhcmlhdGlvbiJ9fQ==--1d22b8d446683a272d1a9ff04340453ca7c374b4/bitmoji.jpg',
      timestamp: '2022-10-19T09:32:52.231545Z',
      username: 'Hel Nershing Thapa',
    },
    {
      id: 4,
      message:
        '<p><code>test of \ncode block\nhmmm\npreview showed it as a block\nand monospace font\nbut not indented</code></p>',
      pictureUrl:
        'https://www.gravatar.com/avatar/496dcf6161e9a40e667788964f97e207.jpg?s=100&d=https%3A%2F%2Fwww.openstreetmap.org%2Fassets%2Favatar_large-54d681ddaf47c4181b05dbfae378dc0201b393bbad3ff0e68143c3d5f3880ace.png',
      timestamp: '2022-05-28T16:04:13.354064Z',
      username: 'wireguy',
    },
    {
      id: 5,
      message:
        '<p><code>this is a code\nblock\nshould it\nbe indented\nby 4 space?\nminor...</code></p>',
      pictureUrl:
        'https://www.gravatar.com/avatar/496dcf6161e9a40e667788964f97e207.jpg?s=100&d=https%3A%2F%2Fwww.openstreetmap.org%2Fassets%2Favatar_large-54d681ddaf47c4181b05dbfae378dc0201b393bbad3ff0e68143c3d5f3880ace.png',
      timestamp: '2022-05-28T16:03:05.964483Z',
      username: 'wireguy',
    },
  ],
  pagination: {
    hasNext: true,
    hasPrev: false,
    nextNum: 2,
    page: 1,
    pages: 3,
    prevNum: null,
    perPage: 5,
    total: 14,
  },
};

export const userFavorite = {
  favorited: false,
};

export const favoritePost = (id) => ({
  project_id: 123,
});

export const activities = (id) => {
  const isProjectValidated = id === PROJECT_ID_ALL_VALIDATED;
  return {
    activity: [
      {
        taskId: 1,
        taskStatus: isProjectValidated ? 'VALIDATED' : 'READY',
        actionDate: '2023-02-08T13:41:24.917474Z',
        actionBy: 'Patrik_B',
      },
      {
        taskId: 2,
        taskStatus: isProjectValidated ? 'VALIDATED' : 'READY',
        actionDate: '2022-11-16T08:31:56.917380Z',
        actionBy: 'helnershingthapa',
      },
      {
        taskId: 3,
        taskStatus: isProjectValidated ? 'VALIDATED' : 'READY',
        actionDate: '2023-02-28T06:10:55.329731Z',
        actionBy: 'helnershingthapa',
      },
      {
        taskId: 4,
        taskStatus: isProjectValidated ? 'VALIDATED' : 'INVALIDATED',
        actionDate: '2022-12-19T10:28:55.565213Z',
        actionBy: 'helnershingthapa',
      },
      {
        taskId: 5,
        taskStatus: isProjectValidated ? 'VALIDATED' : 'MAPPED',
        actionDate: '2022-11-30T05:36:43.518052Z',
        actionBy: 'Aadesh Baral',
      },
      {
        taskId: 6,
        taskStatus: id === 222 ? 'LOCKED_FOR_MAPPING' : isProjectValidated ? 'VALIDATED' : 'MAPPED',
        actionDate: '2022-11-22T05:36:43.518052Z',
        actionBy: 'Patrik_B',
      },
      {
        taskId: 7,
        taskStatus: 'VALIDATED',
        actionDate: '2022-11-16T08:31:56.897777Z',
        actionBy: 'helnershingthapa',
      },
    ],
  };
};

export const stopMapping = {
  taskId: 1997,
  projectId: 123,
  taskStatus: 'READY',
  taskHistory: [
    {
      historyId: 10764792,
      taskId: null,
      action: 'LOCKED_FOR_MAPPING',
      actionText: '00:00:29.484161',
      actionDate: '2023-03-19T14:57:58.038417Z',
      actionBy: 'helnershingthapa',
      pictureUrl:
        'https://www.openstreetmap.org/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBNXQ2Q3c9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--fe41f1b2a5d6cf492a7133f15c81f105dec06ff7/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaDdCem9MWm05eWJXRjBPZ2h3Ym1jNkZISmxjMmw2WlY5MGIxOXNhVzFwZEZzSGFXbHBhUT09IiwiZXhwIjpudWxsLCJwdXIiOiJ2YXJpYXRpb24ifX0=--058ac785867b32287d598a314311e2253bd879a3/unnamed.webp',
      issues: null,
    },
  ],
  taskAnnotation: [],
  perTaskInstructions: '',
  autoUnlockSeconds: 7200,
  lastUpdated: '2023-03-19T14:57:58.038417Z',
  numberOfComments: null,
};

export const stopValidation = {
  tasks: [
    {
      taskId: 1997,
      projectId: 123,
      taskStatus: 'MAPPED',
      taskHistory: [
        {
          historyId: 10764833,
          taskId: null,
          action: 'LOCKED_FOR_VALIDATION',
          actionText: '00:06:58.832787',
          actionDate: '2023-03-21T04:42:04.868220Z',
          actionBy: 'helnershingthapa',
          pictureUrl:
            'https://www.openstreetmap.org/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBNXQ2Q3c9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--fe41f1b2a5d6cf492a7133f15c81f105dec06ff7/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaDdCem9MWm05eWJXRjBPZ2h3Ym1jNkZISmxjMmw2WlY5MGIxOXNhVzFwZEZzSGFXbHBhUT09IiwiZXhwIjpudWxsLCJwdXIiOiJ2YXJpYXRpb24ifX0=--058ac785867b32287d598a314311e2253bd879a3/unnamed.webp',
          issues: null,
        },
      ],
      taskAnnotation: [],
      perTaskInstructions: '',
      autoUnlockSeconds: 7200,
      lastUpdated: '2023-03-21T04:42:04.868220Z',
      numberOfComments: null,
    },
  ],
};

export const similarProjects = {
  mapResults: [],
  results: [
    {
      projectId: 17,
      locale: 'en',
      name: 'Similar Project 1',
      shortDescription: 'asdasdasd',
      difficulty: 'MODERATE',
      priority: 'MEDIUM',
      organisationName: 'asdasdsadasdasd,ll,ll',
      organisationLogo: null,
      campaigns: [],
      percentMapped: 6,
      percentValidated: 0,
      status: 'PUBLISHED',
      activeMappers: 0,
      lastUpdated: '2023-06-28T10:45:01.841598Z',
      dueDate: null,
      totalContributors: 2,
      country: [],
    },
    {
      projectId: 14,
      locale: 'en',
      name: 'Similar Project 2',
      shortDescription: 'asdasd',
      difficulty: 'MODERATE',
      priority: 'MEDIUM',
      organisationName: 'MÉDECINS SANS FRONTIÈRES (MSF)',
      organisationLogo: null,
      campaigns: [],
      percentMapped: 0,
      percentValidated: 0,
      status: 'PUBLISHED',
      activeMappers: 0,
      lastUpdated: '2023-06-21T04:37:03.788468Z',
      dueDate: null,
      totalContributors: 1,
      country: ['Bolivia'],
    },
    {
      projectId: 16,
      locale: 'en',
      name: 'Newchi',
      shortDescription: 'asdasd',
      difficulty: 'EASY',
      priority: 'MEDIUM',
      organisationName: 'asdasdasdasdsssssss',
      organisationLogo: null,
      campaigns: [],
      percentMapped: 100,
      percentValidated: 0,
      status: 'PUBLISHED',
      activeMappers: 0,
      lastUpdated: '2023-06-26T11:02:31.390857Z',
      dueDate: null,
      totalContributors: 1,
      country: ['Brazil'],
    },
    {
      projectId: 18,
      locale: 'en',
      name: 'asdasdasd',
      shortDescription: 'asdasd',
      difficulty: 'MODERATE',
      priority: 'MEDIUM',
      organisationName: 'asdasdsadasdasd,ll,ll',
      organisationLogo: null,
      campaigns: [],
      percentMapped: 0,
      percentValidated: 0,
      status: 'PUBLISHED',
      activeMappers: 0,
      lastUpdated: '2023-07-06T06:22:12.105538Z',
      dueDate: null,
      totalContributors: 1,
      country: ['Peru'],
    },
  ],
  pagination: null,
};
