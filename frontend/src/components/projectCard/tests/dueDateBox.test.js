import React from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
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

  it('with tooltip message', () => {
    // five days of milliseconds plus a few seconds for the test
    const fiveDaysOut = 5 * 86400 * 1000 + 10000 + Date.now();
    const { container } = render(
      <ReduxIntlProviders>
        <DueDateBox dueDate={fiveDaysOut} tooltipMsg="Tooltip works" />
      </ReduxIntlProviders>,
    );
    expect(screen.queryByText('Tooltip works')).not.toBeInTheDocument();
    userEvent.hover(screen.getByText('5 days left'));
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
});
