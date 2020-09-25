import React from 'react';
import { Provider } from 'react-redux';
import { IntlProvider } from 'react-intl';
import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import '@testing-library/jest-dom';

import { store } from '../../../store';
import { DeleteNotificationsButton } from '../deleteNotificationsButton';

describe('DeleteNotificationsButton', () => {
  let selected = [];
  const setSelected = (list) => (selected = list);
  const myMock = jest.fn();
  it('does not render button if selected is empty', () => {
    render(
      <Provider store={store}>
        <IntlProvider locale="en">
          <DeleteNotificationsButton
            selected={selected}
            setSelected={setSelected}
            retryFn={() => myMock()}
          />
        </IntlProvider>
      </Provider>,
    );
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });
  it('is disabled if token is null', () => {
    render(
      <Provider store={store}>
        <IntlProvider locale="en">
          <DeleteNotificationsButton
            selected={[1, 2, 3]}
            setSelected={setSelected}
            retryFn={() => myMock()}
          />
        </IntlProvider>
      </Provider>,
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });
  it('makes selected an empty array, call retryFn and hides itself after click', async () => {
    act(() => {
      selected = [1, 2, 3];
      store.dispatch({ type: 'SET_TOKEN', token: '123456' });
    });
    render(
      <Provider store={store}>
        <IntlProvider locale="en">
          <DeleteNotificationsButton
            selected={selected}
            setSelected={setSelected}
            retryFn={() => myMock()}
          />
        </IntlProvider>
      </Provider>,
    );
    expect(screen.getByText('Delete').className).toContain('bg-red white');
    expect(screen.getByText('Delete')).toBeEnabled();
    fireEvent.click(screen.getByText('Delete'));
    await waitFor(() => expect(myMock).toHaveBeenCalledTimes(1));
    expect(selected).toEqual([]);
    waitForElementToBeRemoved(screen.queryByText('Delete'))
      .then(() => expect(screen.queryByText('Delete')).not.toBeInTheDocument())
      .catch((err) => console.log(err));
  });
});
