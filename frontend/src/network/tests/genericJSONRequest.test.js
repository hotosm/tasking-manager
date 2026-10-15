import { rest } from 'msw';

import { API_URL } from '../../config';
import { server } from './server';
import {
  fetchLocalJSONAPI,
  fetchLocalJSONAPIWithAbort,
  pushToLocalJSONAPI,
} from '../genericJSONRequest';

// Passing a URL object to fetch made MSW see the request as http://localhost/undefined.
describe('local JSON API helpers', () => {
  let unhandledUrls;
  const onUnhandled = (req) => unhandledUrls.push(req.url.href);

  beforeEach(() => {
    unhandledUrls = [];
    server.events.on('request:unhandled', onUnhandled);
    server.use(
      rest.get(API_URL + 'echo/', (req, res, ctx) => res(ctx.json({ method: 'GET' }))),
      rest.post(API_URL + 'echo/', (req, res, ctx) => res(ctx.json({ method: 'POST' }))),
    );
  });

  afterEach(() => {
    server.events.removeListener('request:unhandled', onUnhandled);
  });

  it('fetchLocalJSONAPI requests the endpoint URL', async () => {
    await expect(fetchLocalJSONAPI('echo/')).resolves.toEqual({ method: 'GET' });
    expect(unhandledUrls).toEqual([]);
  });

  it('fetchLocalJSONAPIWithAbort requests the endpoint URL', async () => {
    const controller = new AbortController();
    await expect(fetchLocalJSONAPIWithAbort('echo/', null, controller.signal)).resolves.toEqual({
      method: 'GET',
    });
    expect(unhandledUrls).toEqual([]);
  });

  it('pushToLocalJSONAPI requests the endpoint URL', async () => {
    await expect(pushToLocalJSONAPI('echo/', '{}', 'token')).resolves.toEqual({ method: 'POST' });
    expect(unhandledUrls).toEqual([]);
  });
});
