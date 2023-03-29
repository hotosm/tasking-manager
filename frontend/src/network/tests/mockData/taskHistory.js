export const history = {
  taskHistory: [
    {
      historyId: 11334,
      taskId: 1,
      action: 'STATE_CHANGE',
      actionText: 'VALIDATED',
      actionDate: '2020-09-04T14:35:20.174515Z',
      actionBy: 'user_123',
      pictureUrl: null,
      issues: null,
    },
    {
      historyId: 11333,
      taskId: 1,
      action: 'LOCKED_FOR_VALIDATION',
      actionText: '00:02:55.804611',
      actionDate: '2020-09-04T14:32:24.381482Z',
      actionBy: 'user_123',
      pictureUrl: null,
      issues: null,
    },
    {
      historyId: 5705,
      taskId: 1,
      action: 'STATE_CHANGE',
      actionText: 'MAPPED',
      actionDate: '2020-04-08T10:19:53.537193Z',
      actionBy: 'test_user',
      pictureUrl: null,
      issues: null,
    },
    {
      historyId: 5704,
      taskId: 1,
      action: 'LOCKED_FOR_MAPPING',
      actionText: '00:01:31.518133',
      actionDate: '2020-04-08T10:18:22.020469Z',
      actionBy: 'test_user',
      pictureUrl: null,
      issues: null,
    },
  ],
};

export const invalidatedTaskHistory = {
  taskHistory: [
    {
      historyId: 12001,
      taskId: 1,
      action: 'COMMENT',
      actionText: 'More buildings need to be mapped',
      actionDate: '2020-10-04T14:35:30.174515Z',
      actionBy: 'test_user',
      pictureUrl: null,
      issues: null,
    },
    {
      historyId: 12000,
      taskId: 1,
      action: 'STATE_CHANGE',
      actionText: 'INVALIDATED',
      actionDate: '2020-10-04T14:35:20.174515Z',
      actionBy: 'test_user',
      pictureUrl: null,
      issues: null,
    },
  ],
};

export const revertedBadImagery = {
  taskHistory: [
    {
      historyId: 999,
      taskId: 123,
      action: 'STATE_CHANGE',
      actionText: 'READY',
      actionDate: '2021-01-18T13:47:31.858248Z',
      actionBy: 'test_user',
      pictureUrl: null,
      issues: null,
    },
    {
      historyId: 998,
      taskId: 123,
      action: 'COMMENT',
      actionText: 'Undo state from BADIMAGERY to READY',
      actionDate: '2021-01-18T13:47:31.857840Z',
      actionBy: 'test_user',
      pictureUrl: null,
      issues: null,
    },
    {
      historyId: 997,
      taskId: 123,
      action: 'STATE_CHANGE',
      actionText: 'BADIMAGERY',
      actionDate: '2021-01-18T13:47:21.368475Z',
      actionBy: 'user_11',
      pictureUrl: null,
      issues: null,
    },
    {
      historyId: 996,
      taskId: 123,
      action: 'LOCKED_FOR_MAPPING',
      actionText: '00:00:05.111774',
      actionDate: '2021-01-18T13:47:16.258317Z',
      actionBy: 'user_1',
      pictureUrl: null,
      issues: null,
    },
  ],
};

export const lockForMapping = {
  taskId: 1802,
  projectId: 5871,
  taskStatus: 'LOCKED_FOR_MAPPING',
  lockHolder: 'helnershingthapa',
  taskHistory: [
    {
      historyId: 10764751,
      taskId: null,
      action: 'LOCKED_FOR_MAPPING',
      actionText: null,
      actionDate: '2023-03-07T08:43:12.178108Z',
      actionBy: 'helnershingthapa',
      pictureUrl:
        'https://www.openstreetmap.org/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBNXQ2Q3c9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--fe41f1b2a5d6cf492a7133f15c81f105dec06ff7/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaDdCem9MWm05eWJXRjBPZ2h3Ym1jNkZISmxjMmw2WlY5MGIxOXNhVzFwZEZzSGFXbHBhUT09IiwiZXhwIjpudWxsLCJwdXIiOiJ2YXJpYXRpb24ifX0=--058ac785867b32287d598a314311e2253bd879a3/unnamed.webp',
      issues: null,
    },
    {
      historyId: 10750564,
      taskId: null,
      action: 'LOCKED_FOR_MAPPING',
      actionText: '00:00:14.619301',
      actionDate: '2022-04-06T05:56:34.379010Z',
      actionBy: 'helnershingthapa',
      pictureUrl:
        'https://www.openstreetmap.org/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBNXQ2Q3c9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--fe41f1b2a5d6cf492a7133f15c81f105dec06ff7/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaDdCem9MWm05eWJXRjBPZ2h3Ym1jNkZISmxjMmw2WlY5MGIxOXNhVzFwZEZzSGFXbHBhUT09IiwiZXhwIjpudWxsLCJwdXIiOiJ2YXJpYXRpb24ifX0=--058ac785867b32287d598a314311e2253bd879a3/unnamed.webp',
      issues: null,
    },
    {
      historyId: 10514530,
      taskId: null,
      action: 'STATE_CHANGE',
      actionText: 'READY',
      actionDate: '2020-04-16T16:58:33.152865Z',
      actionBy: 'Jorieke V',
      pictureUrl:
        'https://www.openstreetmap.org/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBcWN0IiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--3c971c9b9634aced3526cefe8c0a1898771e1518/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaDdCem9MWm05eWJXRjBTU0lJYW5CbkJqb0dSVlE2RkhKbGMybDZaVjkwYjE5c2FXMXBkRnNIYVdscGFRPT0iLCJleHAiOm51bGwsInB1ciI6InZhcmlhdGlvbiJ9fQ==--1d22b8d446683a272d1a9ff04340453ca7c374b4/487940_10151143620978472_293967315_n.jpg',
      issues: null,
    },
  ],
  taskAnnotation: [],
  perTaskInstructions: '',
  autoUnlockSeconds: 7200,
  lastUpdated: '2023-03-07T08:43:12.178108Z',
  numberOfComments: null,
};

export const lockForValidation = {
  tasks: [
    {
      taskId: 1831,
      projectId: 5871,
      taskStatus: 'LOCKED_FOR_VALIDATION',
      lockHolder: 'helnershingthapa',
      taskHistory: [
        {
          historyId: 10764770,
          taskId: null,
          action: 'LOCKED_FOR_VALIDATION',
          actionText: null,
          actionDate: '2023-03-09T04:45:26.168804Z',
          actionBy: 'helnershingthapa',
          pictureUrl:
            'https://www.openstreetmap.org/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBNXQ2Q3c9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--fe41f1b2a5d6cf492a7133f15c81f105dec06ff7/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaDdCem9MWm05eWJXRjBPZ2h3Ym1jNkZISmxjMmw2WlY5MGIxOXNhVzFwZEZzSGFXbHBhUT09IiwiZXhwIjpudWxsLCJwdXIiOiJ2YXJpYXRpb24ifX0=--058ac785867b32287d598a314311e2253bd879a3/unnamed.webp',
          issues: null,
        },
        {
          historyId: 10749252,
          taskId: null,
          action: 'AUTO_UNLOCKED_FOR_VALIDATION',
          actionText: '02:00:00',
          actionDate: '2021-06-09T16:07:42.254972Z',
          actionBy: 'wille',
          pictureUrl:
            'https://www.openstreetmap.org/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBMzVDQlE9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--4e6b6ab5d46241962cbdace8a17b04db8d49c8fb/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaDdCem9MWm05eWJXRjBTU0lJYW5CbkJqb0dSVlE2RkhKbGMybDZaVjkwYjE5c2FXMXBkRnNIYVdscGFRPT0iLCJleHAiOm51bGwsInB1ciI6InZhcmlhdGlvbiJ9fQ==--1d22b8d446683a272d1a9ff04340453ca7c374b4/me-london.jpg',
          issues: null,
        },
      ],
      taskAnnotation: [],
      perTaskInstructions: '',
      autoUnlockSeconds: 7200,
      lastUpdated: '2023-03-09T04:45:26.168804Z',
      numberOfComments: null,
    },
  ],
};

export const submitMappingTask = lockForMapping;

export const submitValidationTask = lockForValidation;

export const userLockedTasks = {
  lockedTasks: [],
  projectId: null,
  taskStatus: null,
};

export const splitTask = {
  tasks: [
    {
      taskId: 1836,
      projectId: 5871,
      taskStatus: 'READY',
      taskHistory: [
        {
          historyId: 10764804,
          taskId: null,
          action: 'STATE_CHANGE',
          actionText: 'READY',
          actionDate: '2023-03-20T05:16:58.686069Z',
          actionBy: 'helnershingthapa',
          pictureUrl:
            'https://www.openstreetmap.org/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBNXQ2Q3c9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--fe41f1b2a5d6cf492a7133f15c81f105dec06ff7/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaDdCem9MWm05eWJXRjBPZ2h3Ym1jNkZISmxjMmw2WlY5MGIxOXNhVzFwZEZzSGFXbHBhUT09IiwiZXhwIjpudWxsLCJwdXIiOiJ2YXJpYXRpb24ifX0=--058ac785867b32287d598a314311e2253bd879a3/unnamed.webp',
          issues: null,
        },
      ],
      taskAnnotation: [],
      perTaskInstructions: '',
      autoUnlockSeconds: 7200,
      lastUpdated: '2023-03-20T05:16:58.686069Z',
      numberOfComments: null,
    },
    {
      taskId: 1837,
      projectId: 5871,
      taskStatus: 'READY',
      taskHistory: [
        {
          historyId: 10764813,
          taskId: null,
          action: 'STATE_CHANGE',
          actionText: 'READY',
          actionDate: '2023-03-20T05:16:58.760333Z',
          actionBy: 'helnershingthapa',
          pictureUrl:
            'https://www.openstreetmap.org/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBNXQ2Q3c9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--fe41f1b2a5d6cf492a7133f15c81f105dec06ff7/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaDdCem9MWm05eWJXRjBPZ2h3Ym1jNkZISmxjMmw2WlY5MGIxOXNhVzFwZEZzSGFXbHBhUT09IiwiZXhwIjpudWxsLCJwdXIiOiJ2YXJpYXRpb24ifX0=--058ac785867b32287d598a314311e2253bd879a3/unnamed.webp',
          issues: null,
        },
      ],
      taskAnnotation: [],
      perTaskInstructions: '',
      autoUnlockSeconds: 7200,
      lastUpdated: '2023-03-20T05:16:58.760333Z',
      numberOfComments: null,
    },
    {
      taskId: 1838,
      projectId: 5871,
      taskStatus: 'READY',
      taskHistory: [
        {
          historyId: 10764822,
          taskId: null,
          action: 'STATE_CHANGE',
          actionText: 'READY',
          actionDate: '2023-03-20T05:16:58.832135Z',
          actionBy: 'helnershingthapa',
          pictureUrl:
            'https://www.openstreetmap.org/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBNXQ2Q3c9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--fe41f1b2a5d6cf492a7133f15c81f105dec06ff7/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaDdCem9MWm05eWJXRjBPZ2h3Ym1jNkZISmxjMmw2WlY5MGIxOXNhVzFwZEZzSGFXbHBhUT09IiwiZXhwIjpudWxsLCJwdXIiOiJ2YXJpYXRpb24ifX0=--058ac785867b32287d598a314311e2253bd879a3/unnamed.webp',
          issues: null,
        },
      ],
      taskAnnotation: [],
      perTaskInstructions: '',
      autoUnlockSeconds: 7200,
      lastUpdated: '2023-03-20T05:16:58.832135Z',
      numberOfComments: null,
    },
    {
      taskId: 1839,
      projectId: 5871,
      taskStatus: 'READY',
      taskHistory: [
        {
          historyId: 10764831,
          taskId: null,
          action: 'STATE_CHANGE',
          actionText: 'READY',
          actionDate: '2023-03-20T05:16:58.923338Z',
          actionBy: 'helnershingthapa',
          pictureUrl:
            'https://www.openstreetmap.org/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBNXQ2Q3c9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--fe41f1b2a5d6cf492a7133f15c81f105dec06ff7/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaDdCem9MWm05eWJXRjBPZ2h3Ym1jNkZISmxjMmw2WlY5MGIxOXNhVzFwZEZzSGFXbHBhUT09IiwiZXhwIjpudWxsLCJwdXIiOiJ2YXJpYXRpb24ifX0=--058ac785867b32287d598a314311e2253bd879a3/unnamed.webp',
          issues: null,
        },
      ],
      taskAnnotation: [],
      perTaskInstructions: '',
      autoUnlockSeconds: 7200,
      lastUpdated: '2023-03-20T05:16:58.923338Z',
      numberOfComments: null,
    },
  ],
};

export const extendTask = {
  Success: 'Successfully extended task expiry',
};
