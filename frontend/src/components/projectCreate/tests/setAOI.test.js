import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import SetAOI from '../setAOI';
import { IntlProviders } from '../../../utils/testWithIntl';
import * as useGeomContainsMultiplePolygons from '../../../hooks/UseGeomContainsMultiplePolygons';

jest.mock('react-dropzone', () => ({
  useDropzone: jest.fn(() => ({
    getRootProps: jest.fn(),
    getInputProps: jest.fn(),
    open: jest.fn(),
  })),
}));

describe('SetAOI Component', () => {
  const setup = (props) => {
    return render(
      <IntlProviders>
        <SetAOI {...props} />
      </IntlProviders>
    );
  };

  const defaultProps = {
    metadata: { geom: null, arbitraryTasks: false },
    updateMetadata: jest.fn(),
    uploadFile: jest.fn(),
    drawHandler: jest.fn(),
    deleteHandler: jest.fn(),
    drawIsActive: false,
  };

  beforeEach(() => {
    jest.spyOn(useGeomContainsMultiplePolygons, 'useContainsMultiplePolygons').mockReturnValue({ containsMultiplePolygons: false });
  });

  it('renders correctly and handles draw action', () => {
    setup(defaultProps);
    expect(screen.getByText('Step 1: define area')).toBeInTheDocument();
    
    const drawBtn = screen.getByText('Draw');
    expect(drawBtn).toBeInTheDocument();
    fireEvent.click(drawBtn);
    expect(defaultProps.drawHandler).toHaveBeenCalled();
  });

  it('shows arbitrary tasks toggle when containsMultiplePolygons is true', () => {
    jest.spyOn(useGeomContainsMultiplePolygons, 'useContainsMultiplePolygons').mockReturnValue({ containsMultiplePolygons: true });
    
    setup({ ...defaultProps, metadata: { ...defaultProps.metadata, geom: { features: [1, 2] } } });
    
    const toggleLabel = screen.getByText('Set tasks using uploaded polygons');
    expect(toggleLabel).toBeInTheDocument();
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    expect(defaultProps.updateMetadata).toHaveBeenCalledWith(
      expect.objectContaining({ arbitraryTasks: true, tasksNumber: 2 })
    );
  });

  it('shows reset button when geom is present and handles click', () => {
    setup({ ...defaultProps, metadata: { ...defaultProps.metadata, geom: {} } });
    
    const resetBtn = screen.getByText('Reset');
    expect(resetBtn).toBeInTheDocument();
    fireEvent.click(resetBtn);
    expect(defaultProps.deleteHandler).toHaveBeenCalled();
  });
});
