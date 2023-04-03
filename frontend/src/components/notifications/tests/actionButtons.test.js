import '@testing-library/jest-dom';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { setupFaultyHandlers } from '../../../network/tests/server';
import { store } from '../../../store';
import { ActionButtons } from '../actionButtons';
import { ReduxIntlProviders } from '../../../utils/testWithIntl';

describe('Action Buttons', () => {
  const retryFnMock = jest.fn();
  const setSelectedMock = jest.fn();
  const updateUnreadCountMock = jest.fn();
  it('should return nothing if no notification is selected', () => {
    act(() => {
      store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
    });
    const { container } = render(
      <ReduxIntlProviders>
        <ActionButtons
          inboxQuery={{ types: undefined }}
          selected={[]}
          retryFn={retryFnMock}
          setSelected={setSelectedMock}
          updateUnreadCount={updateUnreadCountMock}
        />
      </ReduxIntlProviders>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('should decrement unread count in redux store if all notifications are not selected upon marking notifications as read', async () => {
    const user = userEvent.setup();
    render(
      <ReduxIntlProviders>
        <ActionButtons
          inboxQuery={{ types: undefined }}
          selected={[1, 2, 3]}
          retryFn={retryFnMock}
          isAllSelected={false}
          setSelected={setSelectedMock}
          updateUnreadCount={updateUnreadCountMock}
          unreadCountInSelected={1}
        />
      </ReduxIntlProviders>,
    );
    await user.click(
      screen.getByRole('button', {
        name: /mark as read/i,
      }),
    );
    await waitFor(() => expect(setSelectedMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(retryFnMock).toHaveBeenCalledTimes(1));
    expect(updateUnreadCountMock).not.toHaveBeenCalled();
  });

  it('should fetch unread count if all notifications are selected upon marking notifications as read', async () => {
    const user = userEvent.setup();
    render(
      <ReduxIntlProviders>
        <ActionButtons
          inboxQuery={{ types: [6, 9] }}
          selected={[1, 2, 3]}
          retryFn={retryFnMock}
          isAllSelected={true}
          setSelected={setSelectedMock}
          updateUnreadCount={updateUnreadCountMock}
        />
      </ReduxIntlProviders>,
    );
    await user.click(
      screen.getByRole('button', {
        name: /mark as read/i,
      }),
    );
    await waitFor(() => expect(setSelectedMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(retryFnMock).toHaveBeenCalledTimes(1));
    expect(updateUnreadCountMock).toHaveBeenCalled();
  });

  it('should decrement unread count in redux store if all notifications are not selected upon deleting notifications', async () => {
    const user = userEvent.setup();
    render(
      <ReduxIntlProviders>
        <ActionButtons
          inboxQuery={{ types: undefined }}
          selected={[1, 2, 3]}
          retryFn={retryFnMock}
          isAllSelected={false}
          setSelected={setSelectedMock}
          updateUnreadCount={updateUnreadCountMock}
          unreadCountInSelected={1}
          pageOfCards={6}
        />
      </ReduxIntlProviders>,
    );
    await user.click(
      screen.getByRole('button', {
        name: /delete/i,
      }),
    );
    await waitFor(() => expect(setSelectedMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(retryFnMock).toHaveBeenCalledTimes(1));
    expect(updateUnreadCountMock).not.toHaveBeenCalled();
  });

  it('should fetch unread count if all notifications are selected upon deleting notifications', async () => {
    const user = userEvent.setup();
    render(
      <ReduxIntlProviders>
        <ActionButtons
          inboxQuery={{ types: [6, 9] }}
          selected={[1, 2, 3]}
          retryFn={retryFnMock}
          isAllSelected={true}
          setSelected={setSelectedMock}
          updateUnreadCount={updateUnreadCountMock}
        />
      </ReduxIntlProviders>,
    );
    await user.click(
      screen.getByRole('button', {
        name: /delete/i,
      }),
    );
    await waitFor(() => expect(setSelectedMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(retryFnMock).toHaveBeenCalledTimes(1));
    expect(updateUnreadCountMock).toHaveBeenCalled();
  });

  // Error are consoled in all cases of POST error
  it('should catch error when marking multiple selected notifications as read', async () => {
    setupFaultyHandlers();
    const user = userEvent.setup();
    render(
      <ReduxIntlProviders>
        <ActionButtons
          inboxQuery={{ types: undefined }}
          selected={[1, 2, 3]}
          retryFn={retryFnMock}
          isAllSelected={false}
          setSelected={setSelectedMock}
          updateUnreadCount={updateUnreadCountMock}
          unreadCountInSelected={1}
        />
      </ReduxIntlProviders>,
    );
    await user.click(
      screen.getByRole('button', {
        name: /mark as read/i,
      }),
    );
    // Error is then consoled
  });

  it('should catch error when marking all notifications in a category as read', async () => {
    setupFaultyHandlers();
    const user = userEvent.setup();
    render(
      <ReduxIntlProviders>
        <ActionButtons
          inboxQuery={{ types: [6, 9] }}
          selected={[1, 2, 3]}
          retryFn={retryFnMock}
          isAllSelected={true}
          setSelected={setSelectedMock}
          updateUnreadCount={updateUnreadCountMock}
        />
      </ReduxIntlProviders>,
    );
    await user.click(
      screen.getByRole('button', {
        name: /mark as read/i,
      }),
    );
    // Error is then consoled
  });

  it('should catch error when deleting multiple selected notifications', async () => {
    act(() => {});
    setupFaultyHandlers();
    const user = userEvent.setup();
    render(
      <ReduxIntlProviders>
        <ActionButtons
          inboxQuery={{ types: undefined }}
          selected={[1, 2, 3]}
          retryFn={retryFnMock}
          isAllSelected={false}
          setSelected={setSelectedMock}
          updateUnreadCount={updateUnreadCountMock}
          unreadCountInSelected={1}
        />
      </ReduxIntlProviders>,
    );
    await user.click(
      screen.getByRole('button', {
        name: /delete/i,
      }),
    );
    // Error is then consoled
  });

  it('should catch error when deleting all notifications in a category', async () => {
    setupFaultyHandlers();
    const user = userEvent.setup();
    render(
      <ReduxIntlProviders>
        <ActionButtons
          inboxQuery={{ types: [6, 9] }}
          selected={[1, 2, 3]}
          retryFn={retryFnMock}
          isAllSelected={true}
          setSelected={setSelectedMock}
          updateUnreadCount={updateUnreadCountMock}
        />
      </ReduxIntlProviders>,
    );
    await user.click(
      screen.getByRole('button', {
        name: /delete/i,
      }),
    );
    // Error is then consoled
  });
});
