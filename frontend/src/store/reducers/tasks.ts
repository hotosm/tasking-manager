import { types } from '../actions/tasks';

type TaskData = {
  tasks: {
    taskId: string;
    title: string;
    projectId: string;
    status: string;
  }[],
  status: string | null,
  project: any
}

const initialState = {
  project: null,
  tasks: [],
  status: null,
} satisfies TaskData;

type Actions = {
  type: typeof types.SET_PROJECT,
  project: any
} | {
  type: typeof types.SET_LOCKED_TASKS,
  tasks: any
} | {
  type: typeof types.SET_TASKS_STATUS,
  status: string
} | {
  type: typeof types.CLEAR_LOCKED_TASKS
}

export function tasksReducer(state: TaskData = initialState, action: Actions): TaskData {
  switch (action.type) {
    case types.SET_PROJECT: {
      return { ...state, project: action.project };
    }
    case types.SET_LOCKED_TASKS: {
      return { ...state, tasks: action.tasks };
    }
    case types.SET_TASKS_STATUS: {
      return { ...state, status: action.status };
    }
    case types.CLEAR_LOCKED_TASKS: {
      return initialState;
    }
    default:
      return state;
  }
}
