import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { ReduxIntlProviders } from '../../../utils/testWithIntl';
import { TaskCard } from '../taskCard';

describe('TaskCard', () => {
  it('on MAPPED state', () => {
    render(
      <ReduxIntlProviders>
        <TaskCard
          taskId={987}
          projectId={4321}
          taskStatus={'MAPPED'}
          lockHolder={null}
          taskHistory={[]}
          lastUpdated={'2021-01-22T12:59:37.238281Z'}
        />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('Task #987 · Project #4321')).toBeInTheDocument();
    expect(screen.getByText(/Last updated/)).toBeInTheDocument();
    expect(screen.getByText('Ready for validation')).toBeInTheDocument();
    expect(screen.queryByText('Resume task')).not.toBeInTheDocument();
    // hovering on the card should not change anything
    userEvent.hover(screen.getByText('Ready for validation'));
    expect(screen.queryByText('Resume task')).not.toBeInTheDocument();
  });

  it('on VALIDATED state', () => {
    render(
      <ReduxIntlProviders>
        <TaskCard
          taskId={987}
          projectId={4321}
          taskStatus={'VALIDATED'}
          lockHolder={null}
          taskHistory={[]}
          lastUpdated={'2021-01-22T12:59:37.238281Z'}
        />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('Finished')).toBeInTheDocument();
    expect(screen.queryByText('Resume task')).not.toBeInTheDocument();
    // hovering on the card should not change anything
    userEvent.hover(screen.getByText('Finished'));
    expect(screen.queryByText('Resume task')).not.toBeInTheDocument();
  });

  it('on BADIMAGERY state', () => {
    render(
      <ReduxIntlProviders>
        <TaskCard
          taskId={987}
          projectId={4321}
          taskStatus={'BADIMAGERY'}
          lockHolder={null}
          taskHistory={[]}
          lastUpdated={'2021-01-22T12:59:37.238281Z'}
        />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
    expect(screen.queryByText('Resume task')).not.toBeInTheDocument();
    // hovering on the card should not change anything
    userEvent.hover(screen.getByText('Unavailable'));
    expect(screen.queryByText('Resume task')).not.toBeInTheDocument();
  });

  it('on LOCKED_FOR_VALIDATION state', () => {
    const { container } = render(
      <ReduxIntlProviders>
        <TaskCard
          taskId={987}
          projectId={4321}
          taskStatus={'LOCKED_FOR_VALIDATION'}
          lockHolder={'user_1'}
          taskHistory={[]}
          lastUpdated={'2021-01-22T12:59:37.238281Z'}
        />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('Locked for validation by user_1')).toBeInTheDocument();
    expect(screen.queryByText('Resume task')).not.toBeInTheDocument();
    // hovering on the card should show the resume task button
    userEvent.hover(screen.getByText('Locked for validation by user_1'));
    expect(screen.getByText('Resume task')).toBeInTheDocument();
    expect(container.querySelectorAll('a')[1].href).toContain('/projects/4321/tasks?search=987');
  });

  it('on INVALIDATED state', () => {
    render(
      <ReduxIntlProviders>
        <TaskCard
          taskId={987}
          projectId={4321}
          taskStatus={'INVALIDATED'}
          taskHistory={[]}
          lastUpdated={'2021-01-22T12:59:37.238281Z'}
        />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('More mapping needed')).toBeInTheDocument();
    expect(screen.queryByText('Resume task')).not.toBeInTheDocument();
    // hovering on the card should show the resume task button
    userEvent.hover(screen.getByText('More mapping needed'));
    expect(screen.getByText('Resume task')).toBeInTheDocument();
  });

  it('on READY state', () => {
    const { container } = render(
      <ReduxIntlProviders>
        <TaskCard
          taskId={543}
          projectId={9983}
          taskStatus={'READY'}
          lockHolder={null}
          taskHistory={[]}
          lastUpdated={'2021-01-22T12:59:37.238281Z'}
        />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('Task #543 · Project #9983')).toBeInTheDocument();
    expect(screen.getByText(/Last updated/)).toBeInTheDocument();
    expect(screen.getByText('Available for mapping')).toBeInTheDocument();
    expect(screen.queryByText('Resume task')).not.toBeInTheDocument();
    // hover on the card
    userEvent.hover(screen.getByText('Available for mapping'));
    expect(screen.getByText('Resume task')).toBeInTheDocument();
    expect(screen.getByText('Resume task').className).toBe(
      'dn dib-l link pv2 ph3 mh3 mv1 bg-red white f7 fr',
    );
    expect(container.querySelectorAll('a')[1].href).toContain('/projects/9983/tasks?search=543');
    // unhover
    userEvent.unhover(screen.getByText('Available for mapping'));
    expect(screen.queryByText('Resume task')).not.toBeInTheDocument();
  });
});
