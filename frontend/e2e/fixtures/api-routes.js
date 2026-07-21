const {
  projects,
  getProjectSummary,
  projectDetail,
  activities,
  projectComments,
  userFavorite,
} = require('../../src/network/tests/mockData/projects');
const { userQueryDetails, userLevels } = require('../../src/network/tests/mockData/userList');
const {
  userLockedTasks,
  lockForMapping,
  lockForValidation,
} = require('../../src/network/tests/mockData/taskHistory');
const { userLockedTasksDetails } = require('../../src/network/tests/mockData/userStats');
const { organisations, organisation } = require('../../src/network/tests/mockData/management');
const { teams } = require('../../src/network/tests/mockData/teams');
const { systemLanguages } = require('../../src/network/tests/mockData/header');
const { banner } = require('../../src/network/tests/mockData/miscellaneous');
const {
  projectContributions,
  projectContributionsByDay,
} = require('../../src/network/tests/mockData/contributions');
const tasksGeojson = require('../../src/utils/tests/snippets/tasksGeometry').default;

function parsePath(url) {
  const pathname = new URL(url).pathname;
  // Remove leading /api/v2/ if present
  return pathname.replace(/^\/api\/v2\//, '');
}

function json(body) {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  };
}

function createProjectResponse(requestBody) {
  return {
    projectId: 9999,
    projectName: requestBody.projectName || 'Test Project',
    status: 'DRAFT',
  };
}

async function mockCommonAPI(page, overrides = {}) {
  await page.route('**/api/v2/**', async (route) => {
    const request = route.request();
    const method = request.method();
    const url = request.url();
    const path = parsePath(url);

    // Auth / user
    if (path.match(/^users\/queries\/[^/]+\/$/)) {
      return route.fulfill(json(overrides.userDetails || userQueryDetails));
    }

    if (path.match(/^users\/[^/]+\/openstreetmap\/$/)) {
      return route.fulfill(
        json({
          id: 123456,
          username: 'test_mapper',
          changeset_count: 100,
          account_created: '2020-01-01T00:00:00Z',
        }),
      );
    }

    if (path === 'users/queries/tasks/locked/' && method === 'GET') {
      return route.fulfill(json(overrides.userLockedTasks || userLockedTasks));
    }

    if (path === 'users/queries/tasks/locked/details/' && method === 'GET') {
      return route.fulfill(json(overrides.userLockedTasksDetails || userLockedTasksDetails));
    }

    // Organisations / teams
    if (path.startsWith('organisations/') && method === 'GET') {
      if (path === 'organisations/') {
        return route.fulfill(json(overrides.organisations || organisations));
      }
      return route.fulfill(json(overrides.organisation || organisation));
    }

    if (path.startsWith('teams/') && method === 'GET') {
      return route.fulfill(json(overrides.teams || teams));
    }

    // Projects list
    if ((path === 'projects/' || path === 'projects') && method === 'GET') {
      return route.fulfill(json(overrides.projects || projects));
    }

    // Create project
    if ((path === 'projects/' || path === 'projects') && method === 'POST') {
      const body = JSON.parse(request.postData() || '{}');
      return route.fulfill(json(overrides.createProjectResponse || createProjectResponse(body)));
    }

    // Intersecting tiles
    if (path === 'projects/actions/intersecting-tiles/' && method === 'POST') {
      const body = JSON.parse(request.postData() || '{}');
      return route.fulfill(json(body.grid || tasksGeojson));
    }

    // Project detail / summary / activities / priority-areas / tasks
    const projectMatch = path.match(/^projects\/(\d+)\/$/);
    if (projectMatch && method === 'GET') {
      const id = Number(projectMatch[1]);
      return route.fulfill(json(overrides.projectDetail || { ...projectDetail, projectId: id }));
    }

    const summaryMatch = path.match(/^projects\/(\d+)\/queries\/summary\/$/);
    if (summaryMatch && method === 'GET') {
      const id = Number(summaryMatch[1]);
      return route.fulfill(json(overrides.projectSummary || getProjectSummary(id)));
    }

    const activitiesMatch = path.match(/^projects\/(\d+)\/activities\/latest\/$/);
    if (activitiesMatch && method === 'GET') {
      const id = Number(activitiesMatch[1]);
      return route.fulfill(json(overrides.activities || activities(id)));
    }

    const priorityAreasMatch = path.match(/^projects\/(\d+)\/queries\/priority-areas\/$/);
    if (priorityAreasMatch && method === 'GET') {
      return route.fulfill(json(overrides.priorityAreas || []));
    }

    const tasksMatch = path.match(/^projects\/(\d+)\/tasks\/?$/);
    if (tasksMatch && method === 'GET') {
      return route.fulfill(json(overrides.tasksGeojson || tasksGeojson));
    }

    const gpxMatch = path.match(/^projects\/(\d+)\/tasks\/queries\/gpx\/$/);
    if (gpxMatch && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/gpx+xml',
        body:
          overrides.taskGpx ||
          `<?xml version="1.0" encoding="UTF-8"?>
<gpx xmlns="http://www.topografix.com/GPX/1/1" version="1.1">
  <trk><trkseg><trkpt lat="0" lon="0"/></trkseg></trk>
</gpx>`,
      });
    }

    const commentsMatch = path.match(/^projects\/(\d+)\/comments\/$/);
    if (commentsMatch && method === 'GET') {
      return route.fulfill(json(overrides.projectComments || projectComments));
    }

    const contributionsMatch = path.match(/^projects\/(\d+)\/contributions\/$/);
    if (contributionsMatch && method === 'GET') {
      return route.fulfill(json(overrides.projectContributions || projectContributions));
    }

    const contributionsByDayMatch = path.match(/^projects\/(\d+)\/contributions\/queries\/day\/$/);
    if (contributionsByDayMatch && method === 'GET') {
      return route.fulfill(json(overrides.projectContributionsByDay || projectContributionsByDay));
    }

    const favoriteMatch = path.match(/^projects\/(\d+)\/favorite\/$/);
    if (favoriteMatch && method === 'GET') {
      return route.fulfill(json(overrides.userFavorite || userFavorite));
    }

    const similarProjectsMatch = path.match(/^projects\/queries\/(\d+)\/similar-projects\/$/);
    if (similarProjectsMatch && method === 'GET') {
      return route.fulfill(json(overrides.similarProjects || projects));
    }

    const taskDetailMatch = path.match(/^projects\/(\d+)\/tasks\/(\d+)\/$/);
    if (taskDetailMatch && method === 'GET') {
      return route.fulfill(json(overrides.taskDetail || {
        taskId: Number(taskDetailMatch[2]),
        projectId: Number(taskDetailMatch[1]),
        taskStatus: 'MAPPED',
        lockHolder: 'another_user',
        taskHistory: [],
      }));
    }

    // Lock for mapping
    const lockMappingMatch = path.match(/^projects\/(\d+)\/tasks\/actions\/lock-for-mapping\/(\d+)\/?$/);
    if (lockMappingMatch && method === 'POST') {
      return route.fulfill(json(overrides.lockForMapping || lockForMapping));
    }

    // Lock for validation
    const lockValidationMatch = path.match(/^projects\/(\d+)\/tasks\/actions\/lock-for-validation\/$/);
    if (lockValidationMatch && method === 'POST') {
      return route.fulfill(json(overrides.lockForValidation || lockForValidation));
    }

    // System languages
    if (path === 'system/languages/' && method === 'GET') {
      return route.fulfill(json(overrides.systemLanguages || systemLanguages));
    }

    // System banner
    if (path === 'system/banner/' && method === 'GET') {
      return route.fulfill(json(overrides.banner || banner));
    }

    // User levels
    if (path === 'levels/' && method === 'GET') {
      return route.fulfill(json(overrides.userLevels || userLevels));
    }

    // Notifications
    if (path === 'notifications/queries/own/count-unread/' && method === 'GET') {
      return route.fulfill(json(overrides.unreadNotificationsCount || { unread: 0, newMessages: false }));
    }

    if (path.startsWith('notifications/') && method === 'GET') {
      return route.fulfill(
        json(
          overrides.notifications || {
            pagination: { total: 0, page: 1, pages: 1, perPage: 10, hasNext: false, hasPrev: false },
            userMessages: [],
          },
        ),
      );
    }

    // Abort unmatched requests so failures are obvious during development.
    // Change to route.continue() once the suite is stable.
    return route.abort('failed');
  });
}

module.exports = { mockCommonAPI };
