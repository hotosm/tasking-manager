import React from 'react';
import { Provider } from 'react-redux';
import TestRenderer from 'react-test-renderer';
import { IntlProvider } from 'react-intl';

import { store } from '../store';

export const createComponentWithIntl = (children, props = { locale: 'en' }) => {
  return TestRenderer.create(<IntlProvider {...props}>{children}</IntlProvider>);
};

export const createComponentWithReduxAndIntl = (children, props = { locale: 'en' }) => {
  return TestRenderer.create(<ReduxIntlProviders {...props}>{children}</ReduxIntlProviders>);
};

export const ReduxIntlProviders = ({
  children,
  props = { locale: 'en' },
  localStore = null,
}: Object) => (
  <Provider store={localStore || store}>
    <IntlProvider {...props}>{children}</IntlProvider>
  </Provider>
);

export const IntlProviders = ({ children, props = { locale: 'en' } }: Object) => (
  <IntlProvider {...props}>{children}</IntlProvider>
);
