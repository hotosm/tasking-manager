import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ReduxIntlProviders } from '../../../utils/testWithIntl';
import { tasksStats } from '../../../network/tests/mockData/tasksStats';
import { TasksStatsSummary } from '../tasksStatsSummary';

test('TasksStatsSummary renders the correct values and labels', () => {
  render(
    <ReduxIntlProviders>
      <TasksStatsSummary stats={tasksStats.taskStats} />
    </ReduxIntlProviders>,
  );
  expect(screen.getByText('165')).toBeInTheDocument();
  expect(screen.getByText('Tasks mapped')).toBeInTheDocument();
  expect(screen.getByText('46')).toBeInTheDocument();
  expect(screen.getByText('Tasks validated')).toBeInTheDocument();
  expect(screen.getByText('211')).toBeInTheDocument();
  expect(screen.getByText('Completed actions')).toBeInTheDocument();
});
