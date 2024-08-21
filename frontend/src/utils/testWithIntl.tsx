import { Provider } from 'react-redux';
import { act, render } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { BrowserRouter, createMemoryRouter, RouterProvider } from 'react-router-dom';
import TestRenderer from 'react-test-renderer';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

import { store } from '../store';
import userEvent from '@testing-library/user-event';
import { Store } from 'redux';

export const createComponentWithIntl = (props: {
  locale?: string,
  children: React.ReactNode,
}) => {
  return TestRenderer.create(<IntlProvider locale={props.locale ?? "en"}>{props.children}</IntlProvider>);
};

export const createComponentWithReduxAndIntl = (props: {
  locale?: string,
  children: React.ReactNode,
}) => {
  return TestRenderer.create(<ReduxIntlProviders locale={props.locale ?? "en"}>{props.children}</ReduxIntlProviders>);
};

export const renderWithRouter = (ui: React.ReactNode, { route = '/' } = {}) => {
  act(() => window.history.pushState({}, 'Test page', route));

  return {
    user: userEvent.setup({ writeToClipboard: true }),
    ...render(ui, { wrapper: BrowserRouter }),
  };
};

export const ReduxIntlProviders = (props: {
  children: React.ReactNode,
  locale?: string,
  localStore?: Store,
}) => (
  <Provider store={props.localStore || store}>
    <IntlProvider locale={props.locale ?? "en"}>{props.children}</IntlProvider>
  </Provider>
);

export const IntlProviders = (props: {
  children: React.ReactNode,
  locale?: string,
}) => (
  <IntlProvider locale={props.locale ?? "en"}>{props.children}</IntlProvider>
);

export const QueryClientProviders = (props: {
  children: React.ReactNode
}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      // ✅ no more errors on the console for tests
      error: process.env.NODE_ENV === 'test' ? () => { } : console.error,
    },
  });
  return <QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>;
};

export const createComponentWithMemoryRouter = (
  component: React.ReactNode,
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
