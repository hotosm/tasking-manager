import { types } from '../actions/auth';

type User = {
  user: {
    email: string;
    success: boolean;
    details: string;
    id: number;
  }
};

const initialState = {
  user: {
    email: '',
    success: false,
    details: '',
    id: 0,
  },
} satisfies User;

type Actions = {
  type: typeof types.REGISTER_USER,
  payload: User['user'],
};

export function userReducer(state: User = initialState, action: Actions) {
  switch (action.type) {
    case types.REGISTER_USER: {
      return {
        ...state,
        user: action.payload,
      };
    }
    default:
      return state;
  }
}
