import { setupServer } from 'msw/node';

import { faultyHandlers, handlers } from './server-handlers';
import { API_URL } from '../../config';

// Setup requests interception using the given handlers.
export const server = setupServer(...handlers);
console.log(import.meta.env.VITE_API_URL, API_URL.toString(), "MEOW")
beforeAll(() => {
  server.use(...handlers);
  server.listen({ onUnhandledRequest: 'warn' })
})

//  Close server after all tests
afterAll(() => server.close())

// Reset handlers after each test `important for test isolation`
afterEach(() => server.resetHandlers())

// export const setupHandlers = () => {
//   server.use(...handlers);
// };

export const setupFaultyHandlers = () => {
  server.resetHandlers();
  server.use(...faultyHandlers);
};
