import { combineReducers } from "redux";
import { routerReducer } from "react-router-redux";

import { preferencesReducer } from './userPreferences';
import { authorizationReducer } from './authorization';


export default combineReducers({
  preferences: preferencesReducer,
  auth: authorizationReducer,
  router: routerReducer
});
