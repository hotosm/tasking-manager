import {
  getMembersDiff,
  filterActiveManagers,
  filterActiveMembers,
  filterInactiveMembersAndManagers,
  formatMemberObject,
} from '../teamMembersDiff';

it('should return the correct member object formatting', () => {
  const user = {
    id: 1234,
    username: 'test_23',
    role: 'MAPPER',
    mappingLevel: 'BEGINNER',
    pictureUrl: 'http://image.me/a.jpg',
  };
  const member = formatMemberObject(user);
  expect(member.username).toBe('test_23');
  expect(member.active).toBe(true);
  expect(member.function).toBe('MEMBER');
  expect(member.pictureUrl).toBe('http://image.me/a.jpg');
});

it('should return the correct member object formatting, as manager', () => {
  const user = {
    id: 1234,
    username: 'test_23',
    role: 'MAPPER',
    mappingLevel: 'BEGINNER',
    pictureUrl: 'http://image.me/a.jpg',
  };
  const member = formatMemberObject(user, true);
  expect(member.username).toBe('test_23');
  expect(member.active).toBe(true);
  expect(member.function).toBe('MANAGER');
  expect(member.pictureUrl).toBe('http://image.me/a.jpg');
});

it('should return only the active MEMBERS', () => {
  const members_1 = [
    {
      username: 'test_0',
      function: 'MANAGER',
      active: true,
      pictureUrl: 'https://www.gravatar.com/avatar.png',
    },
    {
      username: 'test_1',
      function: 'MANAGER',
      active: false,
      pictureUrl: 'https://www.gravatar.com/avatar.png',
    },
    { username: 'test_2', function: 'MEMBER', active: false, pictureUrl: null },
    { username: 'test_3', function: 'MEMBER', active: true, pictureUrl: null },
    { username: 'test_4', function: 'MEMBER', active: true, pictureUrl: null },
  ];
  expect(filterActiveMembers(members_1)).toStrictEqual([
    { username: 'test_3', function: 'MEMBER', active: true, pictureUrl: null },
    { username: 'test_4', function: 'MEMBER', active: true, pictureUrl: null },
  ]);
});

it('should return only the inactive MEMBERS and MANAGERS', () => {
  const members_1 = [
    {
      username: 'test_0',
      function: 'MANAGER',
      active: true,
      pictureUrl: 'https://www.gravatar.com/avatar.png',
    },
    {
      username: 'test_1',
      function: 'MANAGER',
      active: false,
      pictureUrl: 'https://www.gravatar.com/avatar.png',
    },
    { username: 'test_2', function: 'MEMBER', active: false, pictureUrl: null },
    { username: 'test_3', function: 'MEMBER', active: true, pictureUrl: null },
    { username: 'test_4', function: 'MEMBER', active: true, pictureUrl: null },
  ];
  expect(filterInactiveMembersAndManagers(members_1)).toStrictEqual([
    {
      username: 'test_1',
      function: 'MANAGER',
      active: false,
      pictureUrl: 'https://www.gravatar.com/avatar.png',
    },
    { username: 'test_2', function: 'MEMBER', active: false, pictureUrl: null },
  ]);
});

it('should return only the active MANAGERS', () => {
  const members_1 = [
    {
      username: 'test_1',
      function: 'MANAGER',
      active: true,
      pictureUrl: 'https://www.gravatar.com/avatar.png',
    },
    { username: 'test_2', function: 'MANAGER', active: false, pictureUrl: null },
    { username: 'test_3', function: 'MEMBER', active: true, pictureUrl: null },
    { username: 'test_4', function: 'MEMBER', active: true, pictureUrl: null },
    { username: 'test_5', function: 'MEMBER', active: false, pictureUrl: null },
  ];
  expect(filterActiveManagers(members_1)).toStrictEqual([
    {
      username: 'test_1',
      function: 'MANAGER',
      active: true,
      pictureUrl: 'https://www.gravatar.com/avatar.png',
    },
  ]);
});

describe('it should return the correct diff between two members arrays', () => {
  it('0 added, 1 user removed', () => {
    const members_1 = [{ username: 'test_3', function: 'MEMBER', active: true, pictureUrl: null }];
    const members_2 = [];
    expect(getMembersDiff(members_1, members_2)).toStrictEqual({
      usersAdded: [],
      usersRemoved: ['test_3'],
    });
  });

  it('1 added, 0 removed', () => {
    const members_1 = [];
    const members_2 = [{ username: 'test_3', function: 'MEMBER', active: true, pictureUrl: null }];
    expect(getMembersDiff(members_1, members_2)).toStrictEqual({
      usersAdded: ['test_3'],
      usersRemoved: [],
    });
  });

  it('none added, 2 users removed', () => {
    const members_1 = [
      {
        username: 'test_1',
        function: 'MANAGER',
        active: true,
        pictureUrl: 'https://www.gravatar.com/avatar.png',
      },
      { username: 'test_2', function: 'MEMBER', active: true, pictureUrl: null },
      { username: 'test_3', function: 'MEMBER', active: true, pictureUrl: null },
      { username: 'test_4', function: 'MEMBER', active: true, pictureUrl: null },
    ];
    const members_2 = [{ username: 'test_3', function: 'MEMBER', active: true, pictureUrl: null }];
    expect(getMembersDiff(members_1, members_2)).toStrictEqual({
      usersAdded: [],
      usersRemoved: ['test_2', 'test_4'],
    });
  });

  it('1 added, 2 removed', () => {
    const members_1 = [
      {
        username: 'test_1',
        function: 'MANAGER',
        active: true,
        pictureUrl: 'https://www.gravatar.com/avatar.png',
      },
      { username: 'test_2', function: 'MEMBER', active: true, pictureUrl: null },
      { username: 'test_3', function: 'MEMBER', active: true, pictureUrl: null },
      { username: 'test_4', function: 'MEMBER', active: true, pictureUrl: null },
    ];
    const members_2 = [
      { username: 'test_3', function: 'MEMBER', active: true, pictureUrl: null },
      { username: 'test_5', function: 'MEMBER', active: true, pictureUrl: null },
    ];
    expect(getMembersDiff(members_1, members_2)).toStrictEqual({
      usersAdded: ['test_5'],
      usersRemoved: ['test_2', 'test_4'],
    });
  });

  it('0 added, 0 removed', () => {
    const members_1 = [
      {
        username: 'test_1',
        function: 'MANAGER',
        active: true,
        pictureUrl: 'https://www.gravatar.com/avatar.png',
      },
      { username: 'test_2', function: 'MEMBER', active: false, pictureUrl: null },
      { username: 'test_3', function: 'MEMBER', active: true, pictureUrl: null },
      { username: 'test_4', function: 'MEMBER', active: true, pictureUrl: null },
    ];
    const members_2 = [
      {
        username: 'test_1',
        function: 'MANAGER',
        active: true,
        pictureUrl: 'https://www.gravatar.com/avatar.png',
      },
      { username: 'test_2', function: 'MEMBER', active: false, pictureUrl: null },
      { username: 'test_3', function: 'MEMBER', active: true, pictureUrl: null },
      { username: 'test_4', function: 'MEMBER', active: true, pictureUrl: null },
      { username: 'test_5', function: 'MEMBER', active: false, pictureUrl: null },
    ];
    expect(getMembersDiff(members_1, members_2)).toStrictEqual({
      usersAdded: [],
      usersRemoved: [],
    });
  });
});

describe('it should return the correct diff between two MANAGER arrays', () => {
  it('0 added, 0 removed', () => {
    const members_1 = [
      {
        username: 'test_1',
        function: 'MANAGER',
        active: true,
        pictureUrl: 'https://www.gravatar.com/avatar.png',
      },
      { username: 'test_2', function: 'MANAGER', active: true, pictureUrl: null },
      { username: 'test_3', function: 'MEMBER', active: true, pictureUrl: null },
      { username: 'test_4', function: 'MEMBER', active: true, pictureUrl: null },
    ];
    const members_2 = [
      {
        username: 'test_1',
        function: 'MANAGER',
        active: true,
        pictureUrl: 'https://www.gravatar.com/avatar.png',
      },
      { username: 'test_2', function: 'MANAGER', active: true, pictureUrl: null },
      { username: 'test_3', function: 'MEMBER', active: true, pictureUrl: null },
      { username: 'test_5', function: 'MEMBER', active: true, pictureUrl: null },
    ];
    expect(getMembersDiff(members_1, members_2, true)).toStrictEqual({
      usersAdded: [],
      usersRemoved: [],
    });
  });

  it('2 added, 0 removed', () => {
    const members_1 = [];
    const members_2 = [
      {
        username: 'test_1',
        function: 'MANAGER',
        active: true,
        pictureUrl: 'https://www.gravatar.com/avatar.png',
      },
      { username: 'test_2', function: 'MANAGER', active: true, pictureUrl: null },
      { username: 'test_3', function: 'MEMBER', active: true, pictureUrl: null },
      { username: 'test_5', function: 'MEMBER', active: true, pictureUrl: null },
    ];
    expect(getMembersDiff(members_1, members_2, true)).toStrictEqual({
      usersAdded: ['test_1', 'test_2'],
      usersRemoved: [],
    });
  });

  it('0 added, 2 removed', () => {
    const members_1 = [
      {
        username: 'test_1',
        function: 'MANAGER',
        active: true,
        pictureUrl: 'https://www.gravatar.com/avatar.png',
      },
      { username: 'test_2', function: 'MANAGER', active: true, pictureUrl: null },
      { username: 'test_3', function: 'MEMBER', active: true, pictureUrl: null },
      { username: 'test_5', function: 'MEMBER', active: true, pictureUrl: null },
    ];
    const members_2 = [];
    expect(getMembersDiff(members_1, members_2, true)).toStrictEqual({
      usersAdded: [],
      usersRemoved: ['test_1', 'test_2'],
    });
  });

  it('1 added, 2 removed', () => {
    const members_1 = [
      {
        username: 'test_1',
        function: 'MANAGER',
        active: true,
        pictureUrl: 'https://www.gravatar.com/avatar.png',
      },
      { username: 'test_2', function: 'MEMBER', active: true, pictureUrl: null },
      { username: 'test_3', function: 'MANAGER', active: true, pictureUrl: null },
      { username: 'test_4', function: 'MANAGER', active: true, pictureUrl: null },
    ];
    const members_2 = [
      { username: 'test_3', function: 'MANAGER', active: true, pictureUrl: null },
      { username: 'test_5', function: 'MANAGER', active: true, pictureUrl: null },
    ];
    expect(getMembersDiff(members_1, members_2, true)).toStrictEqual({
      usersAdded: ['test_5'],
      usersRemoved: ['test_1', 'test_4'],
    });
  });

  it('0 added, 1 removed', () => {
    const members_1 = [
      { username: 'test_1', function: 'MANAGER', active: false, pictureUrl: null },
      { username: 'test_2', function: 'MEMBER', active: true, pictureUrl: null },
      { username: 'test_3', function: 'MANAGER', active: true, pictureUrl: null },
      { username: 'test_4', function: 'MANAGER', active: true, pictureUrl: null },
    ];
    const members_2 = [
      { username: 'test_1', function: 'MANAGER', active: false, pictureUrl: null },
      { username: 'test_3', function: 'MANAGER', active: true, pictureUrl: null },
      { username: 'test_5', function: 'MANAGER', active: false, pictureUrl: null },
    ];
    expect(getMembersDiff(members_1, members_2, true)).toStrictEqual({
      usersAdded: [],
      usersRemoved: ['test_4'],
    });
  });
});
