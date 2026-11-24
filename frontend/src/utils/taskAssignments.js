import { getRandomArrayItem } from './random';

export const ASSIGNMENT_STAGES = ['MAPPING', 'VALIDATION'];

// Assignment status is derived from the task status; the backend never stores it.
const STATUSES_BY_STAGE = {
  MAPPING: {
    pending: ['READY', 'INVALIDATED'],
    inProgress: ['LOCKED_FOR_MAPPING'],
    done: ['MAPPED', 'BADIMAGERY', 'VALIDATED'],
  },
  VALIDATION: {
    waiting: ['READY', 'LOCKED_FOR_MAPPING', 'INVALIDATED'],
    pending: ['MAPPED', 'BADIMAGERY'],
    inProgress: ['LOCKED_FOR_VALIDATION'],
    done: ['VALIDATED'],
  },
};

// Task statuses a random task can be picked from, per stage
const RANDOM_TASK_STATUSES = {
  MAPPING: ['READY', 'INVALIDATED'],
  VALIDATION: ['MAPPED', 'BADIMAGERY'],
};

const MAPPING_ACTIONS = ['mapATask', 'mapAnotherTask', 'mapSelectedTask'];
const VALIDATION_ACTIONS = ['validateATask', 'validateAnotherTask', 'validateSelectedTask'];

/**
 * Returns 'waiting' | 'pending' | 'inProgress' | 'done' for an assignment of the given stage
 * on a task with the given status, or null for unknown stages/statuses.
 */
export function getAssignmentStatus(stage, taskStatus) {
  const statuses = STATUSES_BY_STAGE[stage];
  if (!statuses) return null;
  return Object.keys(statuses).find((key) => statuses[key].includes(taskStatus)) || null;
}

export function isAssignmentActionable(stage, taskStatus) {
  return ['pending', 'inProgress'].includes(getAssignmentStatus(stage, taskStatus));
}

/** The assignment stage a task in this status is currently waiting on. */
export function getActiveStage(taskStatus) {
  if (['READY', 'INVALIDATED', 'LOCKED_FOR_MAPPING'].includes(taskStatus)) return 'MAPPING';
  if (['MAPPED', 'BADIMAGERY', 'LOCKED_FOR_VALIDATION'].includes(taskStatus)) return 'VALIDATION';
  return null;
}

/** The assignment stage that a task-selection action works on, or null. */
export function getStageForTaskAction(taskAction) {
  if (MAPPING_ACTIONS.includes(taskAction)) return 'MAPPING';
  if (VALIDATION_ACTIONS.includes(taskAction)) return 'VALIDATION';
  return null;
}

/** { [taskId]: { MAPPING?: assignment, VALIDATION?: assignment } } */
export function groupAssignmentsByTask(assignments) {
  return (assignments || []).reduce((acc, assignment) => {
    acc[assignment.taskId] = { ...acc[assignment.taskId], [assignment.stage]: assignment };
    return acc;
  }, {});
}

export function getAssigneeName(assignment) {
  if (!assignment) return null;
  return assignment.assigneeType === 'TEAM' ? assignment.teamName : assignment.username;
}

/**
 * How an assignment relates to the current user:
 * 'direct' (assigned to the user), 'team' (assigned to a team the user is an active member of),
 * 'other' (assigned to someone else) or null (no assignment).
 */
export function getAssignmentRelation(assignment, userId, userTeamIds = []) {
  if (!assignment) return null;
  if (assignment.assigneeType === 'TEAM') {
    return (userTeamIds || []).includes(assignment.teamId) ? 'team' : 'other';
  }
  return userId !== undefined && userId !== null && assignment.userId === userId
    ? 'direct'
    : 'other';
}

export function isAssignedToUser(assignment, userId, userTeamIds) {
  return ['direct', 'team'].includes(getAssignmentRelation(assignment, userId, userTeamIds));
}

/**
 * Adds flat assignment properties to each task feature (map layers can only read
 * primitive properties):
 * - mappingAssignee / validationAssignee: username or team name ('' when unassigned)
 * - mappingAssigneeIsTeam / validationAssigneeIsTeam
 * - assignmentMarker: 'mine' | 'other' | '' for the stage the task is currently waiting on
 * - assignedToMe: true when that assignment is to the user or one of their teams
 */
export function mergeAssignmentsIntoTasks(tasks, assignmentsByTask, userId, userTeamIds) {
  if (!tasks || !tasks.features) return tasks;
  return {
    ...tasks,
    features: tasks.features.map((feature) => {
      const { taskId, taskStatus } = feature.properties;
      const taskAssignments = (assignmentsByTask && assignmentsByTask[taskId]) || {};
      const activeStage = getActiveStage(taskStatus);
      const activeAssignment = activeStage ? taskAssignments[activeStage] : null;
      const relation = getAssignmentRelation(activeAssignment, userId, userTeamIds);
      return {
        ...feature,
        properties: {
          ...feature.properties,
          mappingAssignee: getAssigneeName(taskAssignments.MAPPING) || '',
          mappingAssigneeIsTeam: taskAssignments.MAPPING?.assigneeType === 'TEAM',
          validationAssignee: getAssigneeName(taskAssignments.VALIDATION) || '',
          validationAssigneeIsTeam: taskAssignments.VALIDATION?.assigneeType === 'TEAM',
          assignmentMarker: relation === null ? '' : relation === 'other' ? 'other' : 'mine',
          assignedToMe: relation === 'direct' || relation === 'team',
        },
      };
    }),
  };
}

/**
 * Picks a random task for the action, preferring tasks assigned to the user, then to the
 * user's teams, then unassigned tasks. Tasks assigned to others are only picked as a last
 * resort, and never when allowOthersAssigned is false (assignment enforced on the project).
 */
export function getRandomTaskByAction(
  activities,
  taskAction,
  { assignmentsByTask = {}, userId, userTeamIds = [], allowOthersAssigned = true } = {},
) {
  let stage = null;
  if (['validateATask', 'validateAnotherTask'].includes(taskAction)) stage = 'VALIDATION';
  if (['mapATask', 'mapAnotherTask'].includes(taskAction)) stage = 'MAPPING';
  if (!stage) return undefined;

  const tiers = { direct: [], team: [], unassigned: [], other: [] };
  (activities || [])
    .filter((task) => RANDOM_TASK_STATUSES[stage].includes(task.taskStatus))
    .forEach((task) => {
      const assignment = assignmentsByTask?.[task.taskId]?.[stage];
      const relation = getAssignmentRelation(assignment, userId, userTeamIds);
      tiers[relation || 'unassigned'].push(task.taskId);
    });

  const order = allowOthersAssigned
    ? ['direct', 'team', 'unassigned', 'other']
    : ['direct', 'team', 'unassigned'];
  const tier = order.find((key) => tiers[key].length > 0);
  return tier ? getRandomArrayItem(tiers[tier]) : undefined;
}

/**
 * Assignments (for the stage the action works on) of the given tasks that belong to someone
 * other than the user. Tasks whose status the assignment doesn't apply to are ignored.
 */
export function getAssignmentConflicts(
  taskIds,
  taskAction,
  { assignmentsByTask = {}, taskStatusById = {}, userId, userTeamIds = [] } = {},
) {
  const stage = getStageForTaskAction(taskAction);
  if (!stage) return [];
  return (taskIds || [])
    .filter((taskId) => taskId !== undefined && taskId !== null)
    .filter(
      (taskId) =>
        taskStatusById[taskId] === undefined ||
        isAssignmentActionable(stage, taskStatusById[taskId]),
    )
    .map((taskId) => assignmentsByTask?.[taskId]?.[stage])
    .filter((assignment) => getAssignmentRelation(assignment, userId, userTeamIds) === 'other');
}
