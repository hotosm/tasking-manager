import React from 'react';
import { Provider } from 'react-redux';
import { act, render } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { BrowserRouter, createMemoryRouter, RouterProvider } from 'react-router-dom';
import TestRenderer from 'react-test-renderer';

import { store } from '../store';
import userEvent from '@testing-library/user-event';

export const createComponentWithIntl = (children, props = { locale: 'en' }) => {
  return TestRenderer.create(<IntlProvider {...props}>{children}</IntlProvider>);
};

export const createComponentWithReduxAndIntl = (children, props = { locale: 'en' }) => {
  return TestRenderer.create(<ReduxIntlProviders {...props}>{children}</ReduxIntlProviders>);
};

export const renderWithRouter = (ui, { route = '/' } = {}) => {
  act(() => window.history.pushState({}, 'Test page', route));

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: BrowserRouter }),
  };
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

export const createComponentWithMemoryRouter = (
  component,
  { route = '/starting/path', entryRoute = route } = {},
) => {
  const user = userEvent.setup();
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <>Navigated from Start</>,
      },
      {
        path: route,
        // Render the component causing the navigate to route
        element: component,
      },
      {
        path: '*',
        element: <>Avoid match warnings</>,
      },
    ],
    {
      initialEntries: ['/', entryRoute],
      initialIndex: 1,
    },
  );

  const { container } = render(<RouterProvider router={router} />);

  return { user, container, router };
};
