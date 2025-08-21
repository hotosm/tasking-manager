import { types } from '../actions/auth';

const initialState = {
  userDetails: {},
  token: '',
  session: {},
  osm: {},
  organisations: [],
  pmTeams: [],
};

export function authorizationReducer(state = initialState, action) {
  switch (action.type) {
    case types.SET_USER_DETAILS: {
      return { ...state, userDetails: action.userDetails };
    }
    case types.SET_OSM: {
      return { ...state, osm: action.osm };
    }
    case types.SET_ORGANISATIONS: {
      return { ...state, organisations: action.organisations };
    }
    case types.SET_PM_TEAMS: {
      return { ...state, pmTeams: action.teams };
    }
    case types.SET_TOKEN: {
      return { ...state, token: action.token };
    }
    case types.SET_SESSION: {
      return { ...state, session: action.session };
    }
    case types.CLEAR_SESSION: {
      return initialState;
    }
      case types.SET_SANDBOX_TOKEN: {
      return {
        ...state,
        sandboxTokens: { ...state.sandboxTokens, [action.sandbox]: action.tokenData },
        sandboxAuthError: null,
      };
    }
    case types.CLEAR_SANDBOX_TOKEN: {
      const { [action.sandbox]: removed, ...remainingTokens } = state.sandboxTokens;
      return { ...state, sandboxTokens: remainingTokens };
    }
    case types.SET_SANDBOX_AUTH_ERROR: {
      return { ...state, sandboxAuthError: action.error };
    }
    case types.CLEAR_SANDBOX_AUTH_ERROR: {
      return { ...state, sandboxAuthError: null };
    }
    default:
      return state;
  }
}
