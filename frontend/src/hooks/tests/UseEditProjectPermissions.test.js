import { Provider } from 'react-redux';
import { renderHook, act } from '@testing-library/react';

import { store } from '../../store';
import { useEditProjectAllowed } from '../UsePermissions';

describe('test edit project permissions based on role', () => {
  const project = { teams: [], organisation: 1, author: 'test' };
  it('ADMIN users can edit any project', () => {
    const userDetails = { role: 'ADMIN' };
    act(() => {
      store.dispatch({ type: 'SET_USER_DETAILS', userDetails: userDetails });
    });
    const wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;
    const { result } = renderHook(() => useEditProjectAllowed(project), { wrapper });
    const [userCanEditProject] = result.current;
    expect(userCanEditProject).toEqual(true);
  });

  it('MAPPER users can NOT edit a project', () => {
    const userDetails = { username: 'map_user', role: 'MAPPER' };
    act(() => {
      store.dispatch({ type: 'SET_USER_DETAILS', userDetails: userDetails });
    });
    const wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;
    const { result } = renderHook(() => useEditProjectAllowed(project), { wrapper });
    const [userCanEditProject] = result.current;
    expect(userCanEditProject).toEqual(false);
  });
});

describe('test edit project permissions based on username and project owner', () => {
  const project = { teams: [], organisation: 1, author: 'test_user' };
  it('owner can edit their project', () => {
    act(() => {
      store.dispatch({ type: 'SET_USER_DETAILS', userDetails: { username: 'test_user' } });
    });
    const wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;
    const { result } = renderHook(() => useEditProjectAllowed(project), { wrapper });
    const [userCanEditProject] = result.current;
    expect(userCanEditProject).toEqual(true);
  });

  it('user that is not owner can NOT edit the project', () => {
    act(() => {
      store.dispatch({ type: 'SET_USER_DETAILS', userDetails: { username: 'user' } });
    });
    const wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;
    const { result } = renderHook(() => useEditProjectAllowed(project), { wrapper });
    const [userCanEditProject] = result.current;
    expect(userCanEditProject).toEqual(false);
  });
});

describe('test edit project permissions based on teams', () => {
  it('Project manager of team NOT associated with project can NOT edit it', () => {
    act(() => {
      store.dispatch({ type: 'SET_PM_TEAMS', teams: [1, 2, 3] });
    });
    const wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;
    const { result } = renderHook(
      () => useEditProjectAllowed({ teams: [{ teamId: 1, role: 'MAPPER' }], author: 'test' }),
      { wrapper },
    );
    const [userCanEditProject] = result.current;
    expect(userCanEditProject).toEqual(false);
  });

  it('Project manager of team NOT associated with project can NOT edit it', () => {
    act(() => {
      store.dispatch({ type: 'SET_PM_TEAMS', teams: [1, 2, 3] });
    });
    const wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;
    const { result } = renderHook(
      () =>
        useEditProjectAllowed({ teams: [{ teamId: 7, role: 'PROJECT_MANAGER' }], author: 'test' }),
      { wrapper },
    );
    const [userCanEditProject] = result.current;
    expect(userCanEditProject).toEqual(false);
  });

  it('Project manager of team associated with project can edit it', () => {
    act(() => {
      store.dispatch({ type: 'SET_PM_TEAMS', teams: [1, 2, 3] });
    });
    const wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;
    const { result } = renderHook(
      () =>
        useEditProjectAllowed({ teams: [{ teamId: 1, role: 'PROJECT_MANAGER' }], author: 'test' }),
      { wrapper },
    );
    const [userCanEditProject] = result.current;
    expect(userCanEditProject).toEqual(true);
  });
});

describe('test edit project permissions based on organisations', () => {
  it('manager of organisation associated with project can edit it', () => {
    act(() => {
      store.dispatch({ type: 'SET_ORGANISATIONS', organisations: [1, 2, 3] });
    });
    const wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;
    const { result } = renderHook(
      () => useEditProjectAllowed({ teams: [], organisation: 1, author: 'test' }),
      { wrapper },
    );
    const [userCanEditProject] = result.current;
    expect(userCanEditProject).toEqual(true);
  });

  it('manager of organisation NOT associated with project can NOT edit it', () => {
    act(() => {
      store.dispatch({ type: 'SET_ORGANISATIONS', organisations: [1, 2, 3] });
    });
    const wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;
    const { result } = renderHook(
      () => useEditProjectAllowed({ teams: [], organisation: 7, author: 'test' }),
      { wrapper },
    );
    const [userCanEditProject] = result.current;
    expect(userCanEditProject).toEqual(false);
  });

  it('user that is NOT a manager of any organisation can NOT edit projects', () => {
    act(() => {
      store.dispatch({ type: 'SET_ORGANISATIONS', organisations: [] });
    });
    const wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;
    const { result } = renderHook(
      () => useEditProjectAllowed({ teams: [], organisation: 7, author: 'test' }),
      { wrapper },
    );
    const [userCanEditProject] = result.current;
    expect(userCanEditProject).toEqual(false);
  });

  it('project that is not associated with org can not be edited by a user that is not ', () => {
    act(() => {
      store.dispatch({ type: 'SET_ORGANISATIONS', organisations: [] });
    });
    const wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;
    const { result } = renderHook(
      () => useEditProjectAllowed({ teams: [], organisation: null, author: 'test' }),
      { wrapper },
    );
    const [userCanEditProject] = result.current;
    expect(userCanEditProject).toEqual(false);
  });
});
