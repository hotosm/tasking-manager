import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';

import { IntlProviders, renderWithRouter } from '../../../utils/testWithIntl';
import { assignedTasks } from '../../../network/tests/mockData/taskAssignments';
import { AssignedTasks } from '../assignedTasks';

describe('AssignedTasks', () => {
  it('lists the assigned tasks with stage, team and link to the task', () => {
    renderWithRouter(
      <IntlProviders>
        <AssignedTasks
          data={assignedTasks}
          isLoading={false}
          isError={false}
          pendingOnly
          setPendingOnly={jest.fn()}
          setPage={jest.fn()}
        />
      </IntlProviders>,
    );
    expect(screen.getByRole('link', { name: 'Task #1 · Project #123' })).toHaveAttribute(
      'href',
      '/projects/123/tasks?search=1',
    );
    expect(screen.getByText('Mapping')).toBeInTheDocument();
    expect(screen.getByText('Validation')).toBeInTheDocument();
    expect(screen.getByText('via team Team Test')).toBeInTheDocument();
    expect(screen.getAllByText(/Assigned by pm_user/)).toHaveLength(2);
  });

  it('shows an empty state and toggles completed assignments', async () => {
    const setPendingOnly = jest.fn();
    const { user } = renderWithRouter(
      <IntlProviders>
        <AssignedTasks
          data={{ tasks: [], pagination: { page: 1, pages: 0, total: 0 } }}
          isLoading={false}
          isError={false}
          pendingOnly
          setPendingOnly={setPendingOnly}
          setPage={jest.fn()}
        />
      </IntlProviders>,
    );
    expect(screen.getByText(/No tasks are assigned to you right now/i)).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox'));
    expect(setPendingOnly).toHaveBeenCalledWith(false);
  });

  it('shows an error message', () => {
    renderWithRouter(
      <IntlProviders>
        <AssignedTasks isLoading={false} isError pendingOnly setPendingOnly={jest.fn()} />
      </IntlProviders>,
    );
    expect(screen.getByText(/could not be loaded/i)).toBeInTheDocument();
  });
});
