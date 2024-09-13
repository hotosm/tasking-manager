import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ReduxIntlProviders, renderWithRouter } from '../../../utils/testWithIntl';
import { TopProjects } from '../topProjects';

describe('TopProjects card', () => {
  it('renders a message if the user has not stats yet', () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <TopProjects projects={{ mappedProjects: [] }} />
      </ReduxIntlProviders>,
    );

    expect(screen.getByText('Top 5 projects contributed').className).toBe('f125 mv0 fw6 pt3');
    expect(screen.getByText('No projects mapped until now.')).toBeInTheDocument();
  });
  it('renders the chart if projects data is present', () => {
    const projects = {
      mappedProjects: [
        {
          projectId: 87,
          name: 'Test Project',
          tasksMapped: 3,
          tasksValidated: 1,
          status: 'PUBLISHED',
          centroid: { type: 'Point', coordinates: [-71.421715463, -13.08136338] },
        },
        {
          projectId: 84,
          name: 'Test Project 2',
          tasksMapped: 5,
          tasksValidated: 2,
          status: 'PUBLISHED',
          centroid: { type: 'Point', coordinates: [-71.421715463, -13.08136338] },
        },
      ],
    };
    const { container } = renderWithRouter(
      <ReduxIntlProviders>
        <TopProjects projects={projects} />
      </ReduxIntlProviders>,
    );

    expect(screen.getByText('Top 5 projects contributed').className).toBe('f125 mv0 fw6 pt3');
    expect(screen.getByText('7')).toBeInTheDocument();
    const progressBars = container.querySelectorAll('div.bg-red.br-pill.absolute');
    expect(progressBars[0].style.height).toBe('0.5em');
    expect(progressBars[1].style.height).toBe('0.5em');
    expect(progressBars[0].style.width).toBe('100%');
    expect(progressBars[1].style.width).toBe('57.14285714285714%');
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.queryByText('No projects mapped until now.')).not.toBeInTheDocument();
    expect(container.querySelectorAll('li').length).toBe(2);
  });
});
