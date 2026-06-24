import { router } from '../routes';

// Mock the lazy loaded modules so they don't actually try to fetch files that might fail in JSDOM
jest.mock('../views/home', () => ({ Home: () => null }));
jest.mock('../views/project', () => ({
  ProjectsPage: () => null,
  ProjectsPageIndex: () => null,
  MoreFilters: () => null,
  ProjectDetailPage: () => null,
  UserProjectsPage: () => null,
  ManageProjectsPage: () => null,
  CreateProject: () => null,
}));
jest.mock('../views/projectEdit', () => ({ ProjectEdit: () => null }));
jest.mock('../views/taskSelection', () => ({ SelectTask: () => null }));
jest.mock('../views/taskAction', () => ({ MapTask: () => null, ValidateTask: () => null }));
jest.mock('../views/projectStats', () => ({ ProjectStats: () => null }));
jest.mock('../views/organisationStats', () => ({ OrganisationStats: () => null }));
jest.mock('../views/partnersStats', () => ({ PartnersStats: () => null }));
jest.mock('../views/organisationDetail', () => ({ OrganisationDetail: () => null }));
jest.mock('../views/learn', () => ({ LearnPage: () => null }));
jest.mock('../views/quickstart', () => ({ QuickstartPage: () => null }));
jest.mock('../views/about', () => ({ AboutPage: () => null }));
jest.mock('../views/contact', () => ({ ContactPage: () => null }));
jest.mock('../views/contributions', () => ({
  ContributionsPageIndex: () => null,
  UserStats: () => null,
  ContributionsPage: () => null,
}));
jest.mock('../views/teams', () => ({
  MyTeams: () => null,
  ManageTeams: () => null,
  CreateTeam: () => null,
  EditTeam: () => null,
  TeamDetail: () => null,
}));
jest.mock('../views/userDetail', () => ({ UserDetail: () => null }));
jest.mock('../views/notifications', () => ({ NotificationsPage: () => null }));
jest.mock('../views/login', () => ({ Login: () => null }));
jest.mock('../views/welcome', () => ({ Welcome: () => null }));
jest.mock('../views/settings', () => ({ Settings: () => null }));
jest.mock('../views/verifyEmail', () => ({ EmailVerification: () => null }));
jest.mock('../views/management', () => ({
  ManagementSection: () => null,
  ManagementPageIndex: () => null,
}));
jest.mock('../views/stats', () => ({ Stats: () => null }));
jest.mock('../views/organisationManagement', () => ({
  ListOrganisations: () => null,
  CreateOrganisation: () => null,
  EditOrganisation: () => null,
}));
jest.mock('../views/partnersManagement', () => ({
  ListPartners: () => null,
  CreatePartner: () => null,
  EditPartners: () => null,
}));
jest.mock('../views/users', () => ({ UsersList: () => null }));
jest.mock('../views/campaigns', () => ({
  ListCampaigns: () => null,
  CreateCampaign: () => null,
  EditCampaign: () => null,
}));
jest.mock('../views/interests', () => ({
  ListInterests: () => null,
  CreateInterest: () => null,
  EditInterest: () => null,
}));
jest.mock('../views/licenses', () => ({
  ListLicenses: () => null,
  CreateLicense: () => null,
  EditLicense: () => null,
}));
jest.mock('../views/badges', () => ({
  ListBadges: () => null,
  CreateBadge: () => null,
  EditBadge: () => null,
}));
jest.mock('../views/levels', () => ({
  ListLevels: () => null,
  CreateLevel: () => null,
  EditLevel: () => null,
}));
jest.mock('../views/swagger', () => ({ SwaggerView: () => null }));

describe('routes.js lazy loading', () => {
  it('should successfully execute all lazy load functions', async () => {
    let lazyCount = 0;
    const checkRoutes = async (routes) => {
      for (const route of routes) {
        if (route.lazy) {
          lazyCount++;
          const result = await route.lazy();
          expect(result).toHaveProperty('Component');
        }
        if (route.children) {
          await checkRoutes(route.children);
        }
      }
    };
    await checkRoutes(router.routes);
    expect(lazyCount).toBeGreaterThan(0);
  });
});
