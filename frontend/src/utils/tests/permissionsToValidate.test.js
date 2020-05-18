import { userCanValidate } from '../projectPermissions';

it('READ_ONLY role USER can NOT validate any project', () => {
  const userTeams = [
    {
      teamId: 7,
      name: 'My Private team',
      role: 'VALIDATOR',
    },
  ];
  const user = { mappingLevel: 'ADVANCED', role: 'READ_ONLY' };
  const project1 = { validationPermission: 'ANY', teams: [{ teamId: 7, role: 'VALIDATOR' }] };
  const project2 = { validationPermission: 'TEAMS', teams: [{ teamId: 7, role: 'VALIDATOR' }] };
  const project3 = { validationPermission: 'LEVEL', teams: [{ teamId: 7, role: 'VALIDATOR' }] };
  const project4 = {
    validationPermission: 'TEAMS_LEVEL',
    teams: [{ teamId: 7, role: 'VALIDATOR' }],
  };
  expect(userCanValidate(user, project1, userTeams)).toBe(false);
  expect(userCanValidate(user, project2, userTeams)).toBe(false);
  expect(userCanValidate(user, project3, userTeams)).toBe(false);
  expect(userCanValidate(user, project4, userTeams)).toBe(false);
});

it('project author CAN validate it', () => {
  const userTeams = [];
  const user = { username: 'test', mappingLevel: 'BEGINNER', role: 'MAPPER' };
  const project1 = {
    author: 'test',
    validationPermission: 'ANY',
    teams: [{ teamId: 7, role: 'MAPPER' }],
  };
  const project2 = {
    author: 'test',
    validationPermission: 'TEAMS',
    teams: [{ teamId: 7, role: 'MAPPER' }],
  };
  const project3 = {
    author: 'test',
    validationPermission: 'LEVEL',
    teams: [{ teamId: 7, role: 'MAPPER' }],
  };
  const project4 = {
    author: 'test',
    validationPermission: 'TEAMS_LEVEL',
    teams: [{ teamId: 7, role: 'MAPPER' }],
  };
  const project5 = {
    author: 'test_2',
    validationPermission: 'TEAMS_LEVEL',
    teams: [{ teamId: 7, role: 'MAPPER' }],
  };
  expect(userCanValidate(user, project1, userTeams)).toBe(true);
  expect(userCanValidate(user, project2, userTeams)).toBe(true);
  expect(userCanValidate(user, project3, userTeams)).toBe(true);
  expect(userCanValidate(user, project4, userTeams)).toBe(true);
  expect(userCanValidate(user, project5, userTeams)).toBe(false);
});

describe('PROJECTS with validationPermission set to any', () => {
  it('CAN be validated by a BEGINNER user that is not on a team', () => {
    const user = { mappingLevel: 'BEGINNER', role: 'MAPPER' };
    const project1 = { validationPermission: 'ANY', teams: [] };
    const project2 = { validationPermission: 'ANY', teams: [{ teamId: 7, role: 'VALIDATOR' }] };
    expect(userCanValidate(user, project1)).toBe(true);
    expect(userCanValidate(user, project2)).toBe(true);
  });
});

describe('PROJECTS with validationPermission set to level', () => {
  it('can NOT be validated by a BEGINNER level USER', () => {
    const userTeams = [
      {
        teamId: 1,
        name: 'My Private team',
        role: 'VALIDATOR',
      },
    ];
    const user = { mappingLevel: 'BEGINNER', role: 'VALIDATOR' };
    const project1 = { validationPermission: 'LEVEL', teams: [{ teamId: 1, role: 'VALIDATOR' }] };
    expect(userCanValidate(user, project1, userTeams)).toBe(false);
  });

  it('CAN be validated by an INTERMEDIATE level USER', () => {
    const userTeams = [
      {
        teamId: 1,
        name: 'My Private team',
        role: 'VALIDATOR',
      },
    ];
    const user = { mappingLevel: 'INTERMEDIATE', role: 'VALIDATOR' };
    const project1 = { validationPermission: 'LEVEL', teams: [{ teamId: 7, role: 'VALIDATOR' }] };
    expect(userCanValidate(user, project1, userTeams)).toBe(true);
  });

  it('CAN be validated by an ADVANCED level USER', () => {
    const user = { mappingLevel: 'ADVANCED', role: 'VALIDATOR' };
    const project = { validationPermission: 'LEVEL', teams: [{ teamId: 7, role: 'VALIDATOR' }] };
    expect(userCanValidate(user, project)).toBe(true);
  });
});

describe('PROJECTS with validationPermission set as teams', () => {
  it('CAN be validated by a BEGINNER level USER if they are member of the team', () => {
    const userTeams = [
      {
        teamId: 1,
        name: 'My Private team',
        role: 'VALIDATOR',
      },
      {
        teamId: 2,
        name: 'My Private team',
        role: 'PROJECT_MANAGER',
      },
    ];
    const user = { mappingLevel: 'BEGINNER', role: 'VALIDATOR' };
    const project1 = { validationPermission: 'TEAMS', teams: [{ teamId: 1, role: 'VALIDATOR' }] };
    const project2 = {
      validationPermission: 'TEAMS',
      teams: [{ teamId: 2, role: 'PROJECT_MANAGER' }],
    };
    expect(userCanValidate(user, project1, userTeams)).toBe(true);
    expect(userCanValidate(user, project2, userTeams)).toBe(true);
  });

  it('CAN be validated by an INTERMEDIATE level USER if they are member of the team', () => {
    const userTeams = [
      {
        teamId: 1,
        name: 'My Private team',
        role: 'VALIDATOR',
      },
      {
        teamId: 2,
        name: 'My Private team',
        role: 'PROJECT_MANAGER',
      },
    ];
    const user = { mappingLevel: 'INTERMEDIATE', role: 'VALIDATOR' };
    const project1 = { validationPermission: 'TEAMS', teams: [{ teamId: 1, role: 'VALIDATOR' }] };
    const project2 = {
      validationPermission: 'TEAMS',
      teams: [{ teamId: 2, role: 'PROJECT_MANAGER' }],
    };
    expect(userCanValidate(user, project1, userTeams)).toBe(true);
    expect(userCanValidate(user, project2, userTeams)).toBe(true);
  });

  it('CAN be validated by an ADVANCED level USER', () => {
    const userTeams = [
      {
        teamId: 1,
        name: 'My Private team',
        role: 'VALIDATOR',
      },
    ];
    const user = { mappingLevel: 'ADVANCED', role: 'VALIDATOR' };
    const project = { validationPermission: 'TEAMS', teams: [{ teamId: 1, role: 'VALIDATOR' }] };
    expect(userCanValidate(user, project, userTeams)).toBe(true);
  });

  it('can NOT be validated by a BEGINNER level USER if they are NOT member of the team', () => {
    const userTeams = [
      {
        teamId: 2,
        name: 'My Private team',
        role: 'VALIDATOR',
      },
    ];
    const user = { mappingLevel: 'BEGINNER', role: 'VALIDATOR' };
    const project1 = { validationPermission: 'TEAMS', teams: [{ teamId: 1, role: 'VALIDATOR' }] };
    expect(userCanValidate(user, project1, userTeams)).toBe(false);
  });

  it('can NOT be validated by an INTERMEDIATE level USER if they are NOT member of the team', () => {
    const userTeams = [
      {
        teamId: 2,
        name: 'My Private team',
        role: 'VALIDATOR',
      },
    ];
    const user = { mappingLevel: 'INTERMEDIATE', role: 'VALIDATOR' };
    const project1 = { validationPermission: 'TEAMS', teams: [{ teamId: 1, role: 'VALIDATOR' }] };
    expect(userCanValidate(user, project1, userTeams)).toBe(false);
  });

  it('can NOT be validated by an ADVANCED level USER if they are NOT member of the team', () => {
    const userTeams = [
      {
        teamId: 2,
        name: 'My Private team',
        role: 'VALIDATOR',
      },
    ];
    const user = { mappingLevel: 'ADVANCED', role: 'VALIDATOR' };
    const project1 = { validationPermission: 'TEAMS', teams: [{ teamId: 1, role: 'VALIDATOR' }] };
    expect(userCanValidate(user, project1, userTeams)).toBe(false);
  });
});

describe('PROJECTS with validationPermission set to teamsAndLevel', () => {
  it('can NOT be validated by a BEGINNER level USER even if they are member of the team', () => {
    const userTeams = [
      {
        teamId: 1,
        name: 'My Private team',
        role: 'VALIDATOR',
      },
    ];
    const user = { mappingLevel: 'BEGINNER', role: 'VALIDATOR' };
    const project1 = {
      validationPermission: 'TEAMS_LEVEL',
      teams: [{ teamId: 1, role: 'VALIDATOR' }],
    };
    expect(userCanValidate(user, project1, userTeams)).toBe(false);
  });

  it('CAN be validated by an INTERMEDIATE level USER if they are member of the team', () => {
    const userTeams = [
      {
        teamId: 1,
        name: 'My Private team',
        role: 'VALIDATOR',
      },
    ];
    const user = { mappingLevel: 'INTERMEDIATE', role: 'VALIDATOR' };
    const project1 = {
      validationPermission: 'TEAMS_LEVEL',
      teams: [{ teamId: 1, role: 'VALIDATOR' }],
    };
    expect(userCanValidate(user, project1, userTeams)).toBe(true);
  });

  it('can NOT be validated by an INTERMEDIATE level USER if they are not member of a team', () => {
    const userTeams = [
      {
        teamId: 2,
        name: 'My Private team',
        role: 'VALIDATOR',
      },
    ];
    const user = { mappingLevel: 'INTERMEDIATE', role: 'VALIDATOR' };
    const project1 = {
      validationPermission: 'TEAMS_LEVEL',
      teams: [{ teamId: 1, role: 'VALIDATOR' }],
    };
    expect(userCanValidate(user, project1, userTeams)).toBe(false);
  });

  it('CAN be validated by an ADVANCED level USER if they are member of a team', () => {
    const userTeams = [
      {
        teamId: 1,
        name: 'My Private team',
        role: 'VALIDATOR',
      },
    ];
    const user = { mappingLevel: 'ADVANCED', role: 'VALIDATOR' };
    const project = {
      validationPermission: 'TEAMS_LEVEL',
      teams: [{ teamId: 1, role: 'VALIDATOR' }],
    };
    expect(userCanValidate(user, project, userTeams)).toBe(true);
  });

  it('can NOT be validated by an ADVANCED level USER if they are not member of a team', () => {
    const userTeams = [
      {
        teamId: 2,
        name: 'My Private team',
        role: 'VALIDATOR',
      },
    ];
    const user = { mappingLevel: 'ADVANCED', role: 'VALIDATOR' };
    const project = {
      validationPermission: 'TEAMS_LEVEL',
      teams: [{ teamId: 1, role: 'VALIDATOR' }],
    };
    expect(userCanValidate(user, project, userTeams)).toBe(false);
  });
});

/******  PRIVATE PROJECTS  ******/
describe('PRIVATE projects', () => {
  it('can NOT be validated by a READ_ONLY role USER even if the user is on the list', () => {
    const user = { username: 'user1', mappingLevel: 'ADVANCED', role: 'READ_ONLY' };
    const project = {
      private: true,
      validationPermission: 'TEAMS',
      allowedUsernames: ['user1'],
      teams: [],
    };
    expect(userCanValidate(user, project)).toBe(false);
  });

  it('can NOT be validated by an ADVANCED user if their username is NOT ALLOWED', () => {
    const user = { username: 'user3000', mappingLevel: 'ADVANCED', role: 'VALIDATOR' };
    const project = {
      validationPermission: 'TEAMS',
      private: true,
      allowedUsernames: ['user1'],
      teams: [],
    };
    expect(userCanValidate(user, project)).toBe(false);
  });

  it('CAN be validated by a BEGINNER USER if their username is ALLOWED', () => {
    const user = { username: 'user1', mappingLevel: 'BEGINNER', role: 'VALIDATOR' };
    const project = {
      validationPermission: 'TEAMS',
      private: true,
      allowedUsernames: ['user1'],
      teams: [],
    };
    expect(userCanValidate(user, project)).toBe(true);
  });

  it('CAN be validated by a BEGINNER USER if they are part of a team', () => {
    const userTeams = [
      {
        teamId: 1,
        name: 'My Private team',
        role: 'VALIDATOR',
      },
    ];
    const user = { username: 'user1', mappingLevel: 'BEGINNER', role: 'VALIDATOR' };
    const project = {
      validationPermission: 'TEAMS',
      private: true,
      allowedUsernames: [],
      teams: [{ teamId: 1, role: 'VALIDATOR' }],
    };
    expect(userCanValidate(user, project, userTeams)).toBe(true);
  });
});

it('CAN be validated by Organisation manager', () => {
  const userTeams = [];
  const userOrgs = [108];
  const user = { mappingLevel: 'BEGINNER', role: 'MAPPER' };
  const project1 = {
    mappingPermission: 'ANY',
    teams: [{ teamId: 7, role: 'VALIDATOR' }],
    organisation: 108,
  };
  const project2 = {
    mappingPermission: 'TEAMS',
    teams: [{ teamId: 7, role: 'VALIDATOR' }],
    organisation: 108,
  };
  const project3 = {
    mappingPermission: 'LEVEL',
    teams: [{ teamId: 7, role: 'VALIDATOR' }],
    organisation: 108,
  };
  const project4 = {
    mappingPermission: 'TEAMS_LEVEL',
    teams: [{ teamId: 7, role: 'VALIDATOR' }],
    organisation: 108,
  };
  expect(userCanValidate(user, project1, userTeams, userOrgs)).toBe(true);
  expect(userCanValidate(user, project2, userTeams, userOrgs)).toBe(true);
  expect(userCanValidate(user, project3, userTeams, userOrgs)).toBe(true);
  expect(userCanValidate(user, project4, userTeams, userOrgs)).toBe(true);
});
