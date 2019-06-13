import React from 'react';
import ReactDOM from 'react-dom';
import { IntlProvider, addLocaleData } from 'react-intl';
import WebFont from 'webfontloader';
import de from 'react-intl/locale-data/de'
import en from 'react-intl/locale-data/en'
import es from 'react-intl/locale-data/es'
import fr from 'react-intl/locale-data/fr'
import ja from 'react-intl/locale-data/ja'
import ko from 'react-intl/locale-data/ko'
import pt from 'react-intl/locale-data/pt'

import App from './App';
import * as serviceWorker from './serviceWorker';

WebFont.load({
  google: {
    families: [
      'Barlow Condensed:400,600,700', 'Archivo:400,500,600,700', 'sans-serif'
    ]
  }
});

addLocaleData([...en, ...fr, ...es, ...de, ...ja, ...ko, ...pt])
export const ConnectedIntl = props => (
  <IntlProvider key={props.locale} locale={props.locale} messages={props.messages}>
    {props.children}
  </IntlProvider>
);

ReactDOM.render(
  <ConnectedIntl locale={'pt'} >
    <App />
  </ConnectedIntl>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
