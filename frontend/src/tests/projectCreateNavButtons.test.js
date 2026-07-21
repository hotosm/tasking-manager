import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IntlProvider } from 'react-intl';

import NavButtons from '../components/projectCreate/navButtons';

const Wrapper = ({ children }) => (
  <IntlProvider locale="en">
    {children}
  </IntlProvider>
);

describe('NavButtons component', () => {
  const mockMapObj = {
    map: {
      getSource: jest.fn().mockReturnValue({
        setData: jest.fn(),
        _data: { type: 'FeatureCollection', features: [] }
      })
    },
    draw: {
      getTerraDrawInstance: jest.fn()
    }
  };

  const defaultProps = {
    index: 1,
    setStep: jest.fn(),
    setErr: jest.fn(),
    updateMetadata: jest.fn(),
    metadata: {
      area: 10,
      geom: { features: [{ id: 1 }] },
      taskGrid: { features: [] },
      tempTaskGrid: { features: [] },
      arbitraryTasks: false,
    },
    maxArea: 100,
    mapObj: mockMapObj,
    cloneProjectData: { name: null },
    handleCreate: jest.fn().mockResolvedValue(true),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders only next button on step 1', () => {
    render(<NavButtons {...defaultProps} />, { wrapper: Wrapper });
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.queryByText('Back')).not.toBeInTheDocument();
  });

  it('handles step 1 next click without errors', () => {
    render(<NavButtons {...defaultProps} />, { wrapper: Wrapper });
    fireEvent.click(screen.getByText('Next'));
    expect(defaultProps.setErr).toHaveBeenCalledWith({ error: false, message: '' });
    expect(defaultProps.setStep).toHaveBeenCalledWith(2);
  });

  it('handles step 1 next click with area error', () => {
    const props = { ...defaultProps, metadata: { ...defaultProps.metadata, area: 150 } };
    render(<NavButtons {...props} />, { wrapper: Wrapper });
    fireEvent.click(screen.getByText('Next'));
    expect(defaultProps.setErr).toHaveBeenCalledWith(expect.objectContaining({ error: true }));
  });

  it('renders back and next on step 2', () => {
    const props = { ...defaultProps, index: 2 };
    render(<NavButtons {...props} />, { wrapper: Wrapper });
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('Back to previous')).toBeInTheDocument();
  });

  it('handles step 2 back click', () => {
    const props = { ...defaultProps, index: 2 };
    render(<NavButtons {...props} />, { wrapper: Wrapper });
    fireEvent.click(screen.getByText('Back to previous'));
    expect(props.setStep).toHaveBeenCalledWith(1);
    expect(mockMapObj.map.getSource).toHaveBeenCalledWith('grid');
  });

  it('handles step 3 next click', () => {
    const props = { ...defaultProps, index: 3 };
    render(<NavButtons {...props} />, { wrapper: Wrapper });
    fireEvent.click(screen.getByText('Next'));
    expect(props.setStep).toHaveBeenCalledWith(4);
  });

  it('renders create button on step 4', () => {
    const props = { ...defaultProps, index: 4 };
    render(<NavButtons {...props} />, { wrapper: Wrapper });
    expect(screen.getByText('Create')).toBeInTheDocument();
  });

  it('handles clone creation', () => {
    const props = { ...defaultProps, index: 4, cloneProjectData: { name: 'Clone' } };
    render(<NavButtons {...props} />, { wrapper: Wrapper });
    expect(screen.getByText('Clone')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Clone'));
    expect(props.handleCreate).toHaveBeenCalled();
  });
});
