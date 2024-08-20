import { types } from '../actions/auth';

type UserData = {
  userDetails: {
    id: number;
    username: string;
    emailAddress: string;
    role: string;
  } | null,
  token: string,
  session: {
    osm_oauth_token: string;
  } | null,
  osm: {
    accountCreated: string;
  } | null,
  organisations: string[],
  pmTeams: string[],
}

const initialState = {
  userDetails: null,
  token: '',
  session: null,
  osm: null,
  organisations: [],
  pmTeams: [],
} satisfies UserData;

type Actions = {
  type: typeof types.SET_USER_DETAILS,
  userDetails: UserData['userDetails'],
} | {
  type: typeof types.SET_OSM,
  osm: UserData['osm'],
} | {
  type: typeof types.SET_ORGANISATIONS,
  organisations: UserData['organisations'],
} | {
  type: typeof types.SET_PM_TEAMS,
  teams: UserData['pmTeams'],
} | {
  type: typeof types.SET_TOKEN,
  token: UserData['token'],
} | {
  type: typeof types.SET_SESSION,
  session: UserData['session'],
} | {
  type: typeof types.CLEAR_SESSION,
  session: null,
}

export function authorizationReducer(state = initialState, action: Actions) {
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
