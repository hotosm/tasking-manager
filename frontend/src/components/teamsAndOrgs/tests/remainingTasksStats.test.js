import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ReduxIntlProviders } from '../../../utils/testWithIntl';
import { RemainingTasksStats } from '../remainingTasksStats';

test('RemainingTasksStats renders the correct values and labels', () => {
  const tasks = {
    ready: 100,
    lockedForMapping: 2,
    lockedForValidation: 5,
    mapped: 17,
    validated: 23,
    invalidated: 9,
    badImagery: 7,
  };
  render(
    <ReduxIntlProviders>
      <RemainingTasksStats tasks={tasks} />
    </ReduxIntlProviders>,
  );
  expect(screen.getByText('111')).toBeInTheDocument();
  expect(screen.getByText('Tasks to be mapped')).toBeInTheDocument();
  expect(screen.getByText('22')).toBeInTheDocument();
  expect(screen.getByText('Ready for validation')).toBeInTheDocument();
  expect(screen.getByText('244')).toBeInTheDocument();
  expect(screen.getByText('Actions needed')).toBeInTheDocument();
});
