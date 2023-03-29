import '@testing-library/jest-dom';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { getProjectSummary } from '../../../network/tests/mockData/projects';
import { store } from '../../../store';
import tasksGeojson from '../../../utils/tests/snippets/tasksGeometry';
import { IntlProviders, ReduxIntlProviders, renderWithRouter } from '../../../utils/testWithIntl';
import { TaskFilter, TaskItem } from '../taskList';

describe('Task Item', () => {
  const task = {
    lockedBy: null,
    taskId: 8,
    taskStatus: 'READY',
    actionDate: '2023-03-22T05:28:15.257341Z',
    actionBy: 'helnershingthapa',
  };

  it('should set the clicked task', async () => {
    const selectTaskMock = jest.fn();
    renderWithRouter(
      <IntlProviders>
        <TaskItem data={task} selectTask={selectTaskMock} />
      </IntlProviders>,
    );
    await userEvent.click(
      screen.getByRole('button', {
        name: /Task #8 helnershingthap/i,
      }),
    );
    expect(selectTaskMock).toHaveBeenCalledWith(8, 'READY');
  });

  it('should set the zoom task ID of the task to be zoomed', async () => {
    const setZoomedTaskIdMock = jest.fn();
    renderWithRouter(
      <IntlProviders>
        <TaskItem data={task} selectTask={jest.fn()} setZoomedTaskId={setZoomedTaskIdMock} />
      </IntlProviders>,
    );
    await userEvent.click(screen.getAllByRole('button')[1]);
    expect(setZoomedTaskIdMock).toHaveBeenCalledWith(8);
  });

  it('should display task detail modal', async () => {
    act(() => {
      store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
    });
    renderWithRouter(
      <ReduxIntlProviders>
        <TaskItem
          taskId={1}
          data={task}
          tasks={[tasksGeojson.features[7]]}
          selectTask={jest.fn()}
          project={getProjectSummary(123)}
        />
      </ReduxIntlProviders>,
    );
    await userEvent.click(screen.getByTitle(/See task history/i));
    expect(
      within(screen.getByRole('dialog')).getByRole('radio', { name: /activities/i }),
    ).toBeInTheDocument();
  });
});

describe('Task Filter', () => {
  it('should not show mapped option if user cannot validate', async () => {
    renderWithRouter(
      <IntlProviders>
        <TaskFilter userCanValidate={false} />
      </IntlProviders>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(screen.queryByText(/mapped/i)).not.toBeInTheDocument();
  });

  it('should show mapped option if user can validate', async () => {
    const setStatusFn = jest.fn();
    renderWithRouter(
      <IntlProviders>
        <TaskFilter userCanValidate setStatusFn={setStatusFn} />
      </IntlProviders>,
    );
    await userEvent.click(screen.getByRole('button'));
    await userEvent.click(screen.getByText(/ready for validation/i));
    expect(setStatusFn).toHaveBeenCalledWith('MAPPED');
  });
});
