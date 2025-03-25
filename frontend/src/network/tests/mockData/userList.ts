export const usersList = {
  users: [
    {
      id: 1,
      username: 'Ram',
      role: 'MAPPER',
      mappingLevel: 'BEGINNER',
      pictureUrl:
        'https://www.openstreetmap.org/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBNXQ2Q3c9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--fe41f1b2a5d6cf492a7133f15c81f105dec06ff7/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaDdCem9MWm05eWJXRjBPZ2h3Ym1jNkZISmxjMmw2WlY5MGIxOXNhVzFwZEZzSGFXbHBhUT09IiwiZXhwIjpudWxsLCJwdXIiOiJ2YXJpYXRpb24ifX0=--058ac785867b32287d598a314311e2253bd879a3/unnamed.webp',
    },
    {
      id: 2,
      username: 'Shyam',
      role: 'MAPPER',
      mappingLevel: 'ADVANCED',
      pictureUrl: null,
    },
  ],
  pagination: {
    hasNext: true,
    hasPrev: false,
    nextNum: 2,
    page: 1,
    pages: 11006,
    prevNum: null,
    perPage: 20,
    total: 220111,
  },
};

export const levelUpdationSuccess = { Success: 'Level set' };

export const roleUpdationSuccess = { Success: 'Role added' };

export const userQueryDetails = {
  id: 420,
  username: 'somebodysomewhere',
  role: 'ADMIN',
  mappingLevel: 'ADVANCED',
  projectsMapped: 1,
  emailAddress: 'somebodysomewhere@tasking-manager.com',
  isEmailVerified: false,
  isExpert: true,
  twitterId: 'somebodysomewhereTwitter',
  facebookId: 'somebodysomewhereFacebook',
  linkedinId: 'somebodysomewhereLinkedin',
  slackId: 'somebodysomewhereSlack',
  ircId: null,
  skypeId: null,
  city: 'Somewhere',
  country: 'Some country',
  name: 'Somebody',
  pictureUrl:
    'https://www.openstreetmap.org/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBNXQ2Q3c9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--fe41f1b2a5d6cf492a7133f15c81f105dec06ff7/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaDdCem9MWm05eWJXRjBPZ2h3Ym1jNkZISmxjMmw2WlY5MGIxOXNhVzFwZEZzSGFXbHBhUT09IiwiZXhwIjpudWxsLCJwdXIiOiJ2YXJpYXRpb24ifX0=--058ac785867b32287d598a314311e2253bd879a3/unnamed.webp',
  defaultEditor: 'ID',
  mentionsNotifications: true,
  questionsAndCommentsNotifications: true,
  projectsNotifications: true,
  tasksNotifications: true,
  taskCommentsNotifications: true,
  teamsAnnouncementNotifications: false,
  gender: 'MALE',
  selfDescriptionGender: null,
};
