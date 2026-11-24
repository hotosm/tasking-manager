import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';

import { NotificationCard } from '../notificationCard';
import { filters } from '../inboxNav';
import { ReduxIntlProviders, renderWithRouter } from '../../../utils/testWithIntl';
import { notifications } from '../../../network/tests/mockData/notifications';

describe('Task assignment notifications', () => {
  it('renders the task assignment message type label', () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <NotificationCard
          {...notifications.userMessages[0]}
          messageType="TASK_ASSIGNMENT_NOTIFICATION"
          selected={[]}
          retryFn={jest.fn()}
        />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('Task assignment')).toBeInTheDocument();
  });

  it('includes task assignments (type 12) in the tasks inbox filter', () => {
    const tasksFilter = filters.find((filter) => filter.messageId === 'tasks');
    expect(tasksFilter.isActiveConstraint).toContain('12');
    expect(tasksFilter.to).toContain('types=8,4,5,12');
  });
});
