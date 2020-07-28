import React from 'react';
import { Provider } from 'react-redux';
import TestRenderer from 'react-test-renderer';
import { IntlProvider } from 'react-intl';

import { store } from '../store';

export const createComponentWithIntl = (children, props = { locale: 'en' }) => {
  return TestRenderer.create(<IntlProvider {...props}>{children}</IntlProvider>);
};

export const createComponentWithReduxAndIntl = (children, props = { locale: 'en' }) => {
  return TestRenderer.create(
    <Provider store={store}>
      <IntlProvider {...props}>{children}</IntlProvider>
    </Provider>,
  );
};

export const ReduxIntlProviders = ({ children, props = { locale: 'en' } }: Object) => (
  <Provider store={store}>
    <IntlProvider {...props}>{children}</IntlProvider>
  </Provider>
);
