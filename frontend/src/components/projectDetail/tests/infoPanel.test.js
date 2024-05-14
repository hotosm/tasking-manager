import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ProjectInfoPanel } from '../infoPanel';
import { IntlProviders } from '../../../utils/testWithIntl';
import { getProjectSummary } from '../../../network/tests/mockData/projects';

describe('if projectInfoPanel', () => {
  const contributors = [
    {
      username: 'test_user',
      mappingLevel: 'ADVANCED',
      pictureUrl: null,
      mapped: 2,
      validated: 0,
      total: 2,
      mappedTasks: [1, 2],
      validatedTasks: [],
      name: 'Test',
      dateRegistered: new Date(),
    },
  ];

  const tasks = {
    features: [
      {
        geometry: {
          coordinates: [
            [
              [
                [-71.485823338, 1.741751328],
                [-71.485899664, 1.741550711],
                [-71.485954761, 1.741751328],
                [-71.485823338, 1.741751328],
              ],
            ],
          ],
          type: 'MultiPolygon',
        },
        properties: {
          lockedBy: null,
          taskId: 2,
          taskIsSquare: false,
          taskStatus: 'MAPPED',
          taskX: 158035,
          taskY: 264680,
          taskZoom: 19,
        },
        type: 'Feature',
      },
      {
        geometry: {
          coordinates: [
            [
              [
                [-71.485686012, 1.742112276],
                [-71.485823338, 1.741751328],
                [-71.485954761, 1.741751328],
                [-71.48597717, 1.741832923],
                [-71.48597717, 1.741970313],
                [-71.485686012, 1.742112276],
              ],
            ],
          ],
          type: 'MultiPolygon',
        },
        properties: {
          lockedBy: null,
          taskId: 3,
          taskIsSquare: false,
          taskStatus: 'READY',
          taskX: 158035,
          taskY: 264681,
          taskZoom: 19,
        },
        type: 'Feature',
      },
    ],
    type: 'FeatureCollection',
  };

  const project = { ...getProjectSummary(2), lastUpdated: Date.now() - 1e3 * 60 * 60 };

  it('renders panel for a beginner mapper project with 1 contributor using any imagery', () => {
    render(
      <IntlProviders>
        <ProjectInfoPanel
          project={project}
          tasks={tasks}
          contributors={contributors}
          type={'detail'}
        />
      </IntlProviders>,
    );

    expect(screen.getByText('Types of Mapping')).toBeInTheDocument();
    expect(screen.getByText('Imagery')).toBeInTheDocument();
    expect(screen.queryByText('Any available source')).toBeInTheDocument();
    expect(screen.queryByText('1')).toBeInTheDocument();
    expect(screen.queryByText('contributor')).toBeInTheDocument();
    expect(screen.queryByText('Last contribution 1 hour ago')).toBeInTheDocument();
    expect(screen.queryByText('Easy')).toBeInTheDocument();
  });

  it('renders new immediate mapper project with no contributors yet and using Custom imagery', () => {
    render(
      <IntlProviders>
        <ProjectInfoPanel
          project={{ ...project, difficulty: 'MODERATE', imagery: 'Mapbox' }}
          tasks={tasks}
          contributors={[]}
          type={'detail'}
        />
      </IntlProviders>,
    );
    expect(screen.getByText('Types of Mapping')).toBeInTheDocument();
    expect(screen.getByText('Imagery')).toBeInTheDocument();
    expect(screen.queryByText('Mapbox Satellite')).toBeInTheDocument();
    expect(screen.queryByText(/No contributors yet/)).toBeInTheDocument();
    expect(screen.queryByText('Last contribution 1 hour ago')).toBeInTheDocument();
    expect(screen.queryByText('Moderate')).toBeInTheDocument();
  });
});
