import React from 'react';
import { Router, Redirect, globalHistory } from '@reach/router';
import { QueryParamProvider } from 'use-query-params';

import './assets/styles/index.scss';
import { Header } from './components/header';
import { Footer } from './components/footer';
import { ProjectCreate } from './components/projectCreate/create';
import { Home } from './views/home';
import { AboutPage } from './views/about';
import { ProjectsPage, ProjectsPageIndex, MoreFilters, ProjectDetailPage } from './views/project';
import { Authorized } from './views/authorized';
import { Login } from './views/login';
import { Welcome } from './views/welcome';
import { Settings } from './views/settings';
import { NotFound } from './views/notFound';
import { SelectTask } from './views/taskSelection';
import { EmailVerification } from './views/verifyEmail';

/*TODO(tdk): if QueryParamProvider is not needed elsewhere,
 *  create special sub-router for Projects page and wrap it only around that */
function App() {
  return (
    <div className="App w-100 base-font bg-white">
      <Router>
        <Header path="/*"/>
      </Router>
      <div className="cf w-100 base-font">
        <QueryParamProvider reachHistory={globalHistory}>
          <Router>
            <Home path="/" />
            <ProjectsPage path="explore">
              <ProjectsPageIndex path="/" />
              <MoreFilters path="/filters/*" />
            </ProjectsPage>
            <AboutPage path="about" />
            <Authorized path="authorized" />
            <Login path="login" />
            <Welcome path="welcome" />
            <Settings path="settings" />
            <EmailVerification path="verify-email" />
            <SelectTask path="projects/:id/map" />
            <ProjectDetailPage path="projects/:id" />
            <Redirect from="project/:id" to="projects/:id" noThrow />
            <ProjectCreate path="/manage/projects/new" />
            <NotFound default />
          </Router>
        </QueryParamProvider>
      </div>
      <Router primary={false}>
        <Footer path="/*"/>
      </Router>
    </div>
  );
}

export default App;
