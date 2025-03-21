import 'jest-canvas-mock';
import { configure } from '@testing-library/react';
import { server } from './network/tests/server.js';

// Used from https://github.com/mapbox/mapbox-gl-js/issues/3436#issuecomment-485535598
jest.mock('mapbox-gl/dist/mapbox-gl', () => ({
  GeolocateControl: jest.fn(),
  Map: jest.fn(() => ({
    addControl: jest.fn(),
    on: jest.fn(),
    remove: jest.fn(),
  })),
  NavigationControl: jest.fn(),
  supported: jest.fn(),
}));

// Fix various timeout errors
configure({ asyncUtilTimeout: 4000 });

// Needed for react-tooltip dependency (@floating-ui/dom). See https://github.com/floating-ui/floating-ui/issues/1774 .
// This can be removed after https://github.com/jsdom/jsdom/issues/3368 is fixed.
beforeEach(() => {
  window.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
});

// Fix various timeout errors
configure({ asyncUtilTimeout: 4000 });

beforeAll(() => server.listen());
// if you need to add a handler after calling setupServer for some specific test
// this will remove that handler for the rest of them
// (which is important for test isolation):
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
