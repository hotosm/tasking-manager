import { applyMiddleware, createStore, compose } from 'redux';
import thunk from 'redux-thunk';

import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import * as safeStorage from '../utils/safe_storage';
import reducers from './reducers';

const persistConfig = {
  key: 'root',
  storage,
  blacklist: ['editor'],
};

const persistedState = {
  auth: Map({
    userDetails: Map({
      username: safeStorage.getItem('username'),
    }),
    token: safeStorage.getItem('token'),
    session: {
      osm_oauth_token: safeStorage.getItem('osm_oauth_token'),
    },
  }),
  preferences: {
    locale: safeStorage.getItem('locale'),
    action: safeStorage.getItem('action'),
    mapShown: 'true' === safeStorage.getItem('mapShown'),
    projectListView: 'true' === safeStorage.getItem('projectListView'),
  },
};

const persistedReducer = persistReducer(persistConfig, reducers);

const enhancers = [];

const composeEnhancers =
  (process.env.NODE_ENV === 'development' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) ||
  compose;

const composedEnhancers = composeEnhancers(applyMiddleware(thunk), ...enhancers);

const store = createStore(persistedReducer, {}, composedEnhancers);

const persistor = persistStore(store);

store.subscribe(() => {
  safeStorage.setItem('mapShown', store.getState().preferences['mapShown']);
  safeStorage.setItem('action', store.getState().preferences['action']);
  safeStorage.setItem('projectListView', store.getState().preferences['projectListView']);
});

export { store, persistor };
