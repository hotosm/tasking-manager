import { rest } from 'msw';

import { getProjectSummary } from './mockData/projects';
import { projectContributions, projectContributionsByDay } from './mockData/contributions';
import tasksGeojson from '../../utils/tests/snippets/tasksGeometry';
import { API_URL } from '../../config';

const handlers = [
  rest.get(API_URL + 'projects/:id/queries/summary/', async (req, res, ctx) => {
    const { id } = req.params;
    return res(ctx.json(getProjectSummary(id)));
  }),
  rest.get(API_URL + 'projects/:id/contributions/', async (req, res, ctx) => {
    return res(ctx.json(projectContributions));
  }),
  rest.get(API_URL + 'projects/:id/contributions/queries/day/', async (req, res, ctx) => {
    return res(ctx.json(projectContributionsByDay));
  }),
  rest.get(API_URL + 'projects/:id/tasks', async (req, res, ctx) => {
    return res(ctx.json(tasksGeojson));
  }),
];

export { handlers };
