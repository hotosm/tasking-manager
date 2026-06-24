import React from 'react';
import '@testing-library/jest-dom';
import { screen, act, fireEvent, waitFor } from '@testing-library/react';

import ProjectCreate from '../index';
import { store } from '../../../store';
import { createComponentWithMemoryRouter, ReduxIntlProviders } from '../../../utils/testWithIntl';
import * as genericJSONRequest from '../../../network/genericJSONRequest';

import { Toaster } from 'react-hot-toast';

import { QueryParamProvider } from 'use-query-params';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';

jest.mock('../projectCreationMap', () => {
  return ({ metadata, updateMetadata, step, uploadFile, mapObj }) => (
    <div data-testid="project-creation-map">
      <button onClick={() => updateMetadata({ ...metadata, area: 50, projectName: 'Test', taskGrid: { type: 'FeatureCollection', features: [] }, geom: { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Polygon', coordinates: [] } }] }, organisation: 'Test Org' })}>Mock Map Update Area Valid</button>
      <button onClick={() => updateMetadata({ ...metadata, area: 50, projectName: '', geom: { type: 'Polygon', coordinates: [] }, taskGrid: { type: 'FeatureCollection', features: [] }, organisation: 'Test Org' })}>Mock Map Update Area No Name</button>
      <button onClick={() => uploadFile([{ name: 'test.geojson' }])}>Mock Map Upload</button>
    </div>
  );
});

jest.mock('../setAOI', () => {
  return ({ updateMetadata, metadata, drawHandler, deleteHandler }) => (
    <div data-testid="set-aoi">
      <button onClick={() => drawHandler()}>Mock Draw</button>
      <button onClick={() => deleteHandler()}>Mock Delete</button>
      <button onClick={() => updateMetadata({ ...metadata, area: 9999999 })}>Mock Large Area</button>
    </div>
  );
});

jest.mock('../setTaskSizes', () => () => <div data-testid="set-task-sizes" />);
jest.mock('../trimProject', () => () => <div data-testid="trim-project" />);
jest.mock('../review', () => () => <div data-testid="review-project" />);
jest.mock('../navButtons', () => {
  return ({ index, setStep, handleCreate }) => (
    <div data-testid="nav-buttons">
      <button onClick={() => setStep(index + 1)}>Next Step</button>
      <button onClick={() => setStep(index - 1)}>Prev Step</button>
      <button onClick={() => handleCreate()}>Mock Create</button>
    </div>
  );
});

jest.mock('../../../utils/isWebglSupported', () => () => true);

jest.mock('../../../utils/geoFileFunctions', () => ({
  verifyFileFormat: jest.fn(),
  verifyFileSize: jest.fn(),
  readGeoFile: jest.fn(() => Promise.resolve({ type: 'FeatureCollection', features: [] })),
  verifyGeometry: jest.fn(() => ({ type: 'Polygon', coordinates: [] })),
}));

jest.mock('@watergis/maplibre-gl-terradraw', () => ({
  MaplibreTerradrawControl: class {
    getTerraDrawInstance() {
      return {
        clear: jest.fn(),
        setMode: jest.fn(),
        on: jest.fn(),
        selectFeature: jest.fn(),
        getFeatures: jest.fn(() => []),
      };
    }
  }
}));

jest.mock('terra-draw', () => ({
  TerraDrawPolygonMode: class {}
}));

jest.mock('@turf/area', () => () => 50000000);
jest.mock('@turf/bbox', () => () => [0, 0, 10, 10]);

const setup = () => {
  act(() => {
    store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
  });

  return createComponentWithMemoryRouter(
    <ReduxIntlProviders>
      <Toaster />
      <QueryParamProvider adapter={ReactRouter6Adapter}>
        <ProjectCreate />
      </QueryParamProvider>
    </ReduxIntlProviders>,
    { route: '/manage/projects/new' }
  );
};

describe('ProjectCreate', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders ProjectCreate and first step by default', async () => {
    setup();
    expect(screen.getByText(/Create new project/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('set-aoi')).toBeInTheDocument();
      expect(screen.getByTestId('project-creation-map')).toBeInTheDocument();
    });
  });

  it('navigates between steps', async () => {
    setup();
    await waitFor(() => expect(screen.getByTestId('nav-buttons')).toBeInTheDocument());
    
    // Step 1 -> 2
    act(() => { fireEvent.click(screen.getByText('Next Step')); });
    await waitFor(() => expect(screen.getByTestId('set-task-sizes')).toBeInTheDocument());

    // Step 2 -> 3
    act(() => { fireEvent.click(screen.getByText('Next Step')); });
    await waitFor(() => expect(screen.getByTestId('trim-project')).toBeInTheDocument());

    // Step 3 -> 4
    act(() => { fireEvent.click(screen.getByText('Next Step')); });
    await waitFor(() => expect(screen.getByTestId('review-project')).toBeInTheDocument());
  });

  it('handles area update and limits', async () => {
    setup();
    await waitFor(() => expect(screen.getByTestId('set-aoi')).toBeInTheDocument());

    // Trigger area update to an extremely large area
    act(() => { fireEvent.click(screen.getByText('Mock Large Area')); });
    
    await waitFor(() => {
      // should display an error about area being over limit
      expect(screen.getByText(/Project area is higher than/i)).toBeInTheDocument();
    });
  });

  it('handles draw mode toggle', async () => {
    setup();
    await waitFor(() => expect(screen.getByTestId('set-aoi')).toBeInTheDocument());

    act(() => { fireEvent.click(screen.getByText('Mock Draw')); });
    // Calling it again should toggle it off
    act(() => { fireEvent.click(screen.getByText('Mock Draw')); });
  });

  it('handles delete handler', async () => {
    setup();
    await waitFor(() => expect(screen.getByTestId('set-aoi')).toBeInTheDocument());

    act(() => { fireEvent.click(screen.getByText('Mock Delete')); });
    // the area should reset to 0, turning the badge red
    await waitFor(() => {
      expect(screen.getByText(/Area size:\s*0/)).toBeInTheDocument();
    });
  });

  it('handles create project API call', async () => {
    jest.spyOn(genericJSONRequest, 'pushToLocalJSONAPI').mockResolvedValue({ projectId: 123 });
    setup();
    await waitFor(() => expect(screen.getByTestId('project-creation-map')).toBeInTheDocument());

    // set metadata name and valid geom (simulated by clicking button)
    act(() => { fireEvent.click(screen.getByText('Mock Map Update Area No Name')); });

    // Step 1 -> 4
    act(() => { fireEvent.click(screen.getByText('Next Step')); });
    act(() => { fireEvent.click(screen.getByText('Next Step')); });
    act(() => { fireEvent.click(screen.getByText('Next Step')); });

    // Click mock create button
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    act(() => { fireEvent.click(screen.getByText('Mock Create')); });
    consoleSpy.mockRestore();

    await waitFor(() => {
      expect(screen.getByText(/Name is a required field/i)).toBeInTheDocument();
    });
  });
});
