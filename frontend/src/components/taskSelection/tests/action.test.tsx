import '@testing-library/jest-dom';
import { act, screen, waitFor, within } from '@testing-library/react';

import { getProjectSummary } from '../../../network/tests/mockData/projects';
import { userMultipleLockedTasksDetails } from '../../../network/tests/mockData/userStats';
import { setupFaultyHandlers } from '../../../network/tests/server';
import tasksGeojson from '../../../utils/tests/snippets/tasksGeometry';
import {
  QueryClientProviders,
  ReduxIntlProviders,
  renderWithRouter,
} from '../../../utils/testWithIntl';
import { TaskMapAction } from '../action';
import messages from '../messages';

const setup = () => {
  return {
    ...renderWithRouter(
      <QueryClientProviders>
        <ReduxIntlProviders>
          <TaskMapAction
            project={getProjectSummary(123)}
            projectIsReady
            tasks={tasksGeojson}
            activeTasks={userMultipleLockedTasksDetails.tasks}
            action="VALIDATION"
          />
        </ReduxIntlProviders>
      </QueryClientProviders>,
    ),
  };
};

describe('Task Map Action', () => {
  it('should display JOSM error', async () => {
    setupFaultyHandlers();
    const { user } = setup();
    await user.click(
      screen.getByRole('button', {
        name: /iD Editor/i,
      }),
    );
    await user.click(screen.getByText('JOSM'));
    await waitFor(() =>
      expect(
        screen.getByRole('heading', {
          name: messages.JOSMError.defaultMessage,
        }),
      ).toBeInTheDocument(),
    );
    await user.click(
      screen.getByRole('button', {
        name: /close/i,
      }),
    );
    expect(
      screen.queryByRole('heading', {
        name: messages.JOSMError.defaultMessage,
      }),
    ).not.toBeInTheDocument();
  });

  it('should expand accordition to view task details', async () => {
    const { user } = setup();
    await user.click(
      screen.getByRole('button', {
        name: /history/i,
      }),
    );
    await user.click(
      screen.getByRole('button', {
        name: 'Task 1765',
      }),
    );
    expect(screen.getByRole('radio', { name: /comments/i })).toBeChecked();
  });
});

describe('Session Expire Dialogs', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(async () => {
    await act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
  });

  it('should display modal to notify user session about to expire', async () => {
    setup();
    await act(() => jest.advanceTimersByTime(6900000));
    const extendSessionDialog = screen.getByRole('dialog');
    expect(within(extendSessionDialog).getByRole('heading')).toHaveTextContent(
      messages.sessionAboutToExpireTitle.defaultMessage,
    );
  });

  it('should display modal to notify user session has ended', async () => {
    setup();
    await act(() => jest.advanceTimersByTime(7200000));
    const extendSessionDialog = screen.getByRole('dialog');
    expect(within(extendSessionDialog).getByRole('heading')).toHaveTextContent(
      messages.sessionExpiredTitle.defaultMessage,
    );
  });
});
