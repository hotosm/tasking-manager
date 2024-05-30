import React, { Suspense, useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ReactPlaceholder from 'react-placeholder';
import { useMeta } from 'react-meta-elements';
import { useSelector } from 'react-redux';
import * as Sentry from '@sentry/react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import './assets/styles/index.scss';

import { getUserDetails } from './store/actions/auth';
import { store } from './store';
import { ORG_NAME, MATOMO_ID } from './config';
import { Preloader } from './components/preloader';
import { FallbackComponent } from './views/fallback';
import { Banner, ArchivalNotificationBanner } from './components/banner/index';
import { router } from './routes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Don't retry for 401 or 403 errors
        const maxRetries = 3;
        if (error?.response?.status) {
          const statusCode = error.response.status;
          if (statusCode === 401 || statusCode === 403) {
            return false;
          }
        }
        return failureCount < maxRetries;
      },
    },
  },
});

const App = () => {
  useMeta({ property: 'og:url', content: process.env.REACT_APP_BASE_URL });
  useMeta({ name: 'author', content: ORG_NAME });
  const isLoading = useSelector((state) => state.loader.isLoading);
  const locale = useSelector((state) => state.preferences.locale);

  useEffect(() => {
    // fetch user details endpoint when the user is returning to a logged in session
    store.dispatch(getUserDetails(store.getState()));
  }, []);

  return (
    <Sentry.ErrorBoundary fallback={<FallbackComponent />}>
      {isLoading ? (
        <Preloader />
      ) : (
        <div className="w-100 base-font bg-white" lang={locale}>
          <main className="cf w-100 base-font">
            <QueryClientProvider client={queryClient}>
              <Suspense fallback={<ReactPlaceholder showLoadingAnimation rows={30} delay={300} />}>
                <RouterProvider router={router} fallbackElement={<Preloader />} />
              </Suspense>
              <ReactQueryDevtools />
            </QueryClientProvider>
          </main>
          <ArchivalNotificationBanner />
          {MATOMO_ID && <Banner />}
          <Toaster
            position="bottom-left"
            toastOptions={{
              style: {
                padding: '1rem',
                borderRadius: '10px',
                background: '#333',
                color: '#fff',
              },
            }}
          />
        </div>
      )}
    </Sentry.ErrorBoundary>
  );
};

export default App;
