import { applyMiddleware, createStore, compose } from 'redux';
import thunk from 'redux-thunk';
import { Map } from 'immutable';

import * as safeStorage from '../utils/safe_storage';
import reducers from './reducers';

const persistedState = {
  auth: Map({
    userDetails: Map({
      username: safeStorage.getItem('username'),
    }),
    token: safeStorage.getItem('token'),
    userPicture: safeStorage.getItem('userPicture'),
  }),
  preferences: {
    locale: safeStorage.getItem('locale'),
    mapShown: 'true' === safeStorage.getItem('mapShown'),
  },
};

const enhancers = [];

const composeEnhancers =
  (process.env.NODE_ENV === 'development' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) ||
  compose;

const composedEnhancers = composeEnhancers(applyMiddleware(thunk), ...enhancers);

const store = createStore(reducers, persistedState, composedEnhancers);

store.subscribe(() => {
  safeStorage.setItem('mapShown', store.getState().preferences['mapShown']);
});

export { store };
