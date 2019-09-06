import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from "react-redux";
import {IntlProvider} from 'react-intl';

import { store } from './store';
import App from './App';

/* fix https://github.com/mapbox/mapbox-gl-js/issues/3436 */
jest.mock('mapbox-gl/dist/mapbox-gl', () => ({
  Map: () => ({}),
}));

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(
    <Provider store={store}>
      <IntlProvider locale='en'>
        <App />
      </IntlProvider>
    </Provider>,
    div
  );
  ReactDOM.unmountComponentAtNode(div);
});
