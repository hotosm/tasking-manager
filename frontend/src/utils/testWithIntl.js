import React from 'react';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import { createHistory, createMemorySource, LocationProvider } from '@reach/router';
import TestRenderer from 'react-test-renderer';
import { IntlProvider } from 'react-intl';

import { store } from '../store';

export const createComponentWithIntl = (children, props = { locale: 'en' }) => {
  return TestRenderer.create(<IntlProvider {...props}>{children}</IntlProvider>);
};

export const createComponentWithReduxAndIntl = (children, props = { locale: 'en' }) => {
  return TestRenderer.create(<ReduxIntlProviders {...props}>{children}</ReduxIntlProviders>);
};

export function renderWithRouter(
  ui,
  { route = '/', history = createHistory(createMemorySource(route)) } = {},
) {
  return {
    ...render(<LocationProvider history={history}>{ui}</LocationProvider>),
    // adding `history` to the returned utilities to allow us
    // to reference it in our tests (just try to avoid using
    // this to test implementation details).
    history,
  };
}

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
