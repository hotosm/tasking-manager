export const myTeams = {
  data: [
    {
      id: 1,
      name: 'OSM Teams Developers',
      hashtag: null,
      bio: null,
      privacy: 'private',
      require_join_request: false,
      updated_at: '2023-06-11T15:37:57.793Z',
      created_at: '2022-05-06T16:10:18.452Z',
      location: '{"type":"Point","coordinates":[-77.02438,38.906337]}',
      members: '8',
    },
    {
      id: 10,
      name: 'SOTMUS 2023',
      hashtag: '#sotmus',
      bio: 'Attendees of State of the Map 2023 in Richmond, VA',
      privacy: 'public',
      require_join_request: false,
      updated_at: '2023-06-09T20:00:51.108Z',
      created_at: '2023-06-09T17:01:41.376Z',
      location: '{"type":"Point","coordinates":[-77.4508325,37.548201459]}',
      members: '27',
    },
    {
      id: 20,
      name: 'My Friends',
      hashtag: null,
      bio: null,
      privacy: 'private',
      require_join_request: false,
      updated_at: '2022-11-17T15:32:58.615Z',
      created_at: '2022-11-17T15:32:58.615Z',
      location: null,
      members: '2',
    },
  ],
  pagination: { total: 3, lastPage: 1, perPage: 10, currentPage: 1, from: 0, to: 3 },
};

export const osmTeam1 = {
  id: 73,
  name: 'OSM Teams Developers',
  hashtag: '#OSMDevs',
  bio: 'OSM Team Developers',
  privacy: 'private',
  require_join_request: false,
  updated_at: '2023-03-13T18:05:23.679Z',
  created_at: '2022-05-06T16:10:18.452Z',
  location: null,
  org: { organization_id: 5, name: 'Development Seed' },
  requesterIsMember: true,
};

export const osmTeamMembers = {
  teamId: 73,
  members: {
    data: [
      { id: 146675, name: 'geohacker' },
      { id: 2454337, name: 'kamicut' },
      { id: 2206554, name: 'LsGoodman' },
      { id: 10139859, name: 'MarcFarra' },
      { id: 261012, name: 'sanjayb' },
      { id: 62817, name: 'vgeorge' },
      { id: 15547551, name: 'Vgeorge2' },
      { id: 360183, name: 'wille' },
    ],
    pagination: { total: 8, lastPage: 1, perPage: 10, currentPage: 1, from: 0, to: 8 },
  },
};

export const osmTeamModerators = [
  { id: 64, team_id: 73, osm_id: 2454337 },
  { id: 443, team_id: 73, osm_id: 15547551 },
  { id: 459, team_id: 73, osm_id: 146675 },
  { id: 464, team_id: 73, osm_id: 2206554 },
];
