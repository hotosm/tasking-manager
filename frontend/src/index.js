import React from 'react';
import ReactDOM from 'react-dom';
import { PersistGate } from 'redux-persist/integration/react';
import { Provider } from 'react-redux';
import WebFont from 'webfontloader';
import * as Sentry from '@sentry/react';
import 'react-tooltip/dist/react-tooltip.css'; // Needed by for { Tooltip } from 'react-tooltip' to work properly

import App from './App';
import { store, persistor } from './store';
import { ConnectedIntl } from './utils/internationalization';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { ENABLE_SERVICEWORKER, SENTRY_FRONTEND_DSN, ENVIRONMENT } from './config';

if (SENTRY_FRONTEND_DSN) {
  Sentry.init({
    dsn: SENTRY_FRONTEND_DSN,
    environment: ENVIRONMENT,
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay({
        // Additional SDK configuration goes in here, for example:
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: 0.1,

    // Session Replays integration
    replaysSessionSampleRate: 1.0,
    // If the entire session is not sampled, use the below sample rate to sample
    // sessions when an error occurs.
    replaysOnErrorSampleRate: 1.0,
  });
}

WebFont.load({
  google: {
    families: ['Barlow Condensed:400,500,600,700', 'Archivo:400,500,600,700', 'sans-serif'],
  },
});

ReactDOM.render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <ConnectedIntl>
        <App />
      </ConnectedIntl>
    </PersistGate>
  </Provider>,
  document.getElementById('root'),
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA.
// More complex to use for TM if your frontend and backend are on same server.
if (
  ENABLE_SERVICEWORKER === '1' ||
  ENABLE_SERVICEWORKER === 'true' ||
  ENABLE_SERVICEWORKER === true
) {
  serviceWorkerRegistration.register({ onUpdate: serviceWorkerRegistration.onServiceWorkerUpdate });
} else {
  serviceWorkerRegistration.unregister();
}
