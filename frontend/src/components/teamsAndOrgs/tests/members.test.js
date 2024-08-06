import '@testing-library/jest-dom';
import React from 'react';
import { Provider } from 'react-redux';
import { screen } from '@testing-library/react';

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
  const element = createComponentWithIntl(
    <MemoryRouter>
      <Provider store={store}>
        <JoinRequests requests={requests} managers={[]} />
      </Provider>
    </MemoryRouter>,
  );
  const testInstance = element.root;
  it('initial div has the correct classes', () => {
    expect(testInstance.findAllByType('div')[0].props.className).toBe(
      'bg-white b--grey-light pa4 ba blue-dark',
    );
  });
  it('h3 element has the correct title', () => {
    expect(testInstance.findByType('h3').children[0].props.id).toBe(
      'management.teams.join_requests',
    );
  });
  it('number of UserAvatar components is correct', () => {
    expect(testInstance.findAllByType(UserAvatar).length).toBe(2);
  });
  it('Accept and Deny buttons are present', () => {
    expect(testInstance.findAllByType(Button).length).toBe(4);
    expect(testInstance.findAllByProps({ className: 'pr2 blue-dark bg-white' }).length).toBe(2);
    expect(testInstance.findAllByProps({ className: 'pr2 bg-red white' }).length).toBe(2);
  });
  it('no requests message is NOT present', () => {
    expect(() =>
      testInstance
        .findByProps({ className: 'tc' })
        .toThrow(new Error('No instances found with props: {className: "tc"}')),
    );
  });
});

describe('test JoinRequest list without requests', () => {
  const element = createComponentWithIntl(
    <MemoryRouter>
      <Provider store={store}>
        <JoinRequests requests={[]} managers={[]} />
      </Provider>
    </MemoryRouter>,
  );
  const testInstance = element.root;
  it('initial div has the correct classes', () => {
    expect(testInstance.findAllByType('div')[0].props.className).toBe(
      'bg-white b--grey-light pa4 ba blue-dark',
    );
  });
  it('h3 element has the correct title', () => {
    expect(testInstance.findByType('h3').children[0].props.id).toBe(
      'management.teams.join_requests',
    );
  });
  it('number of UserAvatar components is correct', () => {
    expect(() =>
      testInstance
        .findAllByType(UserAvatar)
        .toThrow(new Error('No instances found with node type: "UserAvatar"')),
    );
  });
  it('Accept and Deny buttons are present', () => {
    expect(() =>
      testInstance
        .findAllByType(Button)
        .toThrow(new Error('No instances found with node type: "Button"')),
    );
    expect(() =>
      testInstance
        .findAllByProps({ className: 'pr2 blue-dark bg-white' })
        .toThrow(new Error('No instances found with props: {className: "pr2 blue-dark bg-white"}')),
    );
    expect(() =>
      testInstance
        .findAllByProps({ className: 'pr2 bg-red white' })
        .toThrow(new Error('No instances found with props: {className: "pr2 bg-red white"}')),
    );
  });
  it('no requests message is present', () => {
    expect(testInstance.findByProps({ className: 'tc mt3' }).children[0].props.id).toBe(
      'management.teams.join_requests.empty',
    );
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
    const mockRemoveMembers = jest.fn();
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
