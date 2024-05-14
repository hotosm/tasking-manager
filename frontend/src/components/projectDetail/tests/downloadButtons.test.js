import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { DownloadAOIButton, DownloadTaskGridButton } from '../downloadButtons';
import { IntlProviders } from '../../../utils/testWithIntl';

describe('tests DownloadAOI and DownloadTasksGrid buttons', () => {
  it('displays button to download AOI for project with id 1', () => {
    const { container } = render(
      <IntlProviders>
        <DownloadAOIButton projectId={1} className={''} />
      </IntlProviders>,
    );
    expect(container.querySelector('a').href).toContain('projects/1/queries/aoi/?as_file=true');
    expect(container.querySelector('a').download).toBe('project-1-aoi.geojson');
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(screen.getByText(/Download AOI/)).toBeInTheDocument();
    expect(screen.getByRole('button', { pressed: false })).toBeInTheDocument();
  });

  it('displays button to download Task Grid for project with id 2', () => {
    const { container } = render(
      <IntlProviders>
        <DownloadTaskGridButton projectId={2} className={''} />
      </IntlProviders>,
    );
    expect(container.querySelector('a').href).toContain('projects/2/tasks/?as_file=true');
    expect(container.querySelector('a').download).toBe('project-2-tasks.geojson');
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(screen.getByText(/Download Tasks Grid/)).toBeInTheDocument();
    expect(screen.getByRole('button', { pressed: false })).toBeInTheDocument();
  });
});
