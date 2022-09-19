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
    default:
      return state;
  }
}
