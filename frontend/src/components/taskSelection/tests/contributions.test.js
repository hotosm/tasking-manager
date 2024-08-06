import React from 'react';
import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import selectEvent from 'react-select-event';

import { ReduxIntlProviders, renderWithRouter } from '../../../utils/testWithIntl';
import { tasks } from '../../../network/tests/mockData/taskGrid';
import { projectContributions } from '../../../network/tests/mockData/contributions';
import Contributions from '../contributions';

describe('Contributions', () => {
  const selectTask = jest.fn();

  it('render users, links and ', async () => {
    const { user, container } = renderWithRouter(
      <ReduxIntlProviders>
        <Contributions
          project={{ projectId: 1, osmchaFilterId: 'abc1234' }}
          tasks={tasks}
          contribsData={projectContributions.userContributions}
          activeUser={null}
          activeStatus={null}
          selectTask={selectTask}
        />
      </ReduxIntlProviders>,
    );
    // render user list with correct user link
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('test_1').href).toContain('/users/test_1');
    expect(screen.getByText('user_3')).toBeInTheDocument();
    expect(screen.getByText('user_4')).toBeInTheDocument();
    expect(screen.getByText('user_5').href).toContain('/users/user_5');
    // render links
    expect(screen.getByText('Statistics')).toBeInTheDocument();
    expect(screen.getAllByRole('link')[0].href).toContain('/projects/1/stats/');
    expect(screen.getByText('Changesets')).toBeInTheDocument();
    expect(screen.getAllByRole('link')[1].href).toBe('https://osmcha.org/?aoi=abc1234');
    // clicking on the number of tasks trigger selectTask
    await user.click(screen.getAllByText('5')[0]);
    expect(selectTask).toHaveBeenLastCalledWith([1, 3, 5, 7], 'ALL', 'test');
    await user.click(screen.getAllByText('5')[1]);
    expect(selectTask).toHaveBeenLastCalledWith([5, 36, 99, 115, 142], 'MAPPED', 'test_1');
    // filter ADVANCED users
    await selectEvent.select(container.querySelectorAll('input')[0], 'Advanced');
    expect(screen.queryByText('user_3')).not.toBeInTheDocument();
    expect(screen.getByText('test')).toBeInTheDocument();
    // filter INTERMEDIATE users
    await selectEvent.select(container.querySelectorAll('input')[0], 'Intermediate');
    expect(screen.getByText('user_3')).toBeInTheDocument();
    expect(screen.getByText('user_4')).toBeInTheDocument();
    expect(screen.queryByText('test')).not.toBeInTheDocument();
    // filter by username
    await selectEvent.select(container.querySelectorAll('input')[1], 'user_3');
    expect(screen.queryByText('user_4')).not.toBeInTheDocument();
    // filter BEGINNER users
    await selectEvent.select(container.querySelectorAll('input')[0], 'Beginner');
    expect(screen.queryByText('user_3')).not.toBeInTheDocument();
    expect(screen.queryByText('user_4')).not.toBeInTheDocument();
    expect(screen.getByText('test_1')).toBeInTheDocument();
    expect(screen.getByText('user_5')).toBeInTheDocument();
    // filter by NEWUSER
    await selectEvent.select(container.querySelectorAll('input')[0], 'New users');
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.queryByText('user_3')).not.toBeInTheDocument();
    expect(screen.queryByText('user_4')).not.toBeInTheDocument();
    expect(screen.queryByText('user_5')).not.toBeInTheDocument();
    expect(screen.queryByText('test_1')).not.toBeInTheDocument();
  });
  it('clean user selection if we click on the selected tasks of the user', async () => {
    const { user, container } = renderWithRouter(
      <ReduxIntlProviders>
        <Contributions
          project={{ projectId: 1, osmchaFilterId: 'abc1234' }}
          tasks={tasks}
          contribsData={projectContributions.userContributions}
          activeUser={'test_1'}
          activeStatus={'MAPPED'}
          selectTask={selectTask}
        />
      </ReduxIntlProviders>,
    );
    expect(container.querySelector('div.b--blue-dark')).toBeInTheDocument();
    await user.click(screen.getAllByText('5')[1]);
    expect(selectTask).toHaveBeenLastCalledWith([]);
  });
});
