import { rest } from 'msw';

import { getProjectSummary, getProjectStats, projects } from './mockData/projects';
import { featuredProjects } from './mockData/featuredProjects';
import { newUsersStats } from './mockData/userStats';
import { projectContributions, projectContributionsByDay } from './mockData/contributions';
import { usersList } from './mockData/userList';
import {
  license,
  licenseCreationSuccess,
  licenseDeletionSuccess,
  campaigns,
  campaignCreationSuccess,
  campaign,
  campaignUpdationSuccess,
  campaignDeletionSuccess,
  licenses,
} from './mockData/management';
import { countries } from './mockData/miscellaneous';
import tasksGeojson from '../../utils/tests/snippets/tasksGeometry';
import { API_URL } from '../../config';

const handlers = [
  rest.get(API_URL + 'projects/:id/queries/summary/', async (req, res, ctx) => {
    const { id } = req.params;
    return res(ctx.json(getProjectSummary(id)));
  }),
  rest.get(API_URL + 'projects/', async (req, res, ctx) => {
    return res(ctx.json(projects));
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
  rest.get(API_URL + 'users/statistics/', async (req, res, ctx) => {
    return res(ctx.json(newUsersStats));
  }),
  rest.get(API_URL + 'users', async (req, res, ctx) => {
    return res(ctx.json(usersList));
  }),
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
  rest.get(API_URL + 'countries', (req, res, ctx) => {
    return res(ctx.json(countries));
  }),
];

export { handlers };
