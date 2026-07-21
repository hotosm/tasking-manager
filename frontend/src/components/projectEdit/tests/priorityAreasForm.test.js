import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PriorityAreasForm } from '../priorityAreasForm';
import { StateContext } from '../../../views/projectEdit';
import { ReduxIntlProviders } from '../../../utils/testWithIntl';
import * as webglSupported from '../../../utils/isWebglSupported';


jest.mock('@watergis/maplibre-gl-terradraw', () => {
  class MaplibreTerradrawControl {
    getTerraDrawInstance() {
      return {
        setMode: jest.fn(),
        on: jest.fn(),
        clear: jest.fn(),
      };
    }
  }
  return { MaplibreTerradrawControl };
});

const mockProjectInfo = {
  priorityAreas: [],
  areaOfInterest: { type: 'FeatureCollection', features: [] },
  aoiBBOX: [0, 0, 10, 10],
};

const renderForm = (projectInfo = mockProjectInfo, setProjectInfo = jest.fn()) => {
  return render(
    <ReduxIntlProviders>
      <StateContext.Provider value={{ projectInfo, setProjectInfo }}>
        <PriorityAreasForm />
      </StateContext.Provider>
    </ReduxIntlProviders>
  );
};

describe('PriorityAreasForm', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders WebglUnsupported when webgl is not supported', () => {
    jest.spyOn(webglSupported, 'default').mockReturnValue(false);
    renderForm();
    expect(screen.getByText(/WebGL Context Not Found/i)).toBeInTheDocument();
  });

  it('renders map and controls when webgl is supported', () => {
    jest.spyOn(webglSupported, 'default').mockReturnValue(true);
    renderForm();
    expect(screen.getByText(/Draw polygon/i)).toBeInTheDocument();
    expect(screen.getByText(/Draw rectangle/i)).toBeInTheDocument();
    expect(screen.getByText(/Select File/i)).toBeInTheDocument();
    expect(screen.getByText(/Clear all/i)).toBeInTheDocument();
  });

  it('handles draw polygon button click', async () => {
    jest.spyOn(webglSupported, 'default').mockReturnValue(true);
    const user = userEvent.setup();
    renderForm();

    const drawPolygonBtn = screen.getByRole('button', { name: /Draw polygon/i });
    await user.click(drawPolygonBtn);
    expect(drawPolygonBtn).toHaveClass('red b--red'); // active class
  });

  it('handles draw rectangle button click', async () => {
    jest.spyOn(webglSupported, 'default').mockReturnValue(true);
    const user = userEvent.setup();
    renderForm();

    const drawRectangleBtn = screen.getByRole('button', { name: /Draw rectangle/i });
    await user.click(drawRectangleBtn);
    expect(drawRectangleBtn).toHaveClass('red b--red'); // active class
  });

  it('handles clear all button click', async () => {
    jest.spyOn(webglSupported, 'default').mockReturnValue(true);
    const setProjectInfo = jest.fn();
    const user = userEvent.setup();
    renderForm({ ...mockProjectInfo, priorityAreas: [{ type: 'Polygon', coordinates: [] }] }, setProjectInfo);

    const clearAllBtn = screen.getByRole('button', { name: /Clear all/i });
    await user.click(clearAllBtn);

    expect(setProjectInfo).toHaveBeenCalledWith(expect.objectContaining({
      priorityAreas: [],
    }));
  });
});
