import React from 'react';
import { Router, Redirect, globalHistory } from '@reach/router';
import { QueryParamProvider } from 'use-query-params';
import { useMeta } from 'react-meta-elements';

import './assets/styles/index.scss';
import { Header } from './components/header';
import { Footer } from './components/footer';
import { ORG_NAME } from './config';
import { Home } from './views/home';
import { AboutPage } from './views/about';
import { LearnPage } from './views/learn';
import { UserDetail } from './views/userDetail';
import {
  ManageProjectsPage,
  CreateProject,
  ProjectsPage,
  ProjectsPageIndex,
  MoreFilters,
  ProjectDetailPage,
} from './views/project';
import { Authorized } from './views/authorized';
import { Login } from './views/login';
import { Welcome } from './views/welcome';
import { Settings } from './views/settings';
import { ManagementPageIndex, ManagementSection } from './views/management';
import { ListOrganisations, CreateOrganisation, EditOrganisation } from './views/organisations';
import { MyTeams, ManageTeams, CreateTeam, EditTeam, TeamDetail } from './views/teams';
import { ListCampaigns, CreateCampaign, EditCampaign } from './views/campaigns';
import { ListInterests, CreateInterest, EditInterest } from './views/interests';
import { UsersList } from './views/users';
import { NotFound } from './views/notFound';
import { SelectTask } from './views/taskSelection';
import { MapTask, ValidateTask } from './views/taskAction';
import { EmailVerification } from './views/verifyEmail';
import { ProjectEdit } from './views/projectEdit';
import { ContactPage } from './views/contact';
import { ContributionsPage, ContributionsPageIndex, UserStats } from './views/contributions';
import {
  NotificationsPage,
  NotificationPageIndex,
  NotificationDetail,
} from './views/notifications';

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
          <Router primary={false}>
            <Home path="/" />
            <ProjectsPage path="explore">
              <ProjectsPageIndex path="/" />
              <MoreFilters path="/filters/*" />
            </ProjectsPage>
            <LearnPage path="learn" />
            <ContributionsPageIndex path="contributions">
              <UserStats path="/" />
              <ContributionsPage path="tasks/*" />
              <ManageProjectsPage path="projects/*" />
            </ContributionsPageIndex>
            <AboutPage path="about" />
            <Authorized path="authorized" />
            <Login path="login" />
            <Welcome path="welcome" />
            <Settings path="settings" />
            <EmailVerification path="verify-email" />
            <ManagementSection path="manage">
              <ManagementPageIndex path="/" />
              <ListOrganisations path="organisations/" />
              <CreateOrganisation path="organisations/new/" />
              <EditOrganisation path="organisations/:id/" />
              <ManageTeams path="teams/" />
              <UsersList path="users/" />
              <CreateTeam path="teams/new" />
              <EditTeam path="teams/:id" />
              <ListCampaigns path="campaigns/" />
              <CreateCampaign path="campaigns/new" />
              <EditCampaign path="campaigns/:id" />
              <CreateProject path="projects/new" />
              <ProjectEdit path="projects/:id" />
              <ManageProjectsPage path="projects/*" />
              <ListInterests path="interests/" />
              <EditInterest path="interests/:id" />
              <CreateInterest path="interests/new" />
            </ManagementSection>
            <MyTeams path="teams" />
            <TeamDetail path="teams/:id/membership" />
            <SelectTask path="projects/:id/tasks" />
            <MapTask path="projects/:id/map" />
            <UserDetail path="users/:username" />
            <ValidateTask path="projects/:id/validate" />
            <NotificationsPage path="inbox">
              <NotificationPageIndex path="/" />
              <NotificationDetail path="message/:id" />
            </NotificationsPage>
            <ProjectDetailPage path="projects/:id" />
            <ContactPage path="contact/" />
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
