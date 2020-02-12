import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import WebFont from 'webfontloader';
import { addLocaleData } from 'react-intl';

import ar from 'react-intl/locale-data/ar';
import lt from 'react-intl/locale-data/lt';
import ja from 'react-intl/locale-data/ja';
import pt from 'react-intl/locale-data/pt';
import en from 'react-intl/locale-data/en';
import si from 'react-intl/locale-data/si';
import uk from 'react-intl/locale-data/uk';
import ta from 'react-intl/locale-data/ta';
import nl from 'react-intl/locale-data/nl';
import id from 'react-intl/locale-data/id';
import gl from 'react-intl/locale-data/gl';
import mg from 'react-intl/locale-data/mg';
import zh from 'react-intl/locale-data/zh';
import es from 'react-intl/locale-data/es';
import cs from 'react-intl/locale-data/cs';
import pl from 'react-intl/locale-data/pl';
import nb from 'react-intl/locale-data/nb';
import fa from 'react-intl/locale-data/fa';
import vi from 'react-intl/locale-data/vi';
import fr from 'react-intl/locale-data/fr';
import de from 'react-intl/locale-data/de';
import it from 'react-intl/locale-data/it';
import ru from 'react-intl/locale-data/ru';
import sl from 'react-intl/locale-data/sl';
import tl from 'react-intl/locale-data/tl';
import tr from 'react-intl/locale-data/tr';
import sw from 'react-intl/locale-data/sw';
import da from 'react-intl/locale-data/da';
import hu from 'react-intl/locale-data/hu';
import fi from 'react-intl/locale-data/fi';

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
  ...lt,
  ...ja,
  ...pt,
  ...en,
  ...si,
  ...uk,
  ...ta,
  ...nl,
  ...id,
  ...gl,
  ...mg,
  ...zh,
  ...es,
  ...cs,
  ...pl,
  ...nb,
  ...fa,
  ...vi,
  ...fr,
  ...de,
  ...it,
  ...ru,
  ...sl,
  ...sw,
  ...tr,
  ...tl,
  ...da,
  ...hu,
  ...fi,
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
