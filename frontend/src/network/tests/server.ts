import { setupServer } from 'msw/node';
import { handlers } from './server-handlers';

// Setup requests interception using the given handlers.
export const server = setupServer(...handlers);
beforeAll(() => {
  server.use(...handlers);
  server.listen({ onUnhandledRequest: 'warn' })
})

//  Close server after all tests
afterAll(() => server.close())

// Reset handlers after each test `important for test isolation`
afterEach(() => server.resetHandlers())

export const setupHandlers = () => {
  server.use(...handlers);
};

export const setupFaultyHandlers = () => {
  server.resetHandlers();
  server.use(...faultyHandlers);
};
