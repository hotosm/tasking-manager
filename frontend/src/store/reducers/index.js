import { combineReducers } from "redux";

import { preferencesReducer } from './userPreferences';
import { authorizationReducer } from './auth';


export default combineReducers({
  preferences: preferencesReducer,
  auth: authorizationReducer,
});
