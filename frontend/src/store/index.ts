import { applyMiddleware, createStore, compose } from 'redux';
import thunk from 'redux-thunk';

import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import { setItem } from '../utils/safe_storage';
import reducers from './reducers';
import { composeWithDevTools } from '@redux-devtools/extension';

const persistConfig = {
  key: 'root',
  storage,
  blacklist: ['editor', 'orgBarVisibility'],
};

const persistedReducer = persistReducer<{
  preferences: {
    mapShown: boolean;
    action: string;
    projectListView: boolean;
  }
}>(persistConfig, reducers);

const store = createStore(persistedReducer, undefined, composeWithDevTools((applyMiddleware(thunk))));

const persistor = persistStore(store);

store.subscribe(() => {
  setItem('mapShown', store.getState().preferences.mapShown);
  setItem('action', store.getState().preferences.action);
  setItem('projectListView', store.getState().preferences.projectListView);
});

export { store, persistor };
