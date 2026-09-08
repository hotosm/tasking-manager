import { applyMiddleware, createStore, compose } from 'redux';
import thunk from 'redux-thunk';

import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import { setItem } from '../utils/safe_storage';
import reducers from './reducers';

// Only genuinely durable state belongs on disk: user preferences and the
// session. Everything else is either transient UI state or derived from the
// server, and must be recomputed on boot.
//
// This is a whitelist rather than a blacklist on purpose. With a blacklist,
// every new reducer is persisted by default until someone remembers to opt it
// out -- which is how `loader.isLoading` ended up on disk and left users stuck
// on a permanent spinner after an interrupted login.
const persistConfig = {
  key: 'root',
  storage,
  // Applied on write only -- redux-persist reads back whatever is already on
  // disk. So a user carrying a stale `loader.isLoading: true` still sees one
  // blank load, and is then rescued by the first write here dropping the slice.
  // No migration: recovering them a load earlier is not worth owning a version
  // contract, and rebuilding a fixed object in one would set `auth: undefined`
  // for anyone whose stored blob lacks it -- autoMergeLevel1 hard-sets that
  // over the reducer's initial state and every selector then throws.
  whitelist: ['preferences', 'auth'],
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
  setItem('mapShown', store.getState().preferences['mapShown']);
  setItem('action', store.getState().preferences['action']);
});

export { store, persistor };
