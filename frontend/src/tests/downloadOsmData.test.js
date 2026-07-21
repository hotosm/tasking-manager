import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import { store } from '../store';

import { TITLED_ICONS, DownloadOsmData } from '../components/projectDetail/downloadOsmData';

const Wrapper = ({ children }) => (
  <Provider store={store}>
    <IntlProvider locale="en">
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </IntlProvider>
  </Provider>
);

const mockProject = {
  projectId: 123,
};

describe('TITLED_ICONS constant', () => {
  it('is defined and is an array', () => {
    expect(TITLED_ICONS).toBeDefined();
    expect(Array.isArray(TITLED_ICONS)).toBe(true);
  });

  it('has the expected icons', () => {
    const titles = TITLED_ICONS.map((i) => i.title);
    expect(titles).toContain('roads');
    expect(titles).toContain('buildings');
    expect(titles).toContain('waterways');
    expect(titles).toContain('landuse');
  });

  it('each icon has Icon, title, value, featuretype, and formats', () => {
    TITLED_ICONS.forEach((icon) => {
      expect(icon.Icon).toBeDefined();
      expect(icon.title).toBeDefined();
      expect(icon.value).toBeDefined();
      expect(Array.isArray(icon.featuretype)).toBe(true);
      expect(Array.isArray(icon.formats)).toBe(true);
    });
  });

  it('roads icon has correct formats', () => {
    const roads = TITLED_ICONS.find((i) => i.title === 'roads');
    expect(roads.formats).toContain('GeoJSON');
    expect(roads.formats).toContain('shp');
    expect(roads.formats).toContain('kml');
  });
});

describe('DownloadOsmData component', () => {
  it('renders without crashing with ROADS type', () => {
    const { container } = render(
      <DownloadOsmData projectMappingTypes={['ROADS']} project={mockProject} />,
      { wrapper: Wrapper }
    );
    expect(container).toBeInTheDocument();
  });

  it('renders the roads card', () => {
    render(
      <DownloadOsmData projectMappingTypes={['ROADS']} project={mockProject} />,
      { wrapper: Wrapper }
    );
    expect(screen.getByText('roads')).toBeInTheDocument();
  });

  it('renders with multiple mapping types', () => {
    render(
      <DownloadOsmData
        projectMappingTypes={['ROADS', 'BUILDINGS']}
        project={mockProject}
      />,
      { wrapper: Wrapper }
    );
    expect(screen.getByText('roads')).toBeInTheDocument();
    expect(screen.getByText('buildings')).toBeInTheDocument();
  });

  it('renders with empty mapping types array', () => {
    const { container } = render(
      <DownloadOsmData projectMappingTypes={[]} project={mockProject} />,
      { wrapper: Wrapper }
    );
    expect(container).toBeInTheDocument();
  });

  it('renders with all mapping types', () => {
    render(
      <DownloadOsmData
        projectMappingTypes={['ROADS', 'BUILDINGS', 'WATERWAYS', 'LAND_USE']}
        project={mockProject}
      />,
      { wrapper: Wrapper }
    );
    expect(screen.getByText('roads')).toBeInTheDocument();
    expect(screen.getByText('buildings')).toBeInTheDocument();
    expect(screen.getByText('waterways')).toBeInTheDocument();
    expect(screen.getByText('landuse')).toBeInTheDocument();
  });
});
