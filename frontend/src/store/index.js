import { applyMiddleware, createStore, compose } from "redux";
import createHistory from "history/createBrowserHistory";
import { routerMiddleware } from "react-router-redux";
import thunk from "redux-thunk";

import * as safeStorage from '../utils/safe_storage';
import reducers from "./reducers";


const persistedState = {
  // auth: {userDetails: {
  //   id: safeStorage.getItem('username'),
  //   username: safeStorage.getItem('username'),
  //   token: safeStorage.getItem('password'),
  // }},
  preferences: {
    language: safeStorage.getItem('language'),
  }
};

export const history = createHistory()
const middleware = [thunk, routerMiddleware(history)];
const enhancers = [];

if (process.env.NODE_ENV === 'development') {
  const devToolsExtension = window.devToolsExtension;

  if (typeof devToolsExtension === 'function') {
    enhancers.push(devToolsExtension());
  }
}

const composedEnhancers = compose(applyMiddleware(...middleware), ...enhancers);

const store = createStore(
  reducers,
  persistedState,
  composedEnhancers
);

export { store };
