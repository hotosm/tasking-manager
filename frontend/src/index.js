import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import WebFont from 'webfontloader';
import * as Sentry from '@sentry/react';
import { Integrations } from '@sentry/tracing';

import App from './App';
import { store } from './store';
import { getUserDetails } from './store/actions/auth';
import { ConnectedIntl } from './utils/internationalization';
import * as serviceWorker from './serviceWorker';
import { ENABLE_SERVICEWORKER, SENTRY_FRONTEND_DSN, ENVIRONMENT } from './config';

if (SENTRY_FRONTEND_DSN) {
  Sentry.init({
    dsn: SENTRY_FRONTEND_DSN,
    environment: ENVIRONMENT,
    integrations: [new Integrations.BrowserTracing()],
    tracesSampleRate: 0.1,
  });
}

WebFont.load({
  google: {
    families: ['Barlow Condensed:400,600,700', 'Archivo:400,500,600,700', 'sans-serif'],
  },
});

ReactDOM.render(
  <Provider store={store}>
    <ConnectedIntl>
      <App />
    </ConnectedIntl>
  </Provider>,
  document.getElementById('root'),
);

// fetch user details endpoint when the user is returning to a logged in session
store.dispatch(getUserDetails(store.getState()));
// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA.
// More complex to use for TM if your frontend and backend are on same server.
if (
  ENABLE_SERVICEWORKER === '1' ||
  ENABLE_SERVICEWORKER === 'true' ||
  ENABLE_SERVICEWORKER === true
) {
  serviceWorker.register();
} else {
  serviceWorker.unregister();
}
