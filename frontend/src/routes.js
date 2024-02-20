import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';

import { Root } from './views/root';
import { Authorized } from './views/authorized';
import { NotFound } from './views/notFound';
import { FallbackComponent } from './views/fallback';
import { Redirect } from './components/redirect';

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Root />} ErrorBoundary={FallbackComponent}>
      <Route
        index
        lazy={async () => {
          const { Home } = await import('./views/home' /* webpackChunkName: "home" */);
          return { Component: Home };
        }}
      />
      <Route
        path="explore"
        lazy={async () => {
          const { ProjectsPage } = await import(
            './views/project' /* webpackChunkName: "project" */
          );
          return { Component: ProjectsPage };
        }}
      >
        <Route
          index
          lazy={async () => {
            const { ProjectsPageIndex } = await import(
              './views/project' /* webpackChunkName: "project" */
            );
            return { Component: ProjectsPageIndex };
          }}
        />
        <Route
          path="filters/*"
          lazy={async () => {
            const { MoreFilters } = await import(
              './views/project' /* webpackChunkName: "project" */
            );
            return { Component: MoreFilters };
          }}
        />
      </Route>
      <Route
        path="projects/:id"
        lazy={async () => {
          const { ProjectDetailPage } = await import(
            './views/project' /* webpackChunkName: "project" */
          );
          return { Component: ProjectDetailPage };
        }}
      />
      <Route
        path="projects/:id/tasks"
        lazy={async () => {
          const { SelectTask } = await import(
            './views/taskSelection' /* webpackChunkName: "taskSelection" */
          );
          return { Component: SelectTask };
        }}
        ErrorBoundary={FallbackComponent}
      />
      <Route
        path="projects/:id/map"
        lazy={async () => {
          const { MapTask } = await import(
            './views/taskAction' /* webpackChunkName: "taskAction" */
          );
          return { Component: MapTask };
        }}
        ErrorBoundary={FallbackComponent}
      />
      <Route
        path="projects/:id/validate"
        lazy={async () => {
          const { ValidateTask } = await import(
            './views/taskAction' /* webpackChunkName: "taskAction" */
          );
          return { Component: ValidateTask };
        }}
        ErrorBoundary={FallbackComponent}
      />
      <Route
        path="projects/:id/stats"
        lazy={async () => {
          const { ProjectStats } = await import(
            './views/projectStats' /* webpackChunkName: "projectStats" */
          );
          return { Component: ProjectStats };
        }}
        ErrorBoundary={FallbackComponent}
      />
      <Route
        path="organisations/:id/stats/"
        lazy={async () => {
          const { OrganisationStats } = await import(
            './views/organisationStats' /* webpackChunkName: "organisationStats" */
          );
          return { Component: OrganisationStats };
        }}
      />
      <Route
        path="organisations/:slug/"
        lazy={async () => {
          const { OrganisationDetail } = await import(
            './views/organisationDetail' /* webpackChunkName: "organisationDetail" */
          );
          return { Component: OrganisationDetail };
        }}
      />
      <Route path="learn" element={<Redirect to="/learn/map" />} />
      <Route
        path="learn/:type"
        lazy={async () => {
          const { LearnPage } = await import('./views/learn' /* webpackChunkName: "learn" */);
          return { Component: LearnPage };
        }}
      />
      <Route
        path="learn/quickstart"
        lazy={async () => {
          const { QuickstartPage } = await import(
            './views/quickstart' /* webpackChunkName: "quickstart" */
          );
          return { Component: QuickstartPage };
        }}
      />
      <Route
        path="about"
        lazy={async () => {
          const { AboutPage } = await import('./views/about' /* webpackChunkName: "about" */);
          return { Component: AboutPage };
        }}
      />
      <Route
        path="contact/"
        lazy={async () => {
          const { ContactPage } = await import('./views/contact' /* webpackChunkName: "contact" */);
          return { Component: ContactPage };
        }}
      />
      <Route
        path="contributions"
        lazy={async () => {
          const { ContributionsPageIndex } = await import(
            './views/contributions' /* webpackChunkName: "contributions" */
          );
          return { Component: ContributionsPageIndex };
        }}
      >
        <Route
          index
          lazy={async () => {
            const { UserStats } = await import(
              './views/contributions' /* webpackChunkName: "contributions" */
            );
            return { Component: UserStats };
          }}
        />
        <Route
          path="tasks/*"
          lazy={async () => {
            const { ContributionsPage } = await import(
              './views/contributions' /* webpackChunkName: "contributions" */
            );
            return { Component: ContributionsPage };
          }}
        />
        <Route
          path="projects/*"
          lazy={async () => {
            const { UserProjectsPage } = await import(
              './views/project' /* webpackChunkName: "project" */
            );
            return { Component: UserProjectsPage };
          }}
        />
        <Route
          path="teams/*"
          lazy={async () => {
            const { MyTeams } = await import('./views/teams' /* webpackChunkName: "teams" */);
            return { Component: MyTeams };
          }}
        />
      </Route>
      <Route
        path="users/:username"
        lazy={async () => {
          const { UserDetail } = await import(
            './views/userDetail' /* webpackChunkName: "userDetail" */
          );
          return { Component: UserDetail };
        }}
      />
      <Route
        path="inbox"
        lazy={async () => {
          const { NotificationsPage } = await import(
            './views/notifications' /* webpackChunkName: "notifications" */
          );
          return { Component: NotificationsPage };
        }}
      />
      <Route path="authorized" element={<Authorized />} />
      <Route
        path="login"
        lazy={async () => {
          const { Login } = await import('./views/login' /* webpackChunkName: "login" */);
          return { Component: Login };
        }}
      />
      <Route
        path="welcome"
        lazy={async () => {
          const { Welcome } = await import('./views/welcome' /* webpackChunkName: "welcome" */);
          return { Component: Welcome };
        }}
      />
      <Route
        path="settings"
        lazy={async () => {
          const { Settings } = await import('./views/settings' /* webpackChunkName: "settings" */);
          return { Component: Settings };
        }}
      />
      <Route
        path="verify-email"
        lazy={async () => {
          const { EmailVerification } = await import(
            './views/verifyEmail' /* webpackChunkName: "verifyEmail" */
          );
          return { Component: EmailVerification };
        }}
      />
      <Route
        path="manage"
        lazy={async () => {
          const { ManagementSection } = await import(
            './views/management' /* webpackChunkName: "management" */
          );
          return { Component: ManagementSection };
        }}
      >
        <Route
          index
          lazy={async () => {
            const { ManagementPageIndex } = await import(
              './views/management' /* webpackChunkName: "management" */
            );
            return { Component: ManagementPageIndex };
          }}
        />
        <Route
          path="stats/"
          lazy={async () => {
            const { Stats } = await import('./views/stats' /* webpackChunkName: "stats" */);
            return { Component: Stats };
          }}
        />
        <Route
          path="organisations/"
          lazy={async () => {
            const { ListOrganisations } = await import(
              './views/organisationManagement' /* webpackChunkName: "organisationManagement" */
            );
            return { Component: ListOrganisations };
          }}
        />
        <Route
          path="organisations/new/"
          lazy={async () => {
            const { CreateOrganisation } = await import(
              './views/organisationManagement' /* webpackChunkName: "organisationManagement" */
            );
            return { Component: CreateOrganisation };
          }}
        />
        <Route
          path="organisations/:id/"
          lazy={async () => {
            const { EditOrganisation } = await import(
              './views/organisationManagement' /* webpackChunkName: "organisationManagement" */
            );
            return { Component: EditOrganisation };
          }}
        />
        <Route
          path="teams/"
          lazy={async () => {
            const { ManageTeams } = await import('./views/teams' /* webpackChunkName: "teams" */);
            return { Component: ManageTeams };
          }}
        />
        <Route
          path="users/"
          lazy={async () => {
            const { UsersList } = await import('./views/users' /* webpackChunkName: "users" */);
            return { Component: UsersList };
          }}
        />
        <Route
          path="teams/new"
          lazy={async () => {
            const { CreateTeam } = await import('./views/teams' /* webpackChunkName: "teams" */);
            return { Component: CreateTeam };
          }}
        />
        <Route
          path="teams/:id"
          lazy={async () => {
            const { EditTeam } = await import('./views/teams' /* webpackChunkName: "teams" */);
            return { Component: EditTeam };
          }}
        />
        <Route
          path="campaigns/"
          lazy={async () => {
            const { ListCampaigns } = await import(
              './views/campaigns' /* webpackChunkName: "campaigns" */
            );
            return { Component: ListCampaigns };
          }}
        />
        <Route
          path="campaigns/new"
          lazy={async () => {
            const { CreateCampaign } = await import(
              './views/campaigns' /* webpackChunkName: "campaigns" */
            );
            return { Component: CreateCampaign };
          }}
        />
        <Route
          path="campaigns/:id"
          lazy={async () => {
            const { EditCampaign } = await import(
              './views/campaigns' /* webpackChunkName: "campaigns" */
            );
            return { Component: EditCampaign };
          }}
        />
        <Route
          path="projects/new"
          lazy={async () => {
            const { CreateProject } = await import(
              './views/project' /* webpackChunkName: "project" */
            );
            return { Component: CreateProject };
          }}
        />
        <Route
          path="projects/:id"
          lazy={async () => {
            const { ProjectEdit } = await import(
              './views/projectEdit' /* webpackChunkName: "projectEdit" */
            );
            return { Component: ProjectEdit };
          }}
        />
        <Route
          path="projects/*"
          lazy={async () => {
            const { ManageProjectsPage } = await import(
              './views/project' /* webpackChunkName: "project" */
            );
            return { Component: ManageProjectsPage };
          }}
        />
        <Route
          path="categories/"
          lazy={async () => {
            const { ListInterests } = await import(
              './views/interests' /* webpackChunkName: "interests" */
            );
            return { Component: ListInterests };
          }}
        />
        <Route
          path="categories/:id"
          lazy={async () => {
            const { EditInterest } = await import(
              './views/interests' /* webpackChunkName: "interests" */
            );
            return { Component: EditInterest };
          }}
        />
        <Route
          path="categories/new"
          lazy={async () => {
            const { CreateInterest } = await import(
              './views/interests' /* webpackChunkName: "interests" */
            );
            return { Component: CreateInterest };
          }}
        />
        <Route
          path="licenses/new"
          lazy={async () => {
            const { CreateLicense } = await import(
              './views/licenses' /* webpackChunkName: "licenses" */
            );
            return { Component: CreateLicense };
          }}
        />
        <Route
          path="licenses/"
          lazy={async () => {
            const { ListLicenses } = await import(
              './views/licenses' /* webpackChunkName: "licenses" */
            );
            return { Component: ListLicenses };
          }}
        />
        <Route
          path="licenses/:id"
          lazy={async () => {
            const { EditLicense } = await import(
              './views/licenses' /* webpackChunkName: "licenses" */
            );
            return { Component: EditLicense };
          }}
        />
      </Route>
      <Route
        path="teams/:id/membership"
        lazy={async () => {
          const { TeamDetail } = await import('./views/teams' /* webpackChunkName: "teams" */);
          return { Component: TeamDetail };
        }}
      />
      <Route
        path="/api-docs/"
        lazy={async () => {
          const { SwaggerView } = await import('./views/swagger' /* webpackChunkName: "swagger" */);
          return { Component: SwaggerView };
        }}
      />
      <Route path="project/:id" element={<Redirect to="/projects/:id" />} />
      <Route path="*" element={<NotFound />} />
    </Route>,
  ),
);
