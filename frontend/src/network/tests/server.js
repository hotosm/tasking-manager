import { setupServer } from 'msw/node';

import { faultyHandlers, handlers } from './server-handlers';

// Setup requests interception using the given handlers.
export const server = setupServer(...handlers);

export const setupHandlers = () => {
  server.use(...handlers);
};

export const setupFaultyHandlers = () => {
  server.use(...faultyHandlers);
};
