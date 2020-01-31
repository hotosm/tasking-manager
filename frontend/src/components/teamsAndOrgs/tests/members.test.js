import React from 'react';
import { Provider } from 'react-redux';

import { store } from '../../../store';
import { createComponentWithIntl } from '../../../utils/testWithIntl';
import { JoinRequests } from '../members';
import { UserAvatar } from '../../user/avatar';
import { Button } from '../../button';

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
    <Provider store={store}>
      <JoinRequests requests={requests} />
    </Provider>,
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
    <Provider store={store}>
      <JoinRequests requests={[]} />
    </Provider>,
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
    expect(testInstance.findByProps({ className: 'tc' }).children[0].props.id).toBe(
      'management.teams.join_requests.empty',
    );
  });
});
