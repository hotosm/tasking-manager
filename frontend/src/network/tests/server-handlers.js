import { rest } from 'msw';

import {
  getProjectSummary,
  getProjectStats,
  projects,
  projectDetail,
  userTouchedProjects,
  projectComments,
  userFavorite,
  favoritePost,
  activities,
  taskDetail,
  stopMapping,
  stopValidation,
  similarProjects,
} from './mockData/projects';
import { featuredProjects } from './mockData/featuredProjects';
import {
  newUsersStats,
  userStats,
  osmStatsProject,
  userLockedTasksDetails,
  ohsomeNowUserStats,
} from './mockData/userStats';
import { projectContributions, projectContributionsByDay } from './mockData/contributions';
import {
  usersList,
  levelUpdationSuccess,
  roleUpdationSuccess,
  userQueryDetails,
} from './mockData/userList';
import {
  license,
  licenseCreationSuccess,
  licenseDeletionSuccess,
  organisations,
  organisation,
  organisationUpdationSuccess,
  organisationCreationSuccess,
  organisationDeletionSuccess,
  campaigns,
  campaignCreationSuccess,
  campaign,
  campaignUpdationSuccess,
  campaignDeletionSuccess,
  interests,
  interest,
  interestCreationSuccess,
  interestUpdationSuccess,
  interestDeletionSuccess,
  licenses,
  licenseAccepted,
} from './mockData/management';
import {
  teams,
  team,
  teamCreationSuccess,
  teamUpdationSuccess,
  teamDeletionSuccess,
} from './mockData/teams';
import { userTasks } from './mockData/tasksStats';
import { homepageStats } from './mockData/homepageStats';
import {
  banner,
  countries,
  josmRemote,
  systemStats,
  ohsomeNowMetadata,
} from './mockData/miscellaneous';
import tasksGeojson from '../../utils/tests/snippets/tasksGeometry';
import { API_URL, OHSOME_STATS_BASE_URL } from '../../config';
import { notifications, ownCountUnread } from './mockData/notifications';
import { authLogin, setUser, userRegister } from './mockData/auth';
import {
  extendTask,
  lockForMapping,
  lockForValidation,
  splitTask,
  submitMappingTask,
  submitValidationTask,
  userLockedTasks,
} from './mockData/taskHistory';

const handlers = [
  rest.get(API_URL + 'projects/:id/queries/summary/', async (req, res, ctx) => {
    return res(ctx.json(getProjectSummary(Number(req.params.id))));
  }),
  rest.get(API_URL + 'projects/:id/activities/latest/', async (req, res, ctx) => {
    return res(ctx.json(activities(Number(req.params.id))));
  }),
  rest.get(API_URL + 'projects/:id/queries/priority-areas/', async (req, res, ctx) => {
    return res(ctx.json([]));
  }),
  rest.get(API_URL + 'projects/', async (req, res, ctx) => {
    return res(ctx.json(projects));
  }),
  rest.get(API_URL + 'projects/', async (req, res, ctx) => {
    return res(ctx.json(projects));
  }),
  rest.get(API_URL + 'projects/:id/contributions/', async (req, res, ctx) => {
    return res(ctx.json(projectContributions));
  }),
  rest.get(API_URL + 'projects/:id/', async (req, res, ctx) => {
    return res(ctx.json(projectDetail));
  }),
  rest.get(API_URL + 'projects/:id/comments/', async (req, res, ctx) => {
    return res(ctx.json(projectComments));
  }),
  rest.post(API_URL + 'projects/:id/comments/', async (req, res, ctx) => {
    return res(ctx.json({ message: 'Comment posted' }));
  }),
  rest.delete(API_URL + 'projects/:projectId/comments/:commentId/', async (req, res, ctx) => {
    return res(ctx.json({ message: 'Message deleted' }));
  }),
  rest.get(API_URL + 'projects/:id/favorite/', async (req, res, ctx) => {
    return res(ctx.json(userFavorite));
  }),
  rest.post(API_URL + 'projects/:id/favorite/', async (req, res, ctx) => {
    return res(ctx.json(favoritePost(req.params.id)));
  }),
  rest.get(API_URL + 'projects/:id/statistics/', async (req, res, ctx) => {
    const { id } = req.params;
    return res(ctx.json(getProjectStats(id)));
  }),
  rest.get(API_URL + 'projects/:id/contributions/queries/day/', async (req, res, ctx) => {
    return res(ctx.json(projectContributionsByDay));
  }),
  rest.get(API_URL + 'projects/:id/tasks', async (req, res, ctx) => {
    return res(ctx.json(tasksGeojson));
  }),
  rest.get(API_URL + 'projects/queries/featured/', async (req, res, ctx) => {
    return res(ctx.json(featuredProjects));
  }),
  rest.get(API_URL + 'projects/queries/:username/touched', async (req, res, ctx) => {
    return res(ctx.json(userTouchedProjects));
  }),
  rest.get(API_URL + 'projects/:projectId/tasks/:taskId/', async (req, res, ctx) => {
    return res(ctx.json(taskDetail(Number(req.params.taskId))));
  }),
  rest.post(
    API_URL + 'projects/:projectId/tasks/actions/stop-mapping/:taskId/',
    async (req, res, ctx) => {
      return res(ctx.json(stopMapping));
    },
  ),
  rest.post(
    API_URL + 'projects/:projectId/tasks/actions/stop-validation/',
    async (req, res, ctx) => {
      return res(ctx.json(stopValidation));
    },
  ),
  rest.get(API_URL + 'projects/queries/:projectId/similar-projects/', async (req, res, ctx) => {
    return res(ctx.json(similarProjects));
  }),
  // AUTHENTICATION
  rest.get(API_URL + 'system/authentication/login/', async (req, res, ctx) => {
    return res(ctx.json(authLogin));
  }),
  rest.post(API_URL + 'users/actions/register/', async (req, res, ctx) => {
    return res(ctx.json(userRegister));
  }),
  rest.patch(API_URL + 'users/me/actions/set-user/', async (req, res, ctx) => {
    return res(ctx.json(setUser));
  }),
  // NOTIFICATIONS
  rest.get(API_URL + 'notifications', async (req, res, ctx) => {
    return res(ctx.json(notifications));
  }),
  rest.get(API_URL + 'notifications/:id', async (req, res, ctx) => {
    return res(ctx.json(notifications.userMessages[0]));
  }),
  rest.get(API_URL + 'notifications/queries/own/count-unread/', async (req, res, ctx) => {
    return res(ctx.json(ownCountUnread));
  }),
  rest.delete(API_URL + 'notifications/:id/', async (req, res, ctx) => {
    return res(ctx.json({ Success: 'Message deleted' }));
  }),
  rest.delete(API_URL + 'notifications/delete-all/', async (req, res, ctx) => {
    return res(ctx.json({ Success: 'Message deleted' }));
  }),
  rest.delete(API_URL + 'notifications/delete-all/:types', async (req, res, ctx) => {
    return res(ctx.json({ Success: 'Message deleted' }));
  }),
  rest.delete(API_URL + 'notifications/delete-multiple/', async (req, res, ctx) => {
    return res(ctx.json({ Success: 'Message deleted' }));
  }),
  rest.post(API_URL + 'notifications/queries/own/post-unread/', async (req, res, ctx) => {
    return res(ctx.json(null));
  }),
  rest.post(API_URL + 'notifications/mark-as-read-all/', async (req, res, ctx) => {
    return res(ctx.json(null));
  }),
  rest.post(API_URL + 'notifications/mark-as-read-all/:types', async (req, res, ctx) => {
    return res(ctx.json(null));
  }),
  rest.post(API_URL + 'notifications/mark-as-read-multiple/', async (req, res, ctx) => {
    return res(ctx.json(null));
  }),
  // USER
  rest.get(API_URL + 'users/statistics/', async (req, res, ctx) => {
    return res(ctx.json(newUsersStats));
  }),
  rest.get(API_URL + 'tasks/statistics/', async (req, res, ctx) => {
    return res(ctx.json(newUsersStats));
  }),
  rest.get(API_URL + 'users/queries/:username', async (req, res, ctx) => {
    return res(ctx.json(userQueryDetails));
  }),
  rest.get(API_URL + 'users', async (req, res, ctx) => {
    return res(ctx.json(usersList));
  }),
  rest.patch(API_URL + 'users/:username/actions/set-level/:level', (req, res, ctx) => {
    return res(ctx.json(levelUpdationSuccess));
  }),
  rest.patch(API_URL + 'users/:username/actions/set-role/:role', (req, res, ctx) => {
    return res(ctx.json(roleUpdationSuccess));
  }),
  rest.get(API_URL + 'users/:userId/tasks/', async (req, res, ctx) => {
    return res(ctx.json(userTasks));
  }),
  rest.get(API_URL + 'users/:username/statistics/', async (req, res, ctx) => {
    return res(ctx.json(userStats));
  }),
  rest.get(API_URL + 'users/queries/tasks/locked/details/', async (req, res, ctx) => {
    return res(ctx.json(userLockedTasksDetails));
  }),
  // ORGANIZATIONS
  rest.get(API_URL + 'organisations', (req, res, ctx) => {
    return res(ctx.json(organisations));
  }),
  rest.get(API_URL + 'organisations/:id/', (req, res, ctx) => {
    return res(ctx.json(organisation));
  }),
  rest.post(API_URL + 'organisations', (req, res, ctx) => {
    return res(ctx.json(organisationCreationSuccess));
  }),
  rest.patch(API_URL + 'organisations/:id/', (req, res, ctx) => {
    return res(ctx.json(organisationUpdationSuccess));
  }),
  rest.delete(API_URL + 'organisations/:id', (req, res, ctx) => {
    return res(ctx.json(organisationDeletionSuccess));
  }),
  // TEAMS
  rest.get(API_URL + 'teams', (req, res, ctx) => {
    return res(ctx.json(teams));
  }),
  rest.get(API_URL + 'teams/:id/', (req, res, ctx) => {
    return res(ctx.json(team));
  }),
  rest.post(API_URL + 'teams', (req, res, ctx) => {
    return res(ctx.json(teamCreationSuccess));
  }),
  rest.patch(API_URL + 'teams/:id/', (req, res, ctx) => {
    return res(ctx.json(teamUpdationSuccess));
  }),
  rest.delete(API_URL + 'teams/:id', (req, res, ctx) => {
    return res(ctx.json(teamDeletionSuccess));
  }),
  // LICENSES
  rest.get(API_URL + 'licenses', (req, res, ctx) => {
    return res(ctx.json(licenses));
  }),
  rest.get(API_URL + 'licenses/:id/', (req, res, ctx) => {
    return res(ctx.json(license));
  }),
  rest.patch(API_URL + 'licenses/:id', (req, res, ctx) => {
    return res(ctx.json(req.body));
  }),
  rest.delete(API_URL + 'licenses/:id', (req, res, ctx) => {
    return res(ctx.json(licenseDeletionSuccess));
  }),
  rest.post(API_URL + 'licenses', (req, res, ctx) => {
    return res(ctx.json(licenseCreationSuccess));
  }),
  rest.post(API_URL + 'licenses/:id/actions/accept-for-me/', (req, res, ctx) => {
    return res(ctx.json(licenseAccepted));
  }),
  // CAMPAIGNS
  rest.get(API_URL + 'campaigns', (req, res, ctx) => {
    return res(ctx.json(campaigns));
  }),
  rest.post(API_URL + 'campaigns', (req, res, ctx) => {
    return res(ctx.json(campaignCreationSuccess));
  }),
  rest.get(API_URL + 'campaigns/:id', (req, res, ctx) => {
    return res(ctx.json(campaign));
  }),
  rest.patch(API_URL + 'campaigns/:id', (req, res, ctx) => {
    return res(ctx.json(campaignUpdationSuccess));
  }),
  rest.delete(API_URL + 'campaigns/:id', (req, res, ctx) => {
    return res(ctx.json(campaignDeletionSuccess));
  }),
  // INTERESTS
  rest.get(API_URL + 'interests', (req, res, ctx) => {
    return res(ctx.json(interests));
  }),
  rest.get(API_URL + 'interests/:id/', (req, res, ctx) => {
    return res(ctx.json(interest));
  }),
  rest.patch(API_URL + 'interests/:id', (req, res, ctx) => {
    return res(interestUpdationSuccess(req.body.name));
  }),
  rest.delete(API_URL + 'interests/:id', (req, res, ctx) => {
    return res(ctx.json(interestDeletionSuccess));
  }),
  rest.post(API_URL + 'interests', (req, res, ctx) => {
    return res(ctx.json(interestCreationSuccess(req.body.name)));
  }),
  rest.get(API_URL + 'countries', (req, res, ctx) => {
    return res(ctx.json(countries));
  }),
  rest.get(API_URL + 'system/banner/', (req, res, ctx) => {
    return res(ctx.json(banner));
  }),
  //TASKS
  rest.post(
    API_URL + 'projects/:projectId/tasks/actions/lock-for-mapping/:taskId',
    (req, res, ctx) => {
      return res(ctx.json(lockForMapping));
    },
  ),
  rest.post(API_URL + 'projects/:projectId/tasks/actions/lock-for-validation/', (req, res, ctx) => {
    return res(ctx.json(lockForValidation));
  }),
  rest.post(
    API_URL + 'projects/:projectId/tasks/actions/unlock-after-mapping/:taskId',
    (req, res, ctx) => {
      return res(ctx.json(submitMappingTask));
    },
  ),
  rest.post(
    API_URL + 'projects/:projectId/tasks/actions/unlock-after-validation/',
    (req, res, ctx) => {
      return res(ctx.json(submitValidationTask));
    },
  ),
  rest.get(API_URL + 'users/queries/tasks/locked/', (req, res, ctx) => {
    return res(ctx.json(userLockedTasks));
  }),
  rest.post(API_URL + 'projects/:projectId/tasks/actions/split/:taskId/', (req, res, ctx) => {
    return res(ctx.json(splitTask));
  }),
  rest.post(API_URL + 'projects/:projectId/tasks/actions/extend/', (req, res, ctx) => {
    return res(ctx.json(extendTask));
  }),
  rest.get(API_URL + 'system/statistics/', (req, res, ctx) => {
    return res(ctx.json(systemStats));
  }),
  // EXTERNAL API
  rest.get(`${OHSOME_STATS_BASE_URL}/stats/hotosm-project-%2A`, (req, res, ctx) => {
    return res(ctx.json(homepageStats));
  }),
  rest.get(`${OHSOME_STATS_BASE_URL}/hot-tm-user`, (req, res, ctx) => {
    return res(ctx.json(ohsomeNowUserStats));
  }),
  rest.get(`${OHSOME_STATS_BASE_URL}/stats/:projectId`, (req, res, ctx) => {
    return res(ctx.json(osmStatsProject));
  }),
  rest.get(`${OHSOME_STATS_BASE_URL}/metadata`, (req, res, ctx) => {
    return res(ctx.json(ohsomeNowMetadata));
  }),
  rest.get('http://127.0.0.1:8111/version', (req, res, ctx) => {
    return res(ctx.json(josmRemote));
  }),
];

const failedToConnectError = (req, res, ctx) => {
  return res.networkError('Failed to connect');
};

const faultyHandlers = [
  rest.get(API_URL + 'projects/:id/', async (req, res, ctx) => {
    return res.once(
      ctx.status(403),
      ctx.json({
        SubCode: `PrivateProject`,
      }),
    );
  }),
  rest.get(API_URL + 'projects/:id/', async (req, res, ctx) => {
    return res.once(
      ctx.status(403),
      ctx.json({
        SubCode: `Project Not Found`,
      }),
    );
  }),
  rest.get('http://127.0.0.1:8111/version', failedToConnectError),
  rest.post(
    API_URL + 'projects/:projectId/tasks/actions/lock-for-mapping/:taskId',
    failedToConnectError,
  ),
  rest.post(
    API_URL + 'projects/:projectId/tasks/actions/lock-for-validation',
    failedToConnectError,
  ),
  rest.post(API_URL + 'projects/:projectId/tasks/actions/extend/', failedToConnectError),
  rest.post(API_URL + 'projects/:projectId/tasks/actions/split/:taskId/', failedToConnectError),
  rest.get(API_URL + 'projects/queries/:projectId/similar-projects/', failedToConnectError),
  rest.post(API_URL + 'licenses', failedToConnectError),
  rest.patch(API_URL + 'licenses/:id', failedToConnectError),
  rest.post(API_URL + 'interests', failedToConnectError),
  rest.post(API_URL + 'campaigns', failedToConnectError),
  rest.patch(API_URL + 'campaigns/:id', failedToConnectError),
  rest.delete(API_URL + 'campaigns/:id', failedToConnectError),
  rest.post(API_URL + 'teams', failedToConnectError),
  rest.patch(API_URL + 'teams/:id/', failedToConnectError),
  rest.delete(API_URL + 'teams/:id', failedToConnectError),
  rest.post(API_URL + 'organisations', failedToConnectError),
  rest.delete(API_URL + 'notifications/delete-multiple/', failedToConnectError),
  rest.delete(API_URL + 'notifications/delete-all/', failedToConnectError),
  rest.delete(API_URL + 'notifications/delete-all/:types', failedToConnectError),
  rest.post(API_URL + 'notifications/mark-as-read-all/', failedToConnectError),
  rest.post(API_URL + 'notifications/mark-as-read-all/:types', failedToConnectError),
  rest.post(API_URL + 'notifications/mark-as-read-multiple/', failedToConnectError),
  rest.get(API_URL + 'notifications/:id/', failedToConnectError),
  rest.delete(API_URL + 'notifications/:id/', failedToConnectError),
  rest.patch(API_URL + 'users/:username/actions/set-level/:level', failedToConnectError),
  rest.patch(API_URL + 'users/:username/actions/set-role/:role', failedToConnectError),
];

export { handlers, faultyHandlers };
