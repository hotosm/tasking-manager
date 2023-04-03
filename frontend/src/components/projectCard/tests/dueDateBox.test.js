import React from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { DueDateBox } from '../../../components/projectCard/dueDateBox';
import { ReduxIntlProviders } from '../../../utils/testWithIntl';

describe('test DueDate', () => {
  it('relative date formatting in English', () => {
    // six days of milliseconds plus a few seconds for the test
    const sixDaysOut = 6 * 86400 * 1000 + 10000 + Date.now();
    render(
      <ReduxIntlProviders>
        <DueDateBox dueDate={sixDaysOut} />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('6 days left')).toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('with tooltip message', async () => {
    // five days of milliseconds plus a few seconds for the test
    const fiveDaysOut = 5 * 86400 * 1000 + 10000 + Date.now();
    const user = userEvent.setup();
    const { container } = render(
      <ReduxIntlProviders>
        <DueDateBox dueDate={fiveDaysOut} tooltipMsg="Tooltip works" />
      </ReduxIntlProviders>,
    );
    expect(screen.queryByText('Tooltip works')).not.toBeInTheDocument();
    await user.hover(screen.getByText('5 days left'));
    await waitFor(() => expect(screen.getByText('Tooltip works')).toBeInTheDocument());
    expect(screen.getByText('Tooltip works')).toBeInTheDocument();
    expect(container.querySelectorAll('span')[0].className).toContain('bg-tan blue-grey');
    expect(container.querySelectorAll('span')[0].className).not.toContain('bg-red white fw6');
  });

  it('relative date formatting in English', () => {
    const { container } = render(
      <ReduxIntlProviders>
        <DueDateBox dueDate={1000 * 540 + Date.now()} intervalMili={true} />
      </ReduxIntlProviders>,
    );
    expect(container.querySelectorAll('span')[0].className).toContain('bg-red white');
    expect(container.querySelectorAll('span')[0].className).not.toContain('bg-tan blue-grey');
    expect(screen.getByText('9 minutes left')).toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('renders the appropriate clock timer icon for task status page', () => {
    render(
      <ReduxIntlProviders>
        <DueDateBox dueDate={1000 * 540 + Date.now()} intervalMili={true} isTaskStatusPage />
      </ReduxIntlProviders>,
    );
    // A title tag has been added to the timer svg which we can access
    expect(
      screen.getByRole('img', {
        name: 'Timer',
      }),
    ).toBeInTheDocument();
  });

  it('does not render the clock timer icon for project details', () => {
    render(
      <ReduxIntlProviders>
        <DueDateBox
          dueDate={1000 * 540 + Date.now()}
          intervalMili={true}
          isTaskStatusPage={false}
        />
      </ReduxIntlProviders>,
    );
    expect(
      screen.queryByRole('img', {
        name: 'Timer',
      }),
    ).not.toBeInTheDocument();
  });

  it('should display text when no due date is specified', () => {
    render(
      <ReduxIntlProviders>
        <DueDateBox dueDate={null} isProjectDetailPage />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('No due date specified')).toBeInTheDocument();
  });

  it('should display due date expiration message when due date has expired', () => {
    render(
      <ReduxIntlProviders>
        <DueDateBox dueDate={Date.now() - 1000} isProjectDetailPage />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('Due date expired')).toBeInTheDocument();
  });

  it('should not display messages for pages other than the project detail page', () => {
    render(
      <ReduxIntlProviders>
        <DueDateBox dueDate={Date.now() - 1000} isProjectDetailPage={false} />
      </ReduxIntlProviders>,
    );
    expect(screen.queryByText('Due date expired')).not.toBeInTheDocument();
  });
});
