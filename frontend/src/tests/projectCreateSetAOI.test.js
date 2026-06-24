import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IntlProvider } from 'react-intl';

import SetAOI from '../components/projectCreate/setAOI';

const Wrapper = ({ children }) => (
  <IntlProvider locale="en">
    {children}
  </IntlProvider>
);

describe('SetAOI component', () => {
  const defaultProps = {
    metadata: { geom: null, arbitraryTasks: false },
    updateMetadata: jest.fn(),
    uploadFile: jest.fn(),
    drawHandler: jest.fn(),
    deleteHandler: jest.fn(),
    drawIsActive: false,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<SetAOI {...defaultProps} />, { wrapper: Wrapper });
    expect(screen.getByText(/Step 1/i)).toBeInTheDocument();
  });

  it('calls drawHandler when draw button is clicked', () => {
    render(<SetAOI {...defaultProps} />, { wrapper: Wrapper });
    const drawBtn = screen.getByRole('button', { name: /draw/i });
    fireEvent.click(drawBtn);
    expect(defaultProps.drawHandler).toHaveBeenCalled();
  });

  it('renders reset button when geom is present and calls deleteHandler on click', () => {
    const propsWithGeom = {
      ...defaultProps,
      metadata: { geom: { type: 'FeatureCollection', features: [{ type: 'Feature' }] }, arbitraryTasks: false },
    };
    render(<SetAOI {...propsWithGeom} />, { wrapper: Wrapper });
    const resetBtn = screen.getByRole('button', { name: /reset/i });
    expect(resetBtn).toBeInTheDocument();
    
    fireEvent.click(resetBtn);
    expect(defaultProps.deleteHandler).toHaveBeenCalled();
  });

  it('applies active class to draw button when drawIsActive is true', () => {
    const activeProps = { ...defaultProps, drawIsActive: true };
    render(<SetAOI {...activeProps} />, { wrapper: Wrapper });
    const drawBtn = screen.getByRole('button', { name: /draw/i });
    expect(drawBtn).toHaveClass('red');
    expect(drawBtn).toHaveClass('b--red');
  });
});
