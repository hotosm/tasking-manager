import { Provider } from 'react-redux';
import { act, render, screen } from '@testing-library/react';
import messages from '../messages';
import { usersList } from '../../../network/tests/mockData/userList';
import { store } from '../../../store';
import {
  createComponentWithIntl,
  renderWithRouter,
  ReduxIntlProviders,
} from '../../../utils/testWithIntl';
import { JoinRequests, Members } from '../members';
import { UserAvatar } from '../../user/avatar';
import { Button } from '../../button';
import { MemoryRouter } from 'react-router-dom';

describe('test JoinRequest list', () => {
  const requests = [
    {
      username: 'test_1',
      function: 'MANAGER',
      active: false,
      pictureUrl: 'https://www.gravatar.com/avatar.png',
    },
    { username: 'test_2', function: 'MEMBER', active: false, pictureUrl: null },
  ];
  act(() => {
    store.dispatch({
      type: 'SET_USER_DETAILS',
      userDetails: { username: 'somebody' },
    });
  });
  const setup = () => renderWithRouter(
    <ReduxIntlProviders>
      <JoinRequests requests={requests} managers={[]} />
    </ReduxIntlProviders>,
  );
  it('initial div has the correct classes', () => {
    const { container } = setup();
    expect(container.querySelector('div')).toHaveClass('bg-white b--grey-light pa4 ba blue-dark');
  });
  it('h3 element has the correct title', () => {
    setup();
    expect(screen.getByText(messages.joinRequests.defaultMessage)).toBeInTheDocument();
  });
  it('number of UserAvatar components is correct', () => {
    setup();
    expect(screen.getAllByRole("link")).toHaveLength(4);
  });
  it('Accept and Deny buttons are present', () => {
    const { container } = setup();
    expect(screen.getAllByRole("button")).toHaveLength(5);
    expect(container.querySelectorAll('.pr2.blue-dark.bg-white')).toHaveLength(2);
    expect(container.querySelectorAll('.pr2.bg-red.white')).toHaveLength(2);
  });
  it('no requests message is NOT present', () => {
    setup();
    expect(screen.queryByText(messages.noRequests.defaultMessage)).not.toBeInTheDocument();
  });
});

describe('test JoinRequest list without requests', () => {
  act(() => {
    store.dispatch({
      type: 'SET_USER_DETAILS',
      userDetails: { username: 'somebody' },
    });
  });
  const setup = () => renderWithRouter(
    <ReduxIntlProviders>
      <JoinRequests requests={[]} managers={[]} />
    </ReduxIntlProviders>,
  );
  it('initial div has the correct classes', () => {
    const { container } = setup();
    expect(container.querySelector('div')).toHaveClass('bg-white b--grey-light pa4 ba blue-dark');
  });
  it('h3 element has the correct title', () => {
    setup();
    expect(screen.getByText(messages.joinRequests.defaultMessage)).toBeInTheDocument();
  });
  it('number of UserAvatar components is correct', () => {
    setup();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
  it('Accept and Deny buttons are present', () => {
    const { container } = setup();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(container.querySelectorAll('.pr2.blue-dark.bg-white')).toHaveLength(0);
    expect(container.querySelectorAll('.pr2.bg-red.white')).toHaveLength(0);
  });
  it('no requests message is present', () => {
    setup();
    expect(screen.getByText(messages.noRequests.defaultMessage)).toBeInTheDocument();
  });
});

describe('Members Component', () => {
  it('should display no members when no members are present', () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <Members members={[]} />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText(messages.noMembers.defaultMessage)).toBeInTheDocument();
  });

  it('should display actionable buttons when edit button is clicked', async () => {
    const { user } = renderWithRouter(
      <ReduxIntlProviders>
        <Members members={[]} />
      </ReduxIntlProviders>,
    );
    await user.click(screen.getByRole('button', { name: messages.edit.defaultMessage }));
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: messages.edit.defaultMessage }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: messages.cancel.defaultMessage }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: messages.done.defaultMessage })).toBeInTheDocument();
  });

  it('should not display cross icon with only one member present', async () => {
    const mockRemoveMembers = vi.fn();
    const { user, container } = renderWithRouter(
      <ReduxIntlProviders>
        <Members members={[usersList.users[0]]} removeMembers={mockRemoveMembers} />
      </ReduxIntlProviders>,
    );
    await user.click(screen.getByRole('button', { name: messages.edit.defaultMessage }));
    // Matching with that one SVG being displayed from the react-select
    expect(container.querySelectorAll('svg').length).toBe(1);
  });
});
