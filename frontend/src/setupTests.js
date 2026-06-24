import 'jest-canvas-mock';
import { configure } from '@testing-library/react';
import maplibregl from 'maplibre-gl';
import { server } from './network/tests/server.js';

// Used from https://github.com/mapbox/mapbox-gl-js/issues/3436#issuecomment-485535598
jest.mock('maplibre-gl/dist/maplibre-gl', () => ({
  GeolocateControl: class {},
  Map: class {
    addControl() { return this; }
    addSource() {}
    getSource() { return { setData: jest.fn() }; }
    on() { return this; }
    off() {}
    remove() {}
  },
  NavigationControl: class {},
  AttributionControl: class {},
  supported: jest.fn(),
  getRTLTextPluginStatus: jest.fn(),
}));

jest.mock('maplibre-gl', () => ({
  GeolocateControl: class {},
  Map: class {
    addControl() { return this; }
    addSource() {}
    getSource() { return { setData: jest.fn() }; }
    on() { return this; }
    off() {}
    remove() {}
  },
  NavigationControl: class {},
  AttributionControl: class {},
  supported: jest.fn(),
  getRTLTextPluginStatus: jest.fn(),
}));

jest.spyOn(maplibregl, 'getRTLTextPluginStatus').mockImplementation(() => 'unavailable');

// Fix various timeout errors
configure({ asyncUtilTimeout: 4000 });

// eslint-disable-next-line flowtype/require-valid-file-annotation
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
