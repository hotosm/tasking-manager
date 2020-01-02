import React from 'react';
import { Router, Redirect, globalHistory } from '@reach/router';
import { QueryParamProvider } from 'use-query-params';
import { useMeta } from 'react-meta-elements';

import './assets/styles/index.scss';
import { Header } from './components/header';
import { Footer } from './components/footer';
import { ProjectCreate } from './components/projectCreate/create';
import { ORG_NAME } from './config';
import { Home } from './views/home';
import { AboutPage } from './views/about';
import { LearnPage } from './views/learn';
import { ManageProjectsPage, ProjectsPage, ProjectsPageIndex, MoreFilters, ProjectDetailPage } from './views/project';
import { Authorized } from './views/authorized';
import { Login } from './views/login';
import { Welcome } from './views/welcome';
import { Settings } from './views/settings';
import { Management } from './views/management';
import { ListOrganisations, CreateOrganisation, EditOrganisation } from './views/organisations';
import { ListTeams, CreateTeam, EditTeam } from './views/teams';
import { ListCampaigns, CreateCampaign, EditCampaign } from './views/campaigns';
import { NotFound } from './views/notFound';
import { SelectTask } from './views/taskSelection';
import { MapTask, ValidateTask } from './views/taskAction';
import { EmailVerification } from './views/verifyEmail';
import { ProjectEdit } from './views/projectEdit';
import { NotificationsPage, NotificationPageIndex, NotificationDetail } from './views/notifications'

/*TODO(tdk): if QueryParamProvider is not needed elsewhere,
 *  create special sub-router for Projects page and wrap it only around that */
function App() {
  useMeta({ property: 'og:url', content: process.env.REACT_APP_BASE_URL });
  useMeta({ name: 'author', content: ORG_NAME });

  return (
    <div className="App w-100 base-font bg-white">
      <Router>
        <Header path="/*" />
      </Router>
      <div className="cf w-100 base-font">
        <QueryParamProvider reachHistory={globalHistory}>
          <Router>
            <Home path="/" />
            <ProjectsPage path="explore">
              <ProjectsPageIndex path="/" />
              <MoreFilters path="/filters/*" />
            </ProjectsPage>
            <LearnPage path="learn" />
            <AboutPage path="about" />
            <Authorized path="authorized" />
            <Login path="login" />
            <Welcome path="welcome" />
            <Settings path="settings" />
            <EmailVerification path="verify-email" />
            <Management path="manage/" />
            <ListOrganisations path="manage/organisations/" />
            <CreateOrganisation path="manage/organisations/new/" />
            <EditOrganisation path="manage/organisations/:id/" />
            <ListTeams path="manage/teams/" />
            <CreateTeam path="manage/teams/new" />
            <EditTeam path="manage/teams/:id" />
            <ListCampaigns path="manage/campaigns/" />
            <CreateCampaign path="manage/campaigns/new" />
            <EditCampaign path="manage/campaigns/:id" />
            <ProjectCreate path="manage/projects/new" />
            <ProjectEdit path="manage/projects/:id" />
            <ManageProjectsPage path="manage/projects/" />
            <ManageProjectsPage path="projects/" />
            <SelectTask path="projects/:id/tasks" />
            <MapTask path="projects/:id/map" />
            <ValidateTask path="projects/:id/validate" />
            <NotificationsPage path="inbox">
              <NotificationPageIndex path="/"/>
              <NotificationDetail path="message/:id" />
            </NotificationsPage>
            <ProjectDetailPage path="projects/:id" />
            <Redirect from="project/:id" to="projects/:id" noThrow />
            <NotFound default />
          </Router>
        </QueryParamProvider>
      </div>
      <Router primary={false}>
        <Footer path="/*" />
      </Router>
    </div>
  );
}

export default App;
