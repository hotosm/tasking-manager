import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import FileFormatCard from '../components/projectDetail/fileFormatCard';

describe('FileFormatCard component', () => {
  const defaultProps = {
    title: 'Test Title',
    fileFormats: ['geojson', 'shp', 'kml'],
    isDownloadingState: {
      isDownloading: false,
      title: '',
      fileFormat: '',
    },
    setSelectedCategoryFormat: jest.fn(),
    selectedCategoryFormat: { title: 'Test Title', format: 'geojson' },
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with given file formats', () => {
    render(<FileFormatCard {...defaultProps} />);
    expect(screen.getByText('geojson')).toBeInTheDocument();
    expect(screen.getByText('shp')).toBeInTheDocument();
    expect(screen.getByText('kml')).toBeInTheDocument();
  });

  it('applies red class to selected format', () => {
    const { container } = render(<FileFormatCard {...defaultProps} />);
    const selectedFormat = screen.getByText('geojson').closest('span');
    expect(selectedFormat).toHaveClass('red');
  });

  it('calls setSelectedCategoryFormat on click', () => {
    render(<FileFormatCard {...defaultProps} />);
    const shpFormat = screen.getByText('shp').closest('span');
    fireEvent.click(shpFormat);
    expect(defaultProps.setSelectedCategoryFormat).toHaveBeenCalledWith({ title: 'Test Title', format: 'shp' });
  });

  it('renders loading state for downloading format', () => {
    const props = {
      ...defaultProps,
      isDownloadingState: {
        isDownloading: true,
        title: 'Test Title',
        fileFormat: 'shp',
      },
    };
    render(<FileFormatCard {...props} />);
    const shpFormat = screen.getByText('shp').closest('span');
    expect(shpFormat).toHaveStyle('cursor: not-allowed');
    expect(shpFormat).toHaveStyle('pointer-events: none');
    
    // Check if SVG (loading icon) is rendered within the shp span
    const svg = shpFormat.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
