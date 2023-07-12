import React from 'react';
import { Outlet } from 'react-router-dom';
import { QueryParamProvider } from 'use-query-params';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';

import { TopBanner } from '../components/banner/topBanner';
import { Header } from '../components/header';
import { Footer } from '../components/footer';

// Including components that use React Router hooks here
// Components common to all routes can be included in <App>
export function Root() {
  return (
    <div
      className="min-vh-100-l"
      style={{ display: 'grid', gridTemplateRows: 'auto auto 1fr auto' }}
    >
      <TopBanner />
      <Header />
      <QueryParamProvider adapter={ReactRouter6Adapter}>
        <Outlet />
      </QueryParamProvider>
      <Footer />
    </div>
  );
}
