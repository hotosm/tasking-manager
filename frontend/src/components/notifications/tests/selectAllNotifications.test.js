import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SelectAllNotifications } from '../selectAllNotifications';
import { IntlProviders } from '../../../utils/testWithIntl';

describe('Action Buttons (Mark as read and Deletion)', () => {
  it('should select all notifications under a category', async () => {
    const setIsAllSelectedMock = jest.fn();
    const user = userEvent.setup();
    render(
      <IntlProviders>
        <SelectAllNotifications setIsAllSelected={setIsAllSelectedMock} />
      </IntlProviders>,
    );
    await user.click(
      screen.getByRole('button', {
        name: /select all notifications/i,
      }),
    );
    expect(setIsAllSelectedMock).toHaveBeenCalledWith(true);
  });

  it('should empty selection upon clearing them', async () => {
    const setSelectedMock = jest.fn();
    const user = userEvent.setup();
    render(
      <IntlProviders>
        <SelectAllNotifications isAllSelected setSelected={setSelectedMock} />
      </IntlProviders>,
    );
    await user.click(
      screen.getByRole('button', {
        name: /clear selection/i,
      }),
    );
    expect(setSelectedMock).toHaveBeenCalledWith([]);
  });

  it('should display corresponding message with active category tab', async () => {
    const setSelectedMock = jest.fn();
    render(
      <IntlProviders>
        <SelectAllNotifications
          isAllSelected
          setSelected={setSelectedMock}
          inboxQuery={{ types: [2, 9, 10] }}
          totalNotifications={420}
        />
      </IntlProviders>,
    );
    expect(screen.getByText('All 420 notifications in Projects are selected.')).toBeInTheDocument();
  });

  it('should display corresponding button text with active category tab', async () => {
    const setSelectedMock = jest.fn();
    render(
      <IntlProviders>
        <SelectAllNotifications
          isAllSelected={false}
          setSelected={setSelectedMock}
          inboxQuery={{ types: [2, 9, 10] }}
          totalNotifications={420}
        />
      </IntlProviders>,
    );
    expect(screen.getByRole('button')).toHaveTextContent(
      'Select all 420 notifications in Projects',
    );
  });
});
