import { formatISO } from 'date-fns';

export const newUsersStats = {
  total: 1044,
  beginner: 1034,
  intermediate: 2,
  advanced: 8,
  contributed: 371,
  emailVerified: 269,
  genders: { male: 158, female: 130, preferNotIdentify: 23, selfDescribe: 0 },
};

export const userStats = {
  totalTimeSpent: 652752,
  timeSpentMapping: 531841,
  timeSpentValidating: 120911,
  projectsMapped: 1,
  countriesContributed: {
    countries: [
      {
        name: 'Nepal',
        mapped: 21,
        validated: 9,
        total: 30,
      },
      {
        name: 'Philippines',
        mapped: 7,
        validated: 9,
        total: 16,
      },
    ],
    total: 7,
  },
  contributionsByDay: [
    {
      date: '2023-01-04',
      count: 1,
    },
    {
      date: '2022-12-19',
      count: 1,
    },
    {
      date: '2022-11-30',
      count: 4,
    },
    {
      date: '2022-11-16',
      count: 11,
    },
  ],
  tasksMapped: 32,
  tasksValidated: 22,
  tasksInvalidated: 11,
  tasksInvalidatedByOthers: 3,
  tasksValidatedByOthers: 7,
  ContributionsByInterest: [
    {
      id: 2,
      name: 'other',
      countProjects: 4,
    },
    {
      id: 16,
      name: 'general public health',
      countProjects: 2,
    },
  ],
};

export const osmStatsProd = {
  id: 10291369,
  name: 'helnershingthapa',
  changesets: '361',
  geo_extent: null,
  total_building_count_add: 6771,
  total_building_count_mod: 786,
  total_waterway_count_add: 2,
  total_poi_count_add: 81,
  total_road_km_add: 29.0827659890004,
  total_road_km_mod: 34.4722514676097,
  total_waterway_km_add: 0.497270130447684,
  total_josm_edit_count: 298,
  total_gps_trace_count_add: 0,
  total_gps_trace_updated_from_osm: 0,
  total_road_count_add: 59,
  total_road_count_mod: 250,
  total_tm_done_count: 0,
  total_tm_val_count: 0,
  total_tm_inval_count: 0,
  badges: [
    {
      updated_at: '2020-11-20T12:29:36.265Z',
      id: 11,
      category: 4,
      level: 2,
      name: 'The Wright Stuff',
    },
    {
      updated_at: '2021-08-11T13:05:02.367Z',
      id: 12,
      category: 4,
      level: 3,
      name: 'The Wright Stuff',
    },
    {
      updated_at: '2022-12-28T08:23:30.755Z',
      id: 26,
      category: 9,
      level: 2,
      name: 'World Renown',
    },
  ],
  changeset_count: 361,
  latest: {
    id: '130862065',
    road_count_add: 0,
    road_count_mod: 1,
    building_count_add: 7,
    building_count_mod: 2,
    waterway_count_add: 0,
    poi_count_add: 0,
    gpstrace_count_add: 0,
    road_km_add: 0,
    road_km_mod: 0.00768819386078029,
    waterway_km_add: 0,
    gpstrace_km_add: 0,
    editor: 'JOSM/1.5 (18583 en)',
    user_id: 10291369,
    created_at: '2023-01-04T11:15:22.000Z',
    countries: [
      {
        id: 175,
        name: 'Nepal',
        code: 'NPL',
      },
    ],
    hashtags: [
      {
        id: 4,
        hashtag: 'awesome',
      },
      {
        id: 2101,
        hashtag: 'hot',
      },
      {
        id: 14913965,
        hashtag: 'ootd',
      },
      {
        id: 17849271,
        hashtag: 'art',
      },
    ],
  },
  edit_times: [
    '2019-09-11T00:00:00.000Z',
    '2019-09-12T00:00:00.000Z',
    '2019-11-15T00:00:00.000Z',
    '2020-01-27T00:00:00.000Z',
    '2020-02-28T00:00:00.000Z',
    '2020-11-20T00:00:00.000Z',
    '2021-02-01T00:00:00.000Z',
    '2021-02-04T00:00:00.000Z',
    '2021-02-12T00:00:00.000Z',
    '2021-02-14T00:00:00.000Z',
  ],
  country_count: 3,
  country_list: {
    NPL: 248,
    MNG: 28,
    IND: 11,
  },
  hashtags: {
    awesome: 139,
    hot: 126,
    ootd: 97,
    art: 78,
  },
};

export const osmStatsProject = {
  changesets: 987654321,
  users: 112,
  roads: 5658.62006919192,
  buildings: 12923,
  edits: 123456789,
  latest: '2020-10-05T23:21:22.000Z',
  hashtag: `hotosm-project-1`,
};

export const userLockedTasksDetails = {
  tasks: [
    {
      taskId: 1997,
      projectId: 123,
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
    },
  ],
};

export const userMultipleLockedTasksDetails = {
  tasks: [
    {
      taskId: 1765,
      projectId: 5871,
      taskStatus: 'LOCKED_FOR_VALIDATION',
      lockHolder: 'helnershingthapa',
      taskHistory: [
        {
          historyId: 10764882,
          taskId: null,
          action: 'LOCKED_FOR_VALIDATION',
          actionText: null,
          actionDate: '2023-03-27T06:04:11.910738Z',
          actionBy: 'helnershingthapa',
          pictureUrl:
            'https://www.openstreetmap.org/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBNXQ2Q3c9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--fe41f1b2a5d6cf492a7133f15c81f105dec06ff7/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaDdCem9MWm05eWJXRjBPZ2h3Ym1jNkZISmxjMmw2WlY5MGIxOXNhVzFwZEZzSGFXbHBhUT09IiwiZXhwIjpudWxsLCJwdXIiOiJ2YXJpYXRpb24ifX0=--058ac785867b32287d598a314311e2253bd879a3/unnamed.webp',
          issues: null,
        },
        {
          historyId: 10534983,
          taskId: null,
          action: 'COMMENT',
          actionText: 'This is a sample comment.',
          actionDate: '2020-04-18T12:28:34.889677Z',
          actionBy: 'commenter',
          pictureUrl: null,
          issues: null,
        },
      ],
      taskAnnotation: [],
      perTaskInstructions: '',
      autoUnlockSeconds: 7200,
      lastUpdated: formatISO(new Date()),
      numberOfComments: null,
    },
    {
      taskId: 1829,
      projectId: 5871,
      taskStatus: 'LOCKED_FOR_VALIDATION',
      lockHolder: 'helnershingthapa',
      taskHistory: [
        {
          historyId: 10764881,
          taskId: null,
          action: 'LOCKED_FOR_VALIDATION',
          actionText: null,
          actionDate: '2023-03-27T06:04:11.844339Z',
          actionBy: 'helnershingthapa',
          pictureUrl:
            'https://www.openstreetmap.org/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBNXQ2Q3c9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--fe41f1b2a5d6cf492a7133f15c81f105dec06ff7/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaDdCem9MWm05eWJXRjBPZ2h3Ym1jNkZISmxjMmw2WlY5MGIxOXNhVzFwZEZzSGFXbHBhUT09IiwiZXhwIjpudWxsLCJwdXIiOiJ2YXJpYXRpb24ifX0=--058ac785867b32287d598a314311e2253bd879a3/unnamed.webp',
          issues: null,
        },
      ],
      taskAnnotation: [],
      perTaskInstructions: '',
      autoUnlockSeconds: 7200,
      lastUpdated: '2023-03-27T06:04:11.844339Z',
      numberOfComments: null,
    },
  ],
};
