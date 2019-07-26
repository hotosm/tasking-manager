import { applyMiddleware,  createStore, compose } from "redux";
import thunk from "redux-thunk";
import { Map } from 'immutable';

import * as safeStorage from '../utils/safe_storage';
import reducers from "./reducers";


const persistedState = {
  auth: Map({userDetails: Map({
    username: safeStorage.getItem('username'),
  }),
  token: safeStorage.getItem('token'),
}),
  preferences: {
    language: safeStorage.getItem('language'),
  }
};

const enhancers = [];

if (process.env.NODE_ENV === 'development') {
  const devToolsExtension = window.devToolsExtension;

  if (typeof devToolsExtension === 'function') {
    enhancers.push(devToolsExtension());
  }
}

const composedEnhancers = compose(applyMiddleware(thunk), ...enhancers);

const store = createStore(
  reducers,
  persistedState,
  composedEnhancers
);

export { store };
