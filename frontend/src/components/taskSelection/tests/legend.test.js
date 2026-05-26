import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ReduxIntlProviders } from '../../../utils/testWithIntl';
import { TasksMapLegend } from '../legend';
import userEvent from '@testing-library/user-event';

test('Legend collapse / expand when clicking', async () => {
  const user = userEvent.setup();
  render(
    <ReduxIntlProviders>
      <TasksMapLegend />
    </ReduxIntlProviders>,
  );

  // Legend title is present and all items are visible initially
  expect(screen.getByText('Legend')).toBeInTheDocument();
  expect(screen.getByText('Available for mapping')).toBeInTheDocument();
  expect(screen.getByText('Ready for validation')).toBeInTheDocument();
  expect(screen.getByText('Unavailable')).toBeInTheDocument();
  expect(screen.getByText('Priority areas')).toBeInTheDocument();
  expect(screen.getByText('More mapping needed')).toBeInTheDocument();
  expect(screen.getByText('Finished')).toBeInTheDocument();
  expect(screen.getByText('Locked')).toBeInTheDocument();

  // Clicking the legend title collapses the items
  await user.click(screen.getByText('Legend'));
  expect(screen.queryByText('Available for mapping')).not.toBeInTheDocument();

  // Clicking again expands the items
  await user.click(screen.getByText('Legend'));
  expect(screen.getByText('Available for mapping')).toBeInTheDocument();
});
