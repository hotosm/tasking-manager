import { combineReducers } from "redux";
import { routerReducer } from "react-router-redux";

import { preferencesReducer } from './userPreferences';


export default combineReducers({
  preferences: preferencesReducer,
  router: routerReducer
});
