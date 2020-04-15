import { Map } from 'immutable';

import { types } from '../actions/auth';

const initialState = Map({
  userDetails: {},
  token: '',
  session: {},
  osm: {},
  organisations: [],
  pmTeams: [],
});

export function authorizationReducer(state = initialState, action) {
  switch (action.type) {
    case types.SET_USER_DETAILS: {
      return state.set('userDetails', action.userDetails);
    }
    case types.SET_OSM: {
      return state.set('osm', action.osm);
    }
    case types.SET_ORGANISATIONS: {
      return state.set('organisations', action.organisations);
    }
    case types.SET_PM_TEAMS: {
      return state.set('pmTeams', action.teams);
    }
    case types.SET_TOKEN: {
      return state.set('token', action.token);
    }
    case types.SET_SESSION: {
      return state.set('session', action.session);
    }
    case types.CLEAR_SESSION: {
      return initialState;
    }
    default:
      return state;
  }
}
