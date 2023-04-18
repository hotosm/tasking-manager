import '@testing-library/jest-dom';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { setupFaultyHandlers } from '../../../network/tests/server';
import { store } from '../../../store';
import { DeleteNotificationsButton } from '../deleteNotificationsButton';
import { ReduxIntlProviders } from '../../../utils/testWithIntl';

describe('DeleteNotificationsButton', () => {
  let selected = [];
  const setSelected = (list) => (selected = list);
  const myMock = jest.fn();
  it('does not render button if selected is empty', () => {
    render(
      <ReduxIntlProviders>
        <DeleteNotificationsButton
          selected={selected}
          setSelected={setSelected}
          retryFn={() => myMock()}
        />
      </ReduxIntlProviders>,
    );
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('is disabled if token is null', () => {
    render(
      <ReduxIntlProviders>
        <DeleteNotificationsButton
          selected={[1, 2, 3]}
          setSelected={setSelected}
          retryFn={() => myMock()}
        />
      </ReduxIntlProviders>,
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('makes selected an empty array, call retryFn and hides itself after click', async () => {
    act(() => {
      selected = [1, 2, 3];
      store.dispatch({ type: 'SET_TOKEN', token: '123456' });
    });
    render(
      <ReduxIntlProviders>
        <DeleteNotificationsButton
          selected={selected}
          setSelected={setSelected}
          retryFn={() => myMock()}
          unreadCountInSelected={2}
        />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('Delete').className).toContain('bg-red white');
    expect(screen.getByText('Delete')).toBeEnabled();
    fireEvent.click(screen.getByText('Delete'));
    await waitFor(() => expect(myMock).toHaveBeenCalledTimes(1));
    expect(selected).toEqual([]);
  });

  it('should catch error on deletion error', async () => {
    const setSelectedMock = jest.fn();
    setupFaultyHandlers();
    render(
      <ReduxIntlProviders>
        <DeleteNotificationsButton
          selected={[1, 2]}
          setSelected={setSelectedMock}
          retryFn={() => myMock()}
          unreadCountInSelected={2}
        />
      </ReduxIntlProviders>,
    );
    await userEvent.click(
      screen.getByRole('button', {
        name: /delete/i,
      }),
    );
    // Error is then consoled
  });
});
