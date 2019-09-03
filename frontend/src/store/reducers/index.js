import { combineReducers } from "redux";

import { preferencesReducer } from './userPreferences';
import { authorizationReducer } from './auth';
import { userReducer } from './user';


export default combineReducers({
  preferences: preferencesReducer,
  auth: authorizationReducer,
  user: userReducer
});
