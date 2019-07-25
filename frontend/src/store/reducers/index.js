import { combineReducers } from "redux";

import { preferencesReducer } from './userPreferences';
import { authorizationReducer } from './auth';
import { teamReducer } from './team';

export default combineReducers({
  preferences: preferencesReducer,
  auth: authorizationReducer,
  team: teamReducer,
});
