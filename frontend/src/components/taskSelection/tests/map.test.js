import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ReduxIntlProviders } from '../../../utils/testWithIntl';
import maplibregl from 'maplibre-gl';

import { TasksMap } from '../map';
import isWebglSupported from '../../../utils/isWebglSupported';

jest.mock('../../../utils/isWebglSupported');

// setupTests.js already mocks the module `maplibre-gl` resolves to, and imports it
// before this file runs, so its instance is cached. Augment that shared object with
// the extra surface map.js needs rather than re-registering a competing mock. The
// assignments have to run per-test because CRA's jest preset sets `resetMocks: true`,
// which strips the implementations between tests.
const createMapMock = () => {
  const map = {
    addControl: jest.fn(() => map),
    on: jest.fn(),
    off: jest.fn(),
    once: jest.fn(),
    remove: jest.fn(),
    addLayer: jest.fn(),
    addSource: jest.fn(),
    getLayer: jest.fn(),
    getSource: jest.fn(),
    setFilter: jest.fn(),
    setPaintProperty: jest.fn(),
    setLayoutProperty: jest.fn(),
    isStyleLoaded: jest.fn(() => false),
    getCanvas: jest.fn(() => ({ style: {} })),
    fitBounds: jest.fn(),
    scrollZoom: { enable: jest.fn(), disable: jest.fn() },
  };
  return map;
};

beforeEach(() => {
  maplibregl.Map = jest.fn(() => createMapMock());
  maplibregl.AttributionControl = jest.fn();
  maplibregl.NavigationControl = jest.fn();
  maplibregl.setRTLTextPlugin = jest.fn();
  maplibregl.Popup = jest.fn(() => ({
    trackPointer: jest.fn().mockReturnThis(),
    setHTML: jest.fn().mockReturnThis(),
    addTo: jest.fn().mockReturnThis(),
    remove: jest.fn(),
    isOpen: jest.fn(() => false),
  }));
});

const renderMap = (props = {}) =>
  render(
    <ReduxIntlProviders>
      <TasksMap mapResults={null} onToggleChoropleth={jest.fn()} {...props} />
    </ReduxIntlProviders>,
  );

describe('TasksMap', () => {
  it('displays WebGL not supported message', () => {
    isWebglSupported.mockReturnValue(false);
    render(
      <ReduxIntlProviders>
        <TasksMap state={{ mapResults: null }} />
      </ReduxIntlProviders>,
    );
    expect(
      screen.getByRole('heading', {
        name: 'WebGL Context Not Found',
      }),
    ).toBeInTheDocument();
  });
});

describe('TasksMap invalidation choropleth toggle', () => {
  beforeEach(() => {
    isWebglSupported.mockReturnValue(true);
  });

  it('is not rendered when no toggle handler is supplied', () => {
    renderMap({ onToggleChoropleth: undefined });
    expect(screen.queryByTitle('Show invalidation heatmap')).not.toBeInTheDocument();
  });

  it('offers to show the heatmap while it is hidden', () => {
    renderMap({ showChoropleth: false });
    const toggle = screen.getByTitle('Show invalidation heatmap');
    expect(toggle).toHaveAttribute('aria-busy', 'false');
  });

  it('offers to hide the heatmap while it is shown', () => {
    renderMap({ showChoropleth: true });
    expect(screen.getByTitle('Hide invalidation heatmap')).toBeInTheDocument();
    expect(screen.queryByTitle('Show invalidation heatmap')).not.toBeInTheDocument();
  });

  it('reports the loading state while the counts are being fetched', () => {
    renderMap({ showChoropleth: true, isChoroplethLoading: true });
    const toggle = screen.getByTitle('Loading invalidation data...');
    expect(toggle).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByTitle('Hide invalidation heatmap')).not.toBeInTheDocument();
  });

  it('calls the toggle handler when clicked', async () => {
    const user = userEvent.setup();
    const onToggleChoropleth = jest.fn();
    renderMap({ onToggleChoropleth });
    await user.click(screen.getByTitle('Show invalidation heatmap'));
    expect(onToggleChoropleth).toHaveBeenCalledTimes(1);
  });
});
