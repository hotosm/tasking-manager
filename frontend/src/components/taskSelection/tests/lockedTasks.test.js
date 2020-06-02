import React from 'react';
import TestRenderer from 'react-test-renderer';

import {
  LockedTaskModalContent,
  SameProjectLock,
  AnotherProjectLock,
  LicenseError,
  JosmError,
  LockError,
} from '../lockedTasks';
import { createComponentWithReduxAndIntl } from '../../../utils/testWithIntl';
import { store } from '../../../store';

describe('test LockedTaskModalContent', () => {
  const { act } = TestRenderer;
  it('return SameProjectLock message', () => {
    act(() => {
      store.dispatch({ type: 'SET_PROJECT', project: 1 });
      store.dispatch({ type: 'SET_LOCKED_TASKS', tasks: [21] });
      store.dispatch({ type: 'SET_TASKS_STATUS', status: 'LOCKED_FOR_MAPPING' });
    });
    const instance = createComponentWithReduxAndIntl(
      <LockedTaskModalContent project={{ projectId: 1 }} error={null} />,
    );
    const element = instance.root;
    expect(element.findByType(SameProjectLock)).toBeTruthy();
  });

  it('return SameProjectLock message', () => {
    act(() => {
      store.dispatch({ type: 'SET_PROJECT', project: 2 });
      store.dispatch({ type: 'SET_LOCKED_TASKS', tasks: [21] });
      store.dispatch({ type: 'SET_TASKS_STATUS', status: 'LOCKED_FOR_MAPPING' });
    });
    const instance = createComponentWithReduxAndIntl(
      <LockedTaskModalContent project={{ projectId: 1 }} error={null} />,
    );
    const element = instance.root;
    expect(element.findByType(AnotherProjectLock)).toBeTruthy();
  });

  it('return LicenseError message', () => {
    act(() => {
      store.dispatch({ type: 'SET_PROJECT', project: null });
      store.dispatch({ type: 'SET_LOCKED_TASKS', tasks: [] });
      store.dispatch({ type: 'SET_TASKS_STATUS', status: null });
    });
    const instance = createComponentWithReduxAndIntl(
      <LockedTaskModalContent project={{ projectId: 1, licenseId: 123 }} error={'Conflict'} />,
    );
    const element = instance.root;
    expect(element.findByType(LicenseError)).toBeTruthy();
  });

  it('return JosmError message', () => {
    act(() => {
      store.dispatch({ type: 'SET_PROJECT', project: null });
      store.dispatch({ type: 'SET_LOCKED_TASKS', tasks: [] });
      store.dispatch({ type: 'SET_TASKS_STATUS', status: null });
    });
    const instance = createComponentWithReduxAndIntl(
      <LockedTaskModalContent project={{ projectId: 1, licenseId: 123 }} error={'JOSM'} />,
    );
    const element = instance.root;
    expect(element.findByType(JosmError)).toBeTruthy();
  });

  it('return LockError message', () => {
    act(() => {
      store.dispatch({ type: 'SET_PROJECT', project: null });
      store.dispatch({ type: 'SET_LOCKED_TASKS', tasks: [] });
      store.dispatch({ type: 'SET_TASKS_STATUS', status: null });
    });
    const instance = createComponentWithReduxAndIntl(
      <LockedTaskModalContent project={{ projectId: 1, licenseId: 123 }} error={'BAD REQUEST'} />,
    );
    const element = instance.root;
    expect(element.findByType(LockError)).toBeTruthy();
  });
});
