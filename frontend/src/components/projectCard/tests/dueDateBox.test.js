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
    const { container } = render(
      <ReduxIntlProviders>
        <DueDateBox dueDate={sixDaysOut} />
      </ReduxIntlProviders>,
    );
    expect(container.querySelectorAll('span')[0].className).toContain('fr');
    expect(container.querySelectorAll('span')[0].className).not.toContain('fl');
    expect(screen.getByText('6 days left')).toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('with tooltip message', () => {
    // five days of milliseconds plus a few seconds for the test
    const fiveDaysOut = 5 * 86400 * 1000 + 10000 + Date.now();
    const { container } = render(
      <ReduxIntlProviders>
        <DueDateBox dueDate={fiveDaysOut} align="left" tooltipMsg="Tooltip works" />
      </ReduxIntlProviders>,
    );
    expect(screen.queryByText('Tooltip works')).not.toBeInTheDocument();
    userEvent.hover(screen.getByText('5 days left'));
    expect(screen.getByText('Tooltip works')).toBeInTheDocument();
    expect(container.querySelectorAll('span')[0].className).toContain('fl');
    expect(container.querySelectorAll('span')[0].className).toContain('bg-grey-light blue-grey');
    expect(container.querySelectorAll('span')[0].className).not.toContain('fr');
    expect(container.querySelectorAll('span')[0].className).not.toContain('bg-red white fw6');
  });

  it('relative date formatting in English', () => {
    const { container } = render(
      <ReduxIntlProviders>
        <DueDateBox dueDate={1000 * 540 + Date.now()} intervalMili={true} />
      </ReduxIntlProviders>,
    );
    expect(container.querySelectorAll('span')[0].className).toContain('fr');
    expect(container.querySelectorAll('span')[0].className).toContain('bg-red white fw6');
    expect(container.querySelectorAll('span')[0].className).not.toContain('fl');
    expect(container.querySelectorAll('span')[0].className).not.toContain(
      'bg-grey-light blue-grey',
    );
    expect(screen.getByText('9 minutes left')).toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument();
  });
});
