import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import { store } from '../store';

import { DownloadAOIButton, DownloadTaskGridButton } from '../components/projectDetail/downloadButtons';

const Wrapper = ({ children }) => (
  <Provider store={store}>
    <IntlProvider locale="en">
      {children}
    </IntlProvider>
  </Provider>
);

describe('DownloadAOIButton component', () => {
  it('renders correctly', () => {
    const { container } = render(<DownloadAOIButton projectId={1} className="test-class" />, { wrapper: Wrapper });
    const link = container.querySelector('a');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', expect.stringContaining('projects/1/queries/aoi/?as_file=true'));
    expect(link).toHaveAttribute('download', 'project-1-aoi.geojson');
    expect(screen.getByText(/download project aoi/i)).toBeInTheDocument();
  });
});

describe('DownloadTaskGridButton component', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        blob: () => Promise.resolve(new Blob()),
      })
    );
    global.URL.createObjectURL = jest.fn();
    global.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<DownloadTaskGridButton projectId={1} className="test-class" />, { wrapper: Wrapper });
    expect(screen.getByText(/download task grid/i)).toBeInTheDocument();
  });

  it('calls fetch and triggers download on click', async () => {
    render(<DownloadTaskGridButton projectId={1} className="test-class" />, { wrapper: Wrapper });
    const btn = screen.getByRole('button');
    
    fireEvent.click(btn);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('projects/1/tasks/?as_file=true'),
        expect.any(Object)
      );
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });
  });

  it('handles fetch error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
      })
    );
    
    render(<DownloadTaskGridButton projectId={1} className="test-class" />, { wrapper: Wrapper });
    const btn = screen.getByRole('button');
    
    fireEvent.click(btn);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Download error:', expect.any(Error));
    });
    
    consoleSpy.mockRestore();
  });
});
