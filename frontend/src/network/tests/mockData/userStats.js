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

export const ohsomeNowUserStats = {
  result: {
    building_count: 2,
    road_length: 572.750505196795,
    edits: 12618,
    user_id: 10291369,
    object_edits: 291,
  },
};

export const osmStatsProject = {
  result: {
    changesets: 987654321,
    users: 112,
    roads: 5658.62006919192,
    buildings: 12923,
    edits: 123456789,
    latest: '2020-10-05T23:21:22.000Z',
  },
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
