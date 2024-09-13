import { types } from '../actions/userPreferences';

const initialState = {
  locale: null,
  mapShown: false,
  projectListView: false,
  isExploreProjectsTableView: false,
  action: 'any',
};

export function preferencesReducer(state = initialState, action) {
  switch (action.type) {
    case types.SET_LOCALE: {
      return {
        ...state,
        locale: action.locale,
      };
    }
    case types.SET_ACTION: {
      return {
        ...state,
        action: action.action,
      };
    }
    case types.TOGGLE_MAP: {
      return {
        ...state,
        mapShown: !state.mapShown,
      };
    }
    case types.TOGGLE_LIST_VIEW: {
      return {
        ...state,
        projectListView: true,
      };
    }
    case types.TOGGLE_CARD_VIEW: {
      return {
        ...state,
        projectListView: false,
      };
    }
    case types.SET_EXPLORE_PROJECTS_TABLE_VIEW: {
      return {
        ...state,
        isExploreProjectsTableView: true,
      };
    }
    case types.SET_EXPLORE_PROJECTS_CARD_VIEW: {
      return {
        ...state,
        isExploreProjectsTableView: false,
      };
    }
    default:
      return state;
  }
}
