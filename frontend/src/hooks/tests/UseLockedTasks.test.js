import React from 'react';
import { Provider } from 'react-redux';
import { renderHook, act } from '@testing-library/react-hooks';

import { store } from '../../store';
import { useGetLockedTasks } from '../UseLockedTasks';

describe('test if useGetLockedTasks', () => {
  it('when initialized return null and empty values', () => {
    const wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;
    const { result } = renderHook(() => useGetLockedTasks(), { wrapper });
    const lockedTasks = result.current;
    expect(lockedTasks.get('project')).toEqual(null);
    expect(lockedTasks.get('tasks')).toStrictEqual([]);
    expect(lockedTasks.get('status')).toEqual(null);
  });

  it('after updating the redux state return the correct value', () => {
    act(() => {
      store.dispatch({ type: 'SET_PROJECT', project: 1 });
      store.dispatch({ type: 'SET_LOCKED_TASKS', tasks: [21] });
      store.dispatch({ type: 'SET_TASKS_STATUS', status: 'LOCKED_FOR_MAPPING' });
    });
    const wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;
    const { result } = renderHook(() => useGetLockedTasks(), { wrapper });
    const lockedTasks = result.current;
    expect(lockedTasks.get('project')).toEqual(1);
    expect(lockedTasks.get('tasks')).toStrictEqual([21]);
    expect(lockedTasks.get('status')).toEqual('LOCKED_FOR_MAPPING');
  });
});
