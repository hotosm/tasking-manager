import { combineReducers } from "redux";

import { preferencesReducer } from './userPreferences';


export default combineReducers({
  preferences: preferencesReducer
});
