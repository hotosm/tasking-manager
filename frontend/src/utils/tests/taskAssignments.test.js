import {
  getAssignmentStatus,
  isAssignmentActionable,
  getActiveStage,
  getStageForTaskAction,
  groupAssignmentsByTask,
  getAssigneeName,
  getAssignmentRelation,
  isAssignedToUser,
  mergeAssignmentsIntoTasks,
  getRandomTaskByAction,
  getAssignmentConflicts,
} from '../taskAssignments';

const userAssignment = (taskId, stage, userId, username = `user${userId}`) => ({
  taskId,
  stage,
  assigneeType: 'USER',
  userId,
  username,
  teamId: null,
  teamName: null,
  assignedBy: 'pm',
  assignedDate: '2026-11-20T10:00:00Z',
});

const teamAssignment = (taskId, stage, teamId, teamName = `Team ${teamId}`) => ({
  taskId,
  stage,
  assigneeType: 'TEAM',
  userId: null,
  username: null,
  teamId,
  teamName,
  assignedBy: 'pm',
  assignedDate: '2026-11-20T10:00:00Z',
});

describe('getAssignmentStatus', () => {
  it.each([
    ['READY', 'pending'],
    ['INVALIDATED', 'pending'],
    ['LOCKED_FOR_MAPPING', 'inProgress'],
    ['MAPPED', 'done'],
    ['BADIMAGERY', 'done'],
    ['VALIDATED', 'done'],
    ['LOCKED_FOR_VALIDATION', null],
  ])('MAPPING stage, task %s -> %s', (taskStatus, expected) => {
    expect(getAssignmentStatus('MAPPING', taskStatus)).toBe(expected);
  });

  it.each([
    ['READY', 'waiting'],
    ['LOCKED_FOR_MAPPING', 'waiting'],
    ['INVALIDATED', 'waiting'],
    ['MAPPED', 'pending'],
    ['BADIMAGERY', 'pending'],
    ['LOCKED_FOR_VALIDATION', 'inProgress'],
    ['VALIDATED', 'done'],
  ])('VALIDATION stage, task %s -> %s', (taskStatus, expected) => {
    expect(getAssignmentStatus('VALIDATION', taskStatus)).toBe(expected);
  });

  it('returns null for an unknown stage', () => {
    expect(getAssignmentStatus('SOMETHING', 'READY')).toBeNull();
  });

  it('marks pending and in progress assignments as actionable', () => {
    expect(isAssignmentActionable('MAPPING', 'READY')).toBe(true);
    expect(isAssignmentActionable('MAPPING', 'LOCKED_FOR_MAPPING')).toBe(true);
    expect(isAssignmentActionable('MAPPING', 'MAPPED')).toBe(false);
    expect(isAssignmentActionable('VALIDATION', 'READY')).toBe(false);
    expect(isAssignmentActionable('VALIDATION', 'MAPPED')).toBe(true);
  });
});

describe('stage helpers', () => {
  it('returns the stage a task is waiting on', () => {
    expect(getActiveStage('READY')).toBe('MAPPING');
    expect(getActiveStage('INVALIDATED')).toBe('MAPPING');
    expect(getActiveStage('LOCKED_FOR_MAPPING')).toBe('MAPPING');
    expect(getActiveStage('MAPPED')).toBe('VALIDATION');
    expect(getActiveStage('BADIMAGERY')).toBe('VALIDATION');
    expect(getActiveStage('LOCKED_FOR_VALIDATION')).toBe('VALIDATION');
    expect(getActiveStage('VALIDATED')).toBeNull();
  });

  it('returns the stage of a task action', () => {
    expect(getStageForTaskAction('mapATask')).toBe('MAPPING');
    expect(getStageForTaskAction('mapSelectedTask')).toBe('MAPPING');
    expect(getStageForTaskAction('validateSelectedTask')).toBe('VALIDATION');
    expect(getStageForTaskAction('resumeMapping')).toBeNull();
    expect(getStageForTaskAction('projectIsComplete')).toBeNull();
  });
});

describe('groupAssignmentsByTask and names', () => {
  it('groups assignments by task id and stage', () => {
    const grouped = groupAssignmentsByTask([
      userAssignment(1, 'MAPPING', 10),
      teamAssignment(1, 'VALIDATION', 5),
      userAssignment(2, 'MAPPING', 11),
    ]);
    expect(Object.keys(grouped)).toEqual(['1', '2']);
    expect(grouped[1].MAPPING.userId).toBe(10);
    expect(grouped[1].VALIDATION.teamId).toBe(5);
    expect(grouped[2].VALIDATION).toBeUndefined();
  });

  it('handles empty input', () => {
    expect(groupAssignmentsByTask(undefined)).toEqual({});
  });

  it('returns the username or team name', () => {
    expect(getAssigneeName(userAssignment(1, 'MAPPING', 10, 'alice'))).toBe('alice');
    expect(getAssigneeName(teamAssignment(1, 'MAPPING', 5, 'Kathmandu mappers'))).toBe(
      'Kathmandu mappers',
    );
    expect(getAssigneeName(undefined)).toBeNull();
  });
});

describe('getAssignmentRelation', () => {
  it('identifies direct, team and other assignments', () => {
    expect(getAssignmentRelation(userAssignment(1, 'MAPPING', 10), 10, [])).toBe('direct');
    expect(getAssignmentRelation(userAssignment(1, 'MAPPING', 11), 10, [])).toBe('other');
    expect(getAssignmentRelation(teamAssignment(1, 'MAPPING', 5), 10, [5])).toBe('team');
    expect(getAssignmentRelation(teamAssignment(1, 'MAPPING', 6), 10, [5])).toBe('other');
    expect(getAssignmentRelation(undefined, 10, [5])).toBeNull();
  });

  it('treats user assignments as other when there is no logged in user', () => {
    expect(getAssignmentRelation(userAssignment(1, 'MAPPING', 10), undefined)).toBe('other');
  });

  it('isAssignedToUser covers direct and team assignments', () => {
    expect(isAssignedToUser(userAssignment(1, 'MAPPING', 10), 10, [])).toBe(true);
    expect(isAssignedToUser(teamAssignment(1, 'MAPPING', 5), 10, [5])).toBe(true);
    expect(isAssignedToUser(teamAssignment(1, 'MAPPING', 5), 10, [])).toBe(false);
  });
});

describe('mergeAssignmentsIntoTasks', () => {
  const tasks = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', geometry: null, properties: { taskId: 1, taskStatus: 'READY' } },
      { type: 'Feature', geometry: null, properties: { taskId: 2, taskStatus: 'MAPPED' } },
      { type: 'Feature', geometry: null, properties: { taskId: 3, taskStatus: 'READY' } },
      { type: 'Feature', geometry: null, properties: { taskId: 4, taskStatus: 'VALIDATED' } },
    ],
  };
  const assignments = groupAssignmentsByTask([
    userAssignment(1, 'MAPPING', 10, 'me'),
    teamAssignment(1, 'VALIDATION', 7, 'Validators'),
    userAssignment(2, 'MAPPING', 10, 'me'),
    teamAssignment(2, 'VALIDATION', 5, 'My team'),
    userAssignment(3, 'MAPPING', 11, 'someone'),
    userAssignment(4, 'MAPPING', 10, 'me'),
  ]);

  it('adds flat assignment properties based on the stage the task is waiting on', () => {
    const merged = mergeAssignmentsIntoTasks(tasks, assignments, 10, [5]);
    const props = merged.features.map((f) => f.properties);
    expect(props[0]).toMatchObject({
      mappingAssignee: 'me',
      mappingAssigneeIsTeam: false,
      validationAssignee: 'Validators',
      validationAssigneeIsTeam: true,
      assignmentMarker: 'mine',
      assignedToMe: true,
    });
    // MAPPED task: validation assignment to the user's team is the active one
    expect(props[1]).toMatchObject({ assignmentMarker: 'mine', assignedToMe: true });
    expect(props[2]).toMatchObject({ assignmentMarker: 'other', assignedToMe: false });
    // VALIDATED task: no active assignment
    expect(props[3]).toMatchObject({
      mappingAssignee: 'me',
      assignmentMarker: '',
      assignedToMe: false,
    });
  });

  it('does not mutate the input', () => {
    mergeAssignmentsIntoTasks(tasks, assignments, 10, [5]);
    expect(tasks.features[0].properties.mappingAssignee).toBeUndefined();
  });

  it('returns empty assignment properties when there are no assignments', () => {
    const merged = mergeAssignmentsIntoTasks(tasks, {}, 10, []);
    expect(merged.features[0].properties).toMatchObject({
      mappingAssignee: '',
      validationAssignee: '',
      assignmentMarker: '',
      assignedToMe: false,
    });
  });

  it('passes through missing data', () => {
    expect(mergeAssignmentsIntoTasks(undefined, {}, 10, [])).toBeUndefined();
  });
});

describe('getRandomTaskByAction', () => {
  const activities = [
    { taskId: 1, taskStatus: 'READY' },
    { taskId: 2, taskStatus: 'READY' },
    { taskId: 3, taskStatus: 'INVALIDATED' },
    { taskId: 4, taskStatus: 'MAPPED' },
    { taskId: 5, taskStatus: 'BADIMAGERY' },
    { taskId: 6, taskStatus: 'VALIDATED' },
  ];

  it('keeps the previous behaviour when nothing is assigned', () => {
    for (let i = 0; i < 20; i++) {
      expect([1, 2, 3]).toContain(getRandomTaskByAction(activities, 'mapATask'));
      expect([4, 5]).toContain(getRandomTaskByAction(activities, 'validateAnotherTask'));
    }
    expect(getRandomTaskByAction(activities, 'resumeMapping')).toBeUndefined();
  });

  it('prefers tasks assigned directly to the user', () => {
    const assignmentsByTask = groupAssignmentsByTask([
      userAssignment(2, 'MAPPING', 10),
      teamAssignment(3, 'MAPPING', 5),
    ]);
    for (let i = 0; i < 20; i++) {
      expect(
        getRandomTaskByAction(activities, 'mapATask', {
          assignmentsByTask,
          userId: 10,
          userTeamIds: [5],
        }),
      ).toBe(2);
    }
  });

  it('then tasks assigned to the user teams, then unassigned tasks', () => {
    const assignmentsByTask = groupAssignmentsByTask([
      teamAssignment(3, 'MAPPING', 5),
      userAssignment(1, 'MAPPING', 11),
    ]);
    expect(
      getRandomTaskByAction(activities, 'mapATask', {
        assignmentsByTask,
        userId: 10,
        userTeamIds: [5],
      }),
    ).toBe(3);
    // without team membership the only unassigned task is 2 (1 and 3 belong to others)
    for (let i = 0; i < 20; i++) {
      expect(
        getRandomTaskByAction(activities, 'mapATask', {
          assignmentsByTask,
          userId: 10,
          userTeamIds: [],
        }),
      ).toBe(2);
    }
  });

  it('uses tasks assigned to others only as a last resort, and never when enforced', () => {
    const assignmentsByTask = groupAssignmentsByTask([
      userAssignment(1, 'MAPPING', 11),
      userAssignment(2, 'MAPPING', 11),
      userAssignment(3, 'MAPPING', 11),
    ]);
    expect([1, 2, 3]).toContain(
      getRandomTaskByAction(activities, 'mapATask', {
        assignmentsByTask,
        userId: 10,
        allowOthersAssigned: true,
      }),
    );
    expect(
      getRandomTaskByAction(activities, 'mapATask', {
        assignmentsByTask,
        userId: 10,
        allowOthersAssigned: false,
      }),
    ).toBeUndefined();
  });

  it('uses the validation stage for validation actions', () => {
    const assignmentsByTask = groupAssignmentsByTask([
      userAssignment(5, 'VALIDATION', 10),
      userAssignment(4, 'MAPPING', 10),
    ]);
    for (let i = 0; i < 20; i++) {
      expect(
        getRandomTaskByAction(activities, 'validateATask', { assignmentsByTask, userId: 10 }),
      ).toBe(5);
    }
  });
});

describe('getAssignmentConflicts', () => {
  const assignmentsByTask = groupAssignmentsByTask([
    userAssignment(1, 'MAPPING', 11, 'other'),
    userAssignment(2, 'MAPPING', 10, 'me'),
    teamAssignment(3, 'VALIDATION', 6, 'Other team'),
    teamAssignment(4, 'VALIDATION', 5, 'My team'),
  ]);
  const taskStatusById = { 1: 'READY', 2: 'READY', 3: 'MAPPED', 4: 'MAPPED', 5: 'READY' };
  const options = { assignmentsByTask, taskStatusById, userId: 10, userTeamIds: [5] };

  it('returns assignments of other people for the action stage', () => {
    expect(getAssignmentConflicts([1], 'mapSelectedTask', options).map((a) => a.taskId)).toEqual([
      1,
    ]);
    expect(getAssignmentConflicts([2, 5], 'mapSelectedTask', options)).toEqual([]);
    expect(
      getAssignmentConflicts([3, 4], 'validateSelectedTask', options).map((a) => a.taskId),
    ).toEqual([3]);
  });

  it('ignores stages the action does not work on and non-actionable tasks', () => {
    expect(getAssignmentConflicts([3], 'mapSelectedTask', options)).toEqual([]);
    expect(getAssignmentConflicts([1], 'resumeMapping', options)).toEqual([]);
    expect(
      getAssignmentConflicts([1], 'mapSelectedTask', {
        ...options,
        taskStatusById: { 1: 'MAPPED' },
      }),
    ).toEqual([]);
    expect(getAssignmentConflicts([undefined], 'mapATask', options)).toEqual([]);
  });
});
