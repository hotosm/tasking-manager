import { applyMiddleware, createStore, compose } from 'redux';
import thunk from 'redux-thunk';

import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import { setItem } from '../utils/safe_storage';
import reducers from './reducers';

// Whitelist, not blacklist: only durable state (session + preferences) is
// persisted. Transient state such as `loader` must never reach disk.
const persistConfig = {
  key: 'root',
  storage,
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
