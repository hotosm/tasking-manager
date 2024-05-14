import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';

import { IntlProviders, renderWithRouter } from '../../../utils/testWithIntl';
import { userTasks } from '../../../network/tests/mockData/tasksStats';
import { TaskResults, TaskCards } from '../taskResults';
import messages from '../messages';

describe('Task Results Component', () => {
  it('should display loading indicator when tasks are loading', () => {
    const { container } = renderWithRouter(
      <IntlProviders>
        <TaskResults state={{ isLoading: true }} />
      </IntlProviders>,
    );
    expect(container.getElementsByClassName('show-loading-animation')[0]).toBeInTheDocument();
  });

  it('should prompt user to retry on failure to fetch tasks', async () => {
    const retryFnMock = jest.fn();
    const { user } = renderWithRouter(
      <IntlProviders>
        <TaskResults state={{ isError: true, isLoading: false, tasks: [] }} retryFn={retryFnMock} />
      </IntlProviders>,
    );
    expect(screen.getByText(messages.errorLoadingTasks.defaultMessage)).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', {
      name: messages.retry.defaultMessage,
    });
    expect(retryBtn).toBeInTheDocument();
    await user.click(retryBtn);
    expect(retryFnMock).toHaveBeenCalled();
  });

  it('should display pagination details', () => {
    renderWithRouter(
      <IntlProviders>
        <TaskResults state={{ ...userTasks, isLoading: false, isError: false }} />
      </IntlProviders>,
    );
    expect(screen.getByText(`Showing 10 of 4,476`)).toBeInTheDocument();
  });

  it('should display fetched tasks', () => {
    renderWithRouter(
      <IntlProviders>
        <TaskResults state={{ ...userTasks, isLoading: false }} />
      </IntlProviders>,
    );
    expect(screen.getAllByRole('article').length).toBe(userTasks.tasks.length);
    expect(
      screen.getByRole('heading', {
        name: `Task #${userTasks.tasks[0].taskId} · Project #${userTasks.tasks[0].projectId}`,
      }),
    ).toBeInTheDocument();
  });
});

describe('TaskCards Component', () => {
  it('should display no contributions text if user has no tasks available', () => {
    renderWithRouter(
      <IntlProviders>
        <TaskCards pageOfCards={[]} />
      </IntlProviders>,
    );
    expect(screen.getByText(messages.noContributed.defaultMessage)).toBeInTheDocument();
  });

  it('should display passed page of tasks into TaskCard', () => {
    renderWithRouter(
      <IntlProviders>
        <TaskCards pageOfCards={userTasks.tasks} />
      </IntlProviders>,
    );
    expect(screen.getAllByRole('article').length).toBe(userTasks.tasks.length);
  });
});
