import { combineReducers } from 'redux';

import { preferencesReducer } from './userPreferences';
import { authorizationReducer } from './auth';
import { tasksReducer } from './tasks';
import { userReducer } from './user';
import { projectReducer } from './project';

export default combineReducers({
  preferences: preferencesReducer,
  auth: authorizationReducer,
  lockedTasks: tasksReducer,
  user: userReducer,
  project: projectReducer
});
