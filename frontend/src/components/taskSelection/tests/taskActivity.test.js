import React from 'react';
import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ReduxIntlProviders, renderWithRouter } from '../../../utils/testWithIntl';
import { TaskHistory } from '../taskActivity';

describe('TaskHistory', () => {
  let history = {
    taskId: 15,
    projectId: 2,
    taskStatus: 'INVALIDATED',
    taskHistory: [
      {
        historyId: 7,
        taskId: 15,
        action: 'STATE_CHANGE',
        actionText: 'INVALIDATED',
        actionDate: Date.now() - 1e3 * 51, // subtracting a random number less than 60 seconds for '1 minute ago' text
        actionBy: 'User01',
      },
      {
        historyId: 6,
        taskId: 15,
        action: 'COMMENT',
        actionText: 'missing buildings',
        actionDate: Date.now() - 1e3 * 60 * 60,
        actionBy: 'User01',
      },
      {
        historyId: 5,
        taskId: 15,
        action: 'LOCKED_FOR_VALIDATION',
        actionText: '00:04:39.104987',
        actionDate: Date.now() - 1e3 * 60 * 60 * 2,
        actionBy: 'User01',
      },
    ],
    taskAnnotation: [],
    perTaskInstructions: 'Per task instructions',
    autoUnlockSeconds: 7200,
    lastUpdated: Date.now() - 1e3 * 60 * 60,
    numberOfComments: null,
  };
  it('renders the task history comments and activities for a given project', async () => {
    const { user } = renderWithRouter(
      <ReduxIntlProviders>
        <TaskHistory projectId={2} taskId={15} commentPayload={history} />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText(/Comments/)).toBeInTheDocument();
    expect(screen.getByText(/Activities/)).toBeInTheDocument();
    expect(screen.getByText(/All/)).toBeInTheDocument();

    // retrieve radio buttons
    const historyRadioButtons = screen.getAllByRole('radio'); //3 radio options: Comments, Activities and All

    expect(historyRadioButtons[0]).toBeChecked(); // initial value of 'Comments' radio option is checked
    expect(historyRadioButtons[1]).not.toBeChecked(); // initial value of 'Activities' radio option is unchecked
    expect(historyRadioButtons[2]).not.toBeChecked(); // initial value of 'All' radio option is unchecked
    expect(screen.getByText('commented 1 hour ago')).toBeInTheDocument();
    expect(screen.getByText('missing buildings')).toBeInTheDocument();
    expect(
      screen.queryByText('marked as more mapping needed 1 minute ago'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('locked for validation 2 hours ago')).not.toBeInTheDocument();

    await user.click(historyRadioButtons[1]); // check activities radio option
    expect(historyRadioButtons[0]).not.toBeChecked();
    expect(historyRadioButtons[2]).not.toBeChecked();
    expect(screen.getByText('marked as more mapping needed 1 minute ago')).toBeInTheDocument();
    expect(screen.getByText('locked for validation 2 hours ago')).toBeInTheDocument();
    expect(screen.queryByText('commented 1 hour ago')).not.toBeInTheDocument();
    expect(screen.queryByText('missing buildings')).not.toBeInTheDocument();

    await user.click(historyRadioButtons[2]); // check All radio option
    expect(historyRadioButtons[0]).not.toBeChecked();
    expect(historyRadioButtons[1]).not.toBeChecked();
    expect(screen.getByText('marked as more mapping needed 1 minute ago')).toBeInTheDocument();
    expect(screen.getByText('locked for validation 2 hours ago')).toBeInTheDocument();
    expect(screen.getByText('commented 1 hour ago')).toBeInTheDocument();
    expect(screen.getByText('missing buildings')).toBeInTheDocument();
  });

  it('does not render any task history when not provided', async () => {
    let history = {
      taskId: 15,
      projectId: 2,
      taskStatus: 'INVALIDATED',
    };
    const { user } = renderWithRouter(
      <ReduxIntlProviders>
        <TaskHistory projectId={2} taskId={15} commentPayload={history} />
      </ReduxIntlProviders>,
    );

    expect(screen.getByText(/Comments/)).toBeInTheDocument();
    expect(screen.getByText(/Activities/)).toBeInTheDocument();
    expect(screen.getByText(/All/)).toBeInTheDocument();

    const historyRadioButtons = screen.getAllByRole('radio'); //3 radio options: Comments, Activities and All

    expect(historyRadioButtons[0]).toBeChecked(); // Comments radio option
    expect(historyRadioButtons[1]).not.toBeChecked();
    expect(historyRadioButtons[2]).not.toBeChecked();

    await user.click(historyRadioButtons[1]); // check activities radio option
    expect(historyRadioButtons[0]).not.toBeChecked();
    expect(historyRadioButtons[2]).not.toBeChecked();

    await user.click(historyRadioButtons[2]); // check All radio option
    expect(historyRadioButtons[0]).not.toBeChecked();
    expect(historyRadioButtons[1]).not.toBeChecked();
  });
});
