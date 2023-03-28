import '@testing-library/jest-dom';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { getProjectSummary } from '../../../network/tests/mockData/projects';
import { userMultipleLockedTasksDetails } from '../../../network/tests/mockData/userStats';
import { setupFaultyHandlers } from '../../../network/tests/server';
import tasksGeojson from '../../../utils/tests/snippets/tasksGeometry';
import { ReduxIntlProviders, renderWithRouter } from '../../../utils/testWithIntl';
import { TaskMapAction } from '../action';
import messages from '../messages';

const setup = () => {
  renderWithRouter(
    <ReduxIntlProviders>
      <TaskMapAction
        project={getProjectSummary(123)}
        projectIsReady
        tasks={tasksGeojson}
        activeTasks={userMultipleLockedTasksDetails.tasks}
        action="VALIDATION"
      />
    </ReduxIntlProviders>,
  );
};

describe('Session Expire Dialogs', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should display modal to notify user session about to expire', async () => {
    setup();
    jest.advanceTimersByTime(6900000);
    const extendSessionDialog = screen.getByRole('dialog');
    expect(within(extendSessionDialog).getByRole('heading')).toHaveTextContent(
      messages.sessionAboutToExpireTitle.defaultMessage,
    );
  });

  it('should display modal to notify user session has ended', async () => {
    setup();
    jest.advanceTimersByTime(7200000);
    const extendSessionDialog = screen.getByRole('dialog');
    expect(within(extendSessionDialog).getByRole('heading')).toHaveTextContent(
      messages.sessionExpiredTitle.defaultMessage,
    );
  });
});
