import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ReduxIntlProviders } from '../../../utils/testWithIntl';
import { tasksStats } from '../../../network/tests/mockData/tasksStats';
import { TasksStats } from '../tasksStats';
import userEvent from '@testing-library/user-event';

// This is a late import in a React.lazy call; it takes awhile for date-fns to resolve, so we import it here manually.
// In the event you remove it, please measure test times before ''and'' after removal.
import '../../../utils/chart';

jest.mock('react-chartjs-2', () => ({
  Bar: () => null,
}));

describe('TasksStats', () => {
  const setQuery = jest.fn();
  const retryFn = jest.fn();
  it('render basic elements', async () => {
    render(
      <ReduxIntlProviders>
        <TasksStats
          stats={tasksStats.taskStats}
          query={{ startDate: null, endDate: null, campaign: null, location: null }}
        />
      </ReduxIntlProviders>,
    );
    // wait for useTagAPI to act on the states
    expect(
      await screen.findByRole('group', {
        name: 'Campaign',
      }),
    );
    expect(screen.getByText('From')).toBeInTheDocument();
    expect(screen.getByText('To')).toBeInTheDocument();
    expect(
      screen.getByRole('group', {
        name: 'Campaign',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('group', {
        name: 'Location',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('165')).toBeInTheDocument();
    expect(screen.getByText('Tasks mapped')).toBeInTheDocument();
    expect(screen.getByText('46')).toBeInTheDocument();
    expect(screen.getByText('Tasks validated')).toBeInTheDocument();
    expect(screen.getByText('211')).toBeInTheDocument();
    expect(screen.getByText('Completed actions')).toBeInTheDocument();
  });

  it('load correct query values', async () => {
    const { container } = render(
      <ReduxIntlProviders>
        <TasksStats
          stats={tasksStats.taskStats}
          setQuery={setQuery}
          query={{ startDate: '2020-04-05', endDate: '2021-01-01', campaign: null, location: null }}
        />
      </ReduxIntlProviders>,
    );
    expect(
      await screen.findByRole('group', {
        name: 'Campaign',
      }),
    ).toBeInTheDocument();
    const startDateInput = container.querySelectorAll('input')[0];
    const endDateInput = container.querySelectorAll('input')[1];
    expect(startDateInput.placeholder).toBe('Click to select a start date');
    expect(startDateInput.value).toBe('2020-04-05');
    expect(endDateInput.placeholder).toBe('Click to select an end date');
    expect(endDateInput.value).toBe('2021-01-01');
  });

  it('show error message if date range exceeds the maximum value', async () => {
    render(
      <ReduxIntlProviders>
        <TasksStats
          stats={tasksStats.taskStats}
          setQuery={setQuery}
          query={{ startDate: '2019-04-05', endDate: null, campaign: null, location: null }}
          error={true}
        />
      </ReduxIntlProviders>,
    );
    expect(
      await screen.findByRole('group', {
        name: 'Campaign',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('An error occurred while loading stats.')).toBeInTheDocument();
    expect(screen.getByText('Date range is longer than one year.')).toBeInTheDocument();
  });

  it('show error message if start date is after end date', async () => {
    render(
      <ReduxIntlProviders>
        <TasksStats
          stats={tasksStats.taskStats}
          setQuery={setQuery}
          query={{ startDate: '2019-04-05', endDate: '2018-08-05', campaign: null, location: null }}
          error={true}
        />
      </ReduxIntlProviders>,
    );
    expect(
      await screen.findByRole('group', {
        name: 'Campaign',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('An error occurred while loading stats.')).toBeInTheDocument();
    expect(screen.getByText('Start date should not be later than end date.')).toBeInTheDocument();
  });

  it('render "Try again" button case the error is not on the dates', async () => {
    const user = userEvent.setup();
    render(
      <ReduxIntlProviders>
        <TasksStats
          stats={tasksStats.taskStats}
          setQuery={setQuery}
          query={{ startDate: '2020-04-05', endDate: '2021-01-01', campaign: null, location: null }}
          error={true}
          retryFn={retryFn}
        />
      </ReduxIntlProviders>,
    );
    expect(
      await screen.findByRole('group', {
        name: 'Campaign',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('An error occurred while loading stats.')).toBeInTheDocument();
    expect(screen.getByText('Try again')).toBeInTheDocument();
    await user.click(screen.getByText('Try again'));
    expect(retryFn).toHaveBeenCalled();
  });
});
