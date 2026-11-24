// Assignments of project 123 (tasks from utils/tests/snippets/tasksGeometry.js).
// The default msw handler returns no assignments so existing task selection tests are
// unaffected; tests that need these use server.use() with this data.
export const taskAssignments = {
  assignments: [
    {
      taskId: 1,
      stage: 'MAPPING',
      assigneeType: 'USER',
      userId: 420,
      username: 'somebodyWhoHasntContributed',
      teamId: null,
      teamName: null,
      assignedBy: 'pm_user',
      assignedDate: '2026-11-20T10:00:00Z',
    },
    {
      taskId: 2,
      stage: 'MAPPING',
      assigneeType: 'USER',
      userId: 999,
      username: 'another_mapper',
      teamId: null,
      teamName: null,
      assignedBy: 'pm_user',
      assignedDate: '2026-11-20T10:00:00Z',
    },
    {
      taskId: 3,
      stage: 'MAPPING',
      assigneeType: 'TEAM',
      userId: null,
      username: null,
      teamId: 4,
      teamName: 'Test KLL Team',
      assignedBy: 'pm_user',
      assignedDate: '2026-11-20T10:00:00Z',
    },
    {
      taskId: 5,
      stage: 'VALIDATION',
      assigneeType: 'TEAM',
      userId: null,
      username: null,
      teamId: 1,
      teamName: 'Team Test',
      assignedBy: 'pm_user',
      assignedDate: '2026-11-21T10:00:00Z',
    },
  ],
};

export const noTaskAssignments = { assignments: [] };

export const assignTasksSuccess = { assigned: 2, warnings: [] };

export const assignTasksWithWarnings = {
  assigned: 2,
  warnings: [
    {
      subCode: 'AssigneeMappingLevelTooLow',
      message: 'The assignee mapping level is lower than the project requires',
    },
  ],
};

export const unassignTasksSuccess = { unassigned: 2 };

export const assignedTasks = {
  tasks: [
    {
      projectId: 123,
      projectName: 'Project Name 123',
      taskId: 1,
      taskStatus: 'READY',
      stage: 'MAPPING',
      assigneeType: 'USER',
      teamId: null,
      teamName: null,
      assignedBy: 'pm_user',
      assignedDate: '2026-11-20T10:00:00Z',
    },
    {
      projectId: 123,
      projectName: 'Project Name 123',
      taskId: 5,
      taskStatus: 'MAPPED',
      stage: 'VALIDATION',
      assigneeType: 'TEAM',
      teamId: 1,
      teamName: 'Team Test',
      assignedBy: 'pm_user',
      assignedDate: '2026-11-21T10:00:00Z',
    },
  ],
  pagination: {
    hasNext: false,
    hasPrev: false,
    nextNum: null,
    page: 1,
    pages: 1,
    prevNum: null,
    perPage: 20,
    total: 2,
  },
};
