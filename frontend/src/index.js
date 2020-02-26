import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import WebFont from 'webfontloader';
import { addLocaleData } from 'react-intl';

import ar from 'react-intl/locale-data/ar';
import cs from 'react-intl/locale-data/cs';
import de from 'react-intl/locale-data/de';
import en from 'react-intl/locale-data/en';
import es from 'react-intl/locale-data/es';
import fr from 'react-intl/locale-data/fr';
import id from 'react-intl/locale-data/id';
import it from 'react-intl/locale-data/it';
import ja from 'react-intl/locale-data/ja';
import mg from 'react-intl/locale-data/mg';
import ml from 'react-intl/locale-data/ml';
import nl from 'react-intl/locale-data/nl';
import pt from 'react-intl/locale-data/pt';
import sw from 'react-intl/locale-data/sw';
import tl from 'react-intl/locale-data/tl';
import tr from 'react-intl/locale-data/tr';
import uk from 'react-intl/locale-data/uk';

import App from './App';
import { store } from './store';
import { getUserDetails } from './store/actions/auth';
import { ConnectedIntl } from './utils/internationalization';
import * as serviceWorker from './serviceWorker';
import { ENABLE_SERVICEWORKER } from './config';

WebFont.load({
  google: {
    families: ['Barlow Condensed:400,600,700', 'Archivo:400,500,600,700', 'sans-serif'],
  },
});

addLocaleData([
  ...ar,
  ...cs,
  ...de,
  ...en,
  ...es,
  ...fr,
  ...id,
  ...it,
  ...ja,
  ...mg,
  ...ml,
  ...nl,
  ...pt,
  ...sw,
  ...tl,
  ...tr,
  ...uk,
]);

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
