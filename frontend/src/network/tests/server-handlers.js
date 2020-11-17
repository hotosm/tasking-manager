import { rest } from 'msw';

import { getProjectSummary, getProjectStats } from './mockData/projects';
import { featuredProjects } from './mockData/featuredProjects';
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
  rest.delete(API_URL + 'notifications/delete-multiple/', async (req, res, ctx) => {
    return res(ctx.json({ Success: 'Message deleted' }));
  }),
];

export { handlers };
