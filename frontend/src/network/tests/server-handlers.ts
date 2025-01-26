import { PathParams, http, HttpResponse } from 'msw';

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
import { tasksStats, userTasks } from './mockData/tasksStats';
import { homepageStats } from './mockData/homepageStats';
import {
  banner,
  countries,
  josmRemote,
  systemStats,
  ohsomeNowMetadata,
} from './mockData/miscellaneous';
import tasksGeojson from '../../utils/tests/snippets/tasksGeometry';
import { API_URL, OHSOME_STATS_BASE_URL, defaultChangesetComment } from '../../config';
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
  http.get(API_URL + 'projects/:id/queries/summary/', async (info) => {
    return HttpResponse.json(getProjectSummary(Number(info.params.id)));
  }),
  http.get(API_URL + 'projects/:id/activities/latest/', async (info) => {
    return HttpResponse.json(activities(Number(info.params.id)));
  }),
  http.get(API_URL + 'projects/:id/queries/priority-areas/', async () => {
    return HttpResponse.json([]);
  }),
  http.get(API_URL + 'projects/', async () => {
    return HttpResponse.json(projects);
  }),
  http.get(API_URL + 'projects/', async () => {
    return HttpResponse.json(projects);
  }),
  http.get(API_URL + 'projects/:id/contributions/', async () => {
    return HttpResponse.json(projectContributions);
  }),
  http.get(API_URL + 'projects/:id/', async () => {
    return HttpResponse.json(projectDetail);
  }),
  http.get(API_URL + 'projects/:id/comments/', async () => {
    return HttpResponse.json(projectComments);
  }),
  http.post(API_URL + 'projects/:id/comments/', async () => {
    return HttpResponse.json({ message: 'Comment posted' });
  }),
  http.delete(API_URL + 'projects/:projectId/comments/:commentId/', async () => {
    return HttpResponse.json({ message: 'Message deleted' });
  }),
  http.get(API_URL + 'projects/:id/favorite/', async () => {
    return HttpResponse.json(userFavorite);
  }),
  http.post(API_URL + 'projects/:id/favorite/', async () => {
    // return HttpResponse.json(favoritePost(req.params.id)));
    return HttpResponse.json(favoritePost());
  }),
  http.get(API_URL + 'projects/:id/statistics/', async (info) => {
    const { id } = info.params;
    // @ts-expect-error TS Migrations
    return HttpResponse.json(getProjectStats(id));
  }),
  http.get(API_URL + 'projects/:id/contributions/queries/day/', async () => {
    return HttpResponse.json(projectContributionsByDay);
  }),
  http.get(API_URL + 'projects/:id/tasks', async () => {
    return HttpResponse.json(tasksGeojson);
  }),
  http.get(API_URL + 'projects/queries/featured/', async () => {
    return HttpResponse.json(featuredProjects);
  }),
  http.get(API_URL + 'projects/queries/:username/touched', async () => {
    return HttpResponse.json(userTouchedProjects);
  }),
  http.get(API_URL + 'projects/:projectId/tasks/:taskId/', async (info) => {
    return HttpResponse.json(taskDetail(Number(info.params.taskId)));
  }),
  http.post(API_URL + 'projects/:projectId/tasks/actions/stop-mapping/:taskId/', async () => {
    return HttpResponse.json(stopMapping);
  }),
  http.post(API_URL + 'projects/:projectId/tasks/actions/stop-validation/', async () => {
    return HttpResponse.json(stopValidation);
  }),
  http.get(API_URL + 'projects/queries/:projectId/similar-projects/', async () => {
    return HttpResponse.json(similarProjects);
  }),
  // AUTHENTICATION
  http.get(API_URL + 'system/authentication/login/', async () => {
    return HttpResponse.json(authLogin);
  }),
  http.post(API_URL + 'users/actions/register/', async () => {
    return HttpResponse.json(userRegister);
  }),
  http.patch(API_URL + 'users/me/actions/set-user/', async () => {
    return HttpResponse.json(setUser);
  }),
  // NOTIFICATIONS
  http.get(API_URL + 'notifications', async () => {
    return HttpResponse.json(notifications);
  }),
  http.get(API_URL + 'notifications/:id', async () => {
    return HttpResponse.json(notifications.userMessages[0]);
  }),
  http.get(API_URL + 'notifications/queries/own/count-unread/', async () => {
    return HttpResponse.json(ownCountUnread);
  }),
  http.delete(API_URL + 'notifications/:id/', async () => {
    return HttpResponse.json({ Success: 'Message deleted' });
  }),
  http.delete(API_URL + 'notifications/delete-all/', async () => {
    return HttpResponse.json({ Success: 'Message deleted' });
  }),
  http.delete(API_URL + 'notifications/delete-all/:types', async () => {
    return HttpResponse.json({ Success: 'Message deleted' });
  }),
  http.delete(API_URL + 'notifications/delete-multiple/', async () => {
    return HttpResponse.json({ Success: 'Message deleted' });
  }),
  http.post(API_URL + 'notifications/queries/own/post-unread/', async () => {
    return HttpResponse.json(null);
  }),
  http.post(API_URL + 'notifications/mark-as-read-all/', async () => {
    return HttpResponse.json(null);
  }),
  http.post(API_URL + 'notifications/mark-as-read-all/:types', async () => {
    return HttpResponse.json(null);
  }),
  http.post(API_URL + 'notifications/mark-as-read-multiple/', async () => {
    return HttpResponse.json(null);
  }),
  // USER
  http.get(API_URL + 'users/statistics/', async () => {
    return HttpResponse.json(newUsersStats);
  }),
  http.get(API_URL + 'tasks/statistics/', async () => {
    return HttpResponse.json(tasksStats);
  }),
  http.get(API_URL + 'users/queries/:username', async () => {
    return HttpResponse.json(userQueryDetails);
  }),
  http.get(API_URL + 'users', async () => {
    return HttpResponse.json(usersList);
  }),
  http.patch(API_URL + 'users/:username/actions/set-level/:level', () => {
    return HttpResponse.json(levelUpdationSuccess);
  }),
  http.patch(API_URL + 'users/:username/actions/set-role/:role', () => {
    return HttpResponse.json(roleUpdationSuccess);
  }),
  http.get(API_URL + 'users/:userId/tasks/', async () => {
    return HttpResponse.json(userTasks);
  }),
  http.get(API_URL + 'users/:username/statistics/', async () => {
    return HttpResponse.json(userStats);
  }),
  http.get(API_URL + 'users/queries/tasks/locked/details/', async () => {
    return HttpResponse.json(userLockedTasksDetails);
  }),
  // ORGANIZATIONS
  http.get(API_URL + 'organisations', () => {
    return HttpResponse.json(organisations);
  }),
  http.get(API_URL + 'organisations/:id/', () => {
    return HttpResponse.json(organisation);
  }),
  http.post(API_URL + 'organisations', () => {
    return HttpResponse.json(organisationCreationSuccess);
  }),
  http.patch(API_URL + 'organisations/:id/', () => {
    return HttpResponse.json(organisationUpdationSuccess);
  }),
  http.delete(API_URL + 'organisations/:id', () => {
    return HttpResponse.json(organisationDeletionSuccess);
  }),
  // TEAMS
  http.get(API_URL + 'teams', () => {
    return HttpResponse.json(teams);
  }),
  http.get(API_URL + 'teams/:id/', () => {
    return HttpResponse.json(team);
  }),
  http.post(API_URL + 'teams', () => {
    return HttpResponse.json(teamCreationSuccess);
  }),
  http.patch(API_URL + 'teams/:id/', () => {
    return HttpResponse.json(teamUpdationSuccess);
  }),
  http.delete(API_URL + 'teams/:id', () => {
    return HttpResponse.json(teamDeletionSuccess);
  }),
  // LICENSES
  http.get(API_URL + 'licenses', () => {
    return HttpResponse.json(licenses);
  }),
  http.get(API_URL + 'licenses/:id/', () => {
    return HttpResponse.json(license);
  }),
  http.patch(API_URL + 'licenses/:id', (info) => {
    return HttpResponse.json(info.request.text());
  }),
  http.delete(API_URL + 'licenses/:id', () => {
    return HttpResponse.json(licenseDeletionSuccess);
  }),
  http.post(API_URL + 'licenses', () => {
    return HttpResponse.json(licenseCreationSuccess);
  }),
  http.post(API_URL + 'licenses/:id/actions/accept-for-me/', () => {
    return HttpResponse.json(licenseAccepted);
  }),
  // CAMPAIGNS
  http.get(API_URL + 'campaigns', () => {
    return HttpResponse.json(campaigns);
  }),
  http.post(API_URL + 'campaigns', () => {
    return HttpResponse.json(campaignCreationSuccess);
  }),
  http.get(API_URL + 'campaigns/:id', () => {
    return HttpResponse.json(campaign);
  }),
  http.patch(API_URL + 'campaigns/:id', () => {
    return HttpResponse.json(campaignUpdationSuccess);
  }),
  http.delete(API_URL + 'campaigns/:id', () => {
    return HttpResponse.json(campaignDeletionSuccess);
  }),
  // INTERESTS
  http.get(API_URL + 'interests', () => {
    return HttpResponse.json(interests);
  }),
  http.get(API_URL + 'interests/:id/', () => {
    return HttpResponse.json(interest);
  }),
  http.patch<
    PathParams,
    {
      name: string;
    }
  >(API_URL + 'interests/:id', async (info) => {
    const body = await info.request.json();
    return HttpResponse.json(interestUpdationSuccess(body.name));
  }),
  http.delete(API_URL + 'interests/:id', () => {
    return HttpResponse.json(interestDeletionSuccess);
  }),
  http.post<
    PathParams,
    {
      name: string;
    }
  >(API_URL + 'interests', async (info) => {
    const body = await info.request.json();
    return HttpResponse.json(interestCreationSuccess(body.name));
  }),
  http.get(API_URL + 'countries', () => {
    return HttpResponse.json(countries);
  }),
  http.get(API_URL + 'system/banner/', () => {
    return HttpResponse.json(banner);
  }),
  //TASKS
  http.post(API_URL + 'projects/:projectId/tasks/actions/lock-for-mapping/:taskId', () => {
    return HttpResponse.json(lockForMapping);
  }),
  http.post(API_URL + 'projects/:projectId/tasks/actions/lock-for-validation/', () => {
    return HttpResponse.json(lockForValidation);
  }),
  http.post(API_URL + 'projects/:projectId/tasks/actions/unlock-after-mapping/:taskId', () => {
    return HttpResponse.json(submitMappingTask);
  }),
  http.post(API_URL + 'projects/:projectId/tasks/actions/unlock-after-validation/', () => {
    return HttpResponse.json(submitValidationTask);
  }),
  http.get(API_URL + 'users/queries/tasks/locked/', () => {
    return HttpResponse.json(userLockedTasks);
  }),
  http.post(API_URL + 'projects/:projectId/tasks/actions/split/:taskId/', () => {
    return HttpResponse.json(splitTask);
  }),
  http.post(API_URL + 'projects/:projectId/tasks/actions/extend/', () => {
    return HttpResponse.json(extendTask);
  }),
  http.get(API_URL + 'system/statistics/', () => {
    return HttpResponse.json(systemStats);
  }),
  // EXTERNAL API
  http.get(`${OHSOME_STATS_BASE_URL}/stats/${defaultChangesetComment}-%2A`, () => {
    return HttpResponse.json(homepageStats);
  }),
  http.get(`${OHSOME_STATS_BASE_URL}/hot-tm-user`, () => {
    return HttpResponse.json(ohsomeNowUserStats);
  }),
  http.get(`${OHSOME_STATS_BASE_URL}/stats/:projectId`, () => {
    return HttpResponse.json(osmStatsProject);
  }),
  http.get(`${OHSOME_STATS_BASE_URL}/metadata`, () => {
    return HttpResponse.json(ohsomeNowMetadata);
  }),
  http.get('http://127.0.0.1:8111/version', () => {
    return HttpResponse.json(josmRemote);
  }),
  http.get('http://127.0.0.1:8111/load_data', () => {
    return new HttpResponse('OK');
  }),
  http.get('http://127.0.0.1:8111/load_and_zoom', () => {
    return new HttpResponse('OK');
  }),
  http.get('http://127.0.0.1:8111/import', () => {
    return new HttpResponse('OK');
  }),
];

const failedToConnectError = () => {
  return HttpResponse.error();
};

const faultyHandlers = [
  http.get(
    API_URL + 'projects/:id/',
    async () => {
      return Response.json(
        {
          SubCode: `PrivateProject`,
        },
        {
          status: 403,
        },
      );
    },
    {
      once: true,
    },
  ),
  http.get(
    API_URL + 'projects/:id/',
    async () => {
      return Response.json(
        {
          SubCode: `Project Not Found`,
        },
        {
          status: 403,
        },
      );
    },
    {
      once: true,
    },
  ),
  http.get('http://127.0.0.1:8111/version', failedToConnectError),
  http.post(
    API_URL + 'projects/:projectId/tasks/actions/lock-for-mapping/:taskId',
    failedToConnectError,
  ),
  http.post(
    API_URL + 'projects/:projectId/tasks/actions/lock-for-validation',
    failedToConnectError,
  ),
  http.post(API_URL + 'projects/:projectId/tasks/actions/extend/', failedToConnectError),
  http.post(API_URL + 'projects/:projectId/tasks/actions/split/:taskId/', failedToConnectError),
  http.get(API_URL + 'projects/queries/:projectId/similar-projects/', failedToConnectError),
  http.post(API_URL + 'licenses', failedToConnectError),
  http.patch(API_URL + 'licenses/:id', failedToConnectError),
  http.post(API_URL + 'interests', failedToConnectError),
  http.post(API_URL + 'campaigns', failedToConnectError),
  http.patch(API_URL + 'campaigns/:id', failedToConnectError),
  http.delete(API_URL + 'campaigns/:id', failedToConnectError),
  http.post(API_URL + 'teams', failedToConnectError),
  http.patch(API_URL + 'teams/:id/', failedToConnectError),
  http.delete(API_URL + 'teams/:id', failedToConnectError),
  http.post(API_URL + 'organisations', failedToConnectError),
  http.delete(API_URL + 'notifications/delete-multiple/', failedToConnectError),
  http.delete(API_URL + 'notifications/delete-all/', failedToConnectError),
  http.delete(API_URL + 'notifications/delete-all/:types', failedToConnectError),
  http.post(API_URL + 'notifications/mark-as-read-all/', failedToConnectError),
  http.post(API_URL + 'notifications/mark-as-read-all/:types', failedToConnectError),
  http.post(API_URL + 'notifications/mark-as-read-multiple/', failedToConnectError),
  http.get(API_URL + 'notifications/:id/', failedToConnectError),
  http.delete(API_URL + 'notifications/:id/', failedToConnectError),
  http.patch(API_URL + 'users/:username/actions/set-level/:level', failedToConnectError),
  http.patch(API_URL + 'users/:username/actions/set-role/:role', failedToConnectError),
];

export { handlers, faultyHandlers };
