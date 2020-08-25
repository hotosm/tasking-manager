import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ReduxIntlProviders } from '../../../utils/testWithIntl';
import { TasksMapLegend } from '../legend';

test('Legend collapse / expand when clicking', () => {
  render(
    <ReduxIntlProviders>
      <TasksMapLegend />
    </ReduxIntlProviders>,
  );

  expect(screen.getByText('Legend').className).toBe('fw6 pointer f4 ttu barlow-condensed mt0 mb2');
  expect(screen.getByText('Available for mapping')).toBeInTheDocument();
  expect(screen.getByText('Ready for validation')).toBeInTheDocument();
  expect(screen.getByText('Unavailable')).toBeInTheDocument();
  expect(screen.getByText('Priority areas')).toBeInTheDocument();
  expect(screen.getByText('More mapping needed')).toBeInTheDocument();
  expect(screen.getByText('Finished')).toBeInTheDocument();
  expect(screen.getByText('Locked')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Legend'));
  expect(screen.queryByText('Available for mapping')).not.toBeInTheDocument();
  fireEvent.click(screen.getByText('Legend'));
  expect(screen.getByText('Available for mapping')).toBeInTheDocument();
});
