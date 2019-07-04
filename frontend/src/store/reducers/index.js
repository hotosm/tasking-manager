import { combineReducers } from "redux";

import { preferencesReducer } from './userPreferences';
import { authorizationReducer } from './authorization';


export default combineReducers({
  preferences: preferencesReducer,
  auth: authorizationReducer,
});
