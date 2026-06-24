import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DownloadOsmData } from '../downloadOsmData';
import { ReduxIntlProviders, renderWithRouter } from '../../../utils/testWithIntl';

// We mock FileFormatCard because it handles the internal selection of the file format,
// which triggers the `selectedCategoryFormat` in the parent.
jest.mock('../fileFormatCard', () => {
  return function MockFileFormatCard({ title, fileFormats, setSelectedCategoryFormat }) {
    return (
      <button
        data-testid={`mock-file-format-${title}`}
        onClick={() => setSelectedCategoryFormat({ title, format: fileFormats[0] })}
      >
        Select {title}
      </button>
    );
  };
});

describe('DownloadOsmData', () => {
  const mockProject = { projectId: 1 };
  
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.clearAllMocks();
  });

  const renderComponent = (projectMappingTypes) => {
    return renderWithRouter(
      <ReduxIntlProviders>
        <DownloadOsmData projectMappingTypes={projectMappingTypes} project={mockProject} />
      </ReduxIntlProviders>
    );
  };

  it('renders correctly with matching project mapping types', () => {
    renderComponent(['ROADS', 'BUILDINGS']);
    expect(screen.getByText('roads')).toBeInTheDocument();
    expect(screen.getByText('buildings')).toBeInTheDocument();
    expect(screen.queryByText('waterways')).not.toBeInTheDocument();
  });

  it('handles format selection and fetches HEAD data for size and lastmod', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      headers: {
        get: jest.fn().mockImplementation((key) => {
          if (key === 'Content-Length') return '1024';
          if (key === 'Last-Modified') return 'Mon, 01 Jan 2024 00:00:00 GMT';
          return null;
        }),
      },
    });

    renderComponent(['ROADS']);

    const selectBtn = screen.getByTestId('mock-file-format-roads');
    fireEvent.click(selectBtn);

    await waitFor(() => {
      // It should display the file sizes / lastmod
      expect(screen.getByText(/Mon, 01 Jan 2024 00:00:00 GMT/i)).toBeInTheDocument();
      expect(screen.getByText(/\(1 KiB\)/i)).toBeInTheDocument();
    });
  });

  it('handles clicking on a specific download format (triggering S3 download)', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      headers: {
        get: jest.fn().mockImplementation((key) => {
          if (key === 'Content-Length') return '1024';
          if (key === 'Last-Modified') return 'Mon, 01 Jan 2024 00:00:00 GMT';
          return null;
        }),
      },
    });

    // Mock window.open
    global.window.open = jest.fn(() => ({ blur: jest.fn() }));

    renderComponent(['ROADS']);

    // Select format
    const selectBtn = screen.getByTestId('mock-file-format-roads');
    fireEvent.click(selectBtn);

    await waitFor(() => {
      expect(screen.getByText(/Mon, 01 Jan 2024 00:00:00 GMT/i)).toBeInTheDocument();
    });

    // Click the actual download line
    // The text contains "lines GeoJSON" for roads
    const downloadLink = screen.getByText(/lines GeoJSON/i).closest('span.categorycard');
    
    // Reset fetch mock for the download HEAD call
    global.fetch.mockResolvedValueOnce({ ok: true });
    
    fireEvent.click(downloadLink);

    await waitFor(() => {
      expect(global.window.open).toHaveBeenCalled();
    });
  });

  it('handles failed download and shows popup', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      headers: {
        get: jest.fn().mockImplementation((key) => {
          if (key === 'Content-Length') return '1024';
          if (key === 'Last-Modified') return 'Mon, 01 Jan 2024 00:00:00 GMT';
          return null;
        }),
      },
    });

    global.window.open = jest.fn(() => ({ blur: jest.fn() }));

    renderComponent(['ROADS']);

    const selectBtn = screen.getByTestId('mock-file-format-roads');
    fireEvent.click(selectBtn);

    await waitFor(() => {
      expect(screen.getByText(/Mon, 01 Jan 2024 00:00:00 GMT/i)).toBeInTheDocument();
    });

    const downloadLink = screen.getByText(/lines GeoJSON/i).closest('span.categorycard');
    
    // Fail the next fetch
    global.fetch.mockResolvedValueOnce({ ok: false, status: 404 });
    
    fireEvent.click(downloadLink);

    await waitFor(() => {
      expect(screen.getByText(/Data Extraction Unavailable/i)).toBeInTheDocument();
    });

    // Close the popup
    const closeBtn = screen.getByRole('button', { name: /Close/i });
    fireEvent.click(closeBtn);
    
    await waitFor(() => {
      expect(screen.queryByText(/Data Extraction Unavailable/i)).not.toBeInTheDocument();
    });
  });
});
