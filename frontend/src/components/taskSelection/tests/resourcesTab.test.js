import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';

import { ReduxIntlProviders } from '../../../utils/testWithIntl';
import { tasks } from '../../../network/tests/mockData/taskGrid';
import { ResourcesTab } from '../resourcesTab';
import userEvent from '@testing-library/user-event';

describe('ResourcesTab', () => {
  const projectData = {
    projectId: 1,
    created: '2019-08-27T12:18:07.186897Z',
    changesetComment: '#hot-osm-project-123 #buildings',
  };
  it('with multiple tasks locked', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ReduxIntlProviders>
        <ResourcesTab tasksGeojson={tasks} project={projectData} tasksIds={[1, 2]} />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('Changesets')).toBeInTheDocument();
    expect(screen.getByText('Entire project')).toBeInTheDocument();
    expect(screen.getByText("Project's data")).toBeInTheDocument();
    expect(screen.getByText('Select task')).toBeInTheDocument();
    expect(screen.getByText("See task's changesets").disabled).toBeTruthy();
    expect(screen.getByText('Download AOI')).toBeInTheDocument();
    expect(container.querySelectorAll('a')[2].href).toContain(
      '/projects/1/queries/aoi/?as_file=true',
    );
    expect(screen.getByText('Download Tasks Grid')).toBeInTheDocument();
    expect(container.querySelectorAll('a')[3].href).toContain('/projects/1/tasks/?as_file=true');

    const selectInput = container.querySelector('input');
    await selectInput.focus();
    await user.type(selectInput, '{ArrowDown}');
    await waitFor(() => {
      expect(screen.getByText(1));
    });
    expect(screen.getByText(2));
    await user.click(screen.getByText(1));
    await expect(screen.queryByText('Select task')).not.toBeInTheDocument();
    expect(screen.getByText("See task's changesets").disabled).toBeFalsy();
  });
  it('with single task locked', () => {
    render(
      <ReduxIntlProviders>
        <ResourcesTab tasksGeojson={tasks} project={projectData} tasksIds={[1]} />
      </ReduxIntlProviders>,
    );
    expect(screen.queryByText('Select task')).not.toBeInTheDocument();
    expect(screen.getByText("See task's changesets").disabled).toBeFalsy();
  });
});
