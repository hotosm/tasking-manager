import React from 'react';
import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TasksMap } from '../map';
import { ReduxIntlProviders, renderWithRouter } from '../../../utils/testWithIntl';
import isWebglSupported from '../../../utils/isWebglSupported';
import maplibregl from 'maplibre-gl';


jest.mock('../../../utils/isWebglSupported', () => jest.fn());

jest.mock('@turf/bbox', () => jest.fn(() => [0, 0, 10, 10]));

const mockMap = {
  addControl: jest.fn(function() { return mockMap; }),
  addSource: jest.fn(),
  getSource: jest.fn(),
  on: jest.fn(),
  once: jest.fn(),
  off: jest.fn(),
  remove: jest.fn(),
  resize: jest.fn(),
  addImage: jest.fn(),
  addLayer: jest.fn(),
  fitBounds: jest.fn(),
  setFilter: jest.fn(),
  setLayoutProperty: jest.fn(),
  isStyleLoaded: jest.fn().mockReturnValue(true),
  scrollZoom: {
    disable: jest.fn(),
    enable: jest.fn(),
  },
  getCanvas: jest.fn().mockReturnValue({ style: { cursor: '' }, classList: { remove: jest.fn() } }),
  _canvasContainer: { classList: { remove: jest.fn() } },
};

jest.mock('maplibre-gl', () => ({
  Map: jest.fn(() => mockMap),
  NavigationControl: jest.fn(),
  AttributionControl: jest.fn(),
  Popup: jest.fn().mockImplementation(() => ({
    setHTML: jest.fn().mockReturnThis(),
    trackPointer: jest.fn().mockReturnThis(),
    addTo: jest.fn().mockReturnThis(),
    isOpen: jest.fn().mockReturnValue(true),
    remove: jest.fn(),
  })),
}));

describe('TasksMap Component', () => {
  const mapResults = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { taskId: 1, taskStatus: 'READY', lockedBy: 1, mappedBy: 2 },
        geometry: { type: 'Polygon', coordinates: [] }
      },
      {
        type: 'Feature',
        properties: { taskId: 2, taskStatus: 'MAPPED', lockedBy: 2, mappedBy: 1 },
        geometry: { type: 'Polygon', coordinates: [] }
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    isWebglSupported.mockReturnValue(true);
    mockMap.getSource.mockReturnValue(undefined);
  });

  const renderMap = (props = {}) => {
    return renderWithRouter(
      <ReduxIntlProviders initialState={{ auth: { userDetails: { id: 1, username: 'test_user' } } }}>
        <TasksMap mapResults={mapResults} {...props} />
      </ReduxIntlProviders>
    );
  };

  it('renders WebglUnsupported if WebGL is not supported', () => {
    isWebglSupported.mockReturnValue(false);
    renderMap();
    expect(screen.getByText(/WebGL is not supported/i)).toBeInTheDocument();
  });

  it('renders map container if WebGL is supported', () => {
    renderMap();
    const mapElement = document.getElementById('map');
    expect(mapElement).toBeInTheDocument();
    expect(maplibregl.Map).toHaveBeenCalled();
  });

  it('handles map load and layers setup', () => {
    renderMap({ 
      taskBordersMap: { type: 'FeatureCollection', features: [] }, 
      taskCentroidMap: { type: 'FeatureCollection', features: [] }, 
      priorityAreas: [ { type: 'Polygon', coordinates: [] } ],
      disableScrollZoom: true,
      showTaskIds: true
    });
    
    // Simulate once('load') call
    const loadHandler = mockMap.once.mock.calls.find(call => call[0] === 'load')?.[1];
    if (loadHandler) loadHandler();
    expect(mockMap.resize).toHaveBeenCalled();

    // Trigger maplibreLayerDefn implicitly since map is ready
    expect(mockMap.addLayer).toHaveBeenCalledWith(expect.objectContaining({ id: 'tasks-fill' }), 'tasks-icon');
  });

  it('handles map fitBounds to zoomedTaskId', () => {
    renderMap({ zoomedTaskId: [1] });
    expect(mockMap.fitBounds).toHaveBeenCalled();
  });

  it('handles map fitBounds without zoomedTaskId and taskBordersOnly', () => {
    renderMap({ taskBordersOnly: true, navigate: jest.fn() });
    expect(mockMap.fitBounds).toHaveBeenCalled();
  });

  it('simulates mousemove on tasks-fill layer', () => {
    renderMap({ showTaskIds: true });
    
    const mousemoveHandler = mockMap.on.mock.calls.find(call => call[0] === 'mousemove' && call[1] === 'tasks-fill')?.[2];
    expect(mousemoveHandler).toBeDefined();

    mousemoveHandler({ features: [{ properties: { mappedBy: 1, taskStatus: 'MAPPED', lockedBy: 1, taskId: 2 } }] });
    expect(mockMap.getCanvas().style.cursor).toBe('pointer');
  });

  it('simulates click on tasks-fill layer', () => {
    const selectTaskMock = jest.fn();
    renderMap({ selectTask: selectTaskMock });
    
    const clickHandler = mockMap.on.mock.calls.find(call => call[0] === 'click' && call[1] === 'tasks-fill')?.[2];
    expect(clickHandler).toBeDefined();

    clickHandler({ features: [{ properties: { taskId: 1, taskStatus: 'READY' } }] });
    expect(selectTaskMock).toHaveBeenCalledWith(1, 'READY');
  });

  it('simulates mouseleave on tasks-fill layer', () => {
    renderMap({ showTaskIds: true });
    const mouseleaveHandler = mockMap.on.mock.calls.find(call => call[0] === 'mouseleave' && call[1] === 'tasks-fill')?.[2];
    expect(mouseleaveHandler).toBeDefined();

    mouseleaveHandler();
    expect(mockMap.getCanvas().style.cursor).toBe('');
    expect(mockMap._canvasContainer.classList.remove).toHaveBeenCalledWith('maplibregl-track-pointer');
  });

  it('handles update to map layers when tasks change', () => {
    mockMap.getSource.mockReturnValue({ setData: jest.fn() });
    const { rerender } = renderWithRouter(
      <ReduxIntlProviders initialState={{ auth: { userDetails: { id: 1 } } }}>
        <TasksMap mapResults={mapResults} taskBordersOnly={true} />
      </ReduxIntlProviders>
    );

    rerender(
      <ReduxIntlProviders initialState={{ auth: { userDetails: { id: 1 } } }}>
        <TasksMap mapResults={{...mapResults}} taskBordersOnly={false} selectedOnMap={[1]} disableScrollZoom={true} />
      </ReduxIntlProviders>
    );

    expect(mockMap.setFilter).toHaveBeenCalledWith('selected-tasks-border', ['in', 'taskId', 1]);
    expect(mockMap.setLayoutProperty).toHaveBeenCalled();
  });

  it('navigates when clicking point-tasks-centroid', () => {
    const navigateMock = jest.fn();
    renderMap({ taskBordersOnly: true, navigate: navigateMock });
    
    const clickHandler = mockMap.on.mock.calls.find(call => call[0] === 'click' && call[1] === 'point-tasks-centroid')?.[2];
    if (clickHandler) clickHandler();
    
    expect(navigateMock).toHaveBeenCalledWith('./tasks');
  });
});
