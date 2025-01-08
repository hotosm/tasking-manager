export const teams = {
  teams: [
    {
      teamId: 1,
      organisationId: 123,
      // redundant keys above and below for responses in teams list and team detail
      organisation_id: 123,
      organisation: 'Organisation Name 123',
      name: 'Team Test',
      logo: 'https://cdn.hotosm.org/tasking-manager/uploads/1588662877801_hot-logo-png.png',
      description: 'Dummy team test',
      joinMethod: 'BY_INVITE',
      visibility: 'PRIVATE',
      members: [
        {
          username: 'sample_user',
          function: 'MANAGER',
          active: true,
          joinRequestNotifications: false,
          pictureUrl:
            'https://www.openstreetmap.org/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBK0FQQWc9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--b385b3fad59b07a040393279c91dbc88c5f8cdf7/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaDdCem9MWm05eWJXRjBTU0lJYW5CbkJqb0dSVlE2RkhKbGMybDZaVjkwYjE5c2FXMXBkRnNIYVdscGFRPT0iLCJleHAiOm51bGwsInB1ciI6InZhcmlhdGlvbiJ9fQ==--1d22b8d446683a272d1a9ff04340453ca7c374b4/14421645307_6e09d2d02a_o.jpg',
        },
      ],
    },
    {
      teamId: 4,
      organisationId: 6,
      organisation: 'KLL',
      name: 'Test KLL Team',
      logo: 'https://cdn.hotosm.org/tasking-manager/uploads/1652896455106_main-logo.png',
      description: null,
      joinMethod: 'BY_REQUEST',
      visibility: 'PUBLIC',
      members: [
        {
          username: 'helnershingthapa',
          function: 'MEMBER',
          active: true,
          joinRequestNotifications: false,
          pictureUrl:
            'https://www.openstreetmap.org/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBNXQ2Q3c9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--fe41f1b2a5d6cf492a7133f15c81f105dec06ff7/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaDdCem9MWm05eWJXRjBPZ2h3Ym1jNkZISmxjMmw2WlY5MGIxOXNhVzFwZEZzSGFXbHBhUT09IiwiZXhwIjpudWxsLCJwdXIiOiJ2YXJpYXRpb24ifX0=--058ac785867b32287d598a314311e2253bd879a3/unnamed.webp',
        },
      ],
    },
  ],
};

export const team = teams.teams[0];

export const teamCreationSuccess = {
  teamId: 123,
};

export const teamUpdationSuccess = {
  Status: 'Updated',
};

export const teamDeletionSuccess = {
  Success: 'Team deleted',
};
