import { combineReducers } from 'redux';

import { preferencesReducer } from './userPreferences';
import { authorizationReducer } from './auth';
import { tasksReducer } from './tasks';

export default combineReducers({
  preferences: preferencesReducer,
  auth: authorizationReducer,
  lockedTasks: tasksReducer,
});
