import React from 'react';
import { Provider } from 'react-redux';
import { renderHook, act } from '@testing-library/react';

import { store } from '../../store';
import { useEditTeamAllowed } from '../UsePermissions';

describe('test edit team permissions based on role', () => {
  const team = { teamId: 1, organisation_id: 1, members: [] };
  it('ADMIN users can edit any team', () => {
    const userDetails = { username: 'admin_user', role: 'ADMIN' };
    act(() => {
      store.dispatch({ type: 'SET_USER_DETAILS', userDetails: userDetails });
    });
    const wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;
    const { result } = renderHook(() => useEditTeamAllowed(team), { wrapper });
    const [userCanEditTeam] = result.current;
    expect(userCanEditTeam).toEqual(true);
  });

  it('NON admin users can NOT edit a team', () => {
    const userDetails = { username: 'another user', role: 'MAPPER' };
    act(() => {
      store.dispatch({ type: 'SET_USER_DETAILS', userDetails: userDetails });
    });
    const wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;
    const { result } = renderHook(() => useEditTeamAllowed(team), { wrapper });
    const [userCanEditTeam] = result.current;
    expect(userCanEditTeam).toEqual(false);
  });
});

describe('test edit team permissions based on manager permissions', () => {
  const team = {
    teamId: 1,
    organisation_id: 1,
    members: [{ username: 'test', function: 'MANAGER', active: true }],
  };
  it('team manager CAN edit it - verify based on redux store', () => {
    act(() => {
      store.dispatch({ type: 'SET_PM_TEAMS', teams: [1, 2, 3] });
    });
    const wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;
    const { result } = renderHook(() => useEditTeamAllowed(team), { wrapper });
    const [userCanEditTeam] = result.current;
    expect(userCanEditTeam).toEqual(true);
  });

  it('team manager CAN edit it - verify based on team members', () => {
    const userDetails = { username: 'test', role: 'MAPPER' };
    act(() => {
      store.dispatch({ type: 'SET_PM_TEAMS', teams: [] });
      store.dispatch({ type: 'SET_USER_DETAILS', userDetails: userDetails });
    });
    const wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;
    const { result } = renderHook(() => useEditTeamAllowed(team), { wrapper });
    const [userCanEditTeam] = result.current;
    expect(userCanEditTeam).toEqual(true);
  });

  it('MAPPER can not edit it - verify based on team members', () => {
    const userDetails = { username: 'another_user', role: 'MAPPER' };
    act(() => {
      store.dispatch({ type: 'SET_PM_TEAMS', teams: [] });
      store.dispatch({ type: 'SET_USER_DETAILS', userDetails: userDetails });
    });
    const wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;
    const { result } = renderHook(() => useEditTeamAllowed(team), { wrapper });
    const [userCanEditTeam] = result.current;
    expect(userCanEditTeam).toEqual(false);
  });

  it('user that is NOT a team manager can not edit it', () => {
    act(() => {
      store.dispatch({ type: 'SET_PM_TEAMS', teams: [2, 3] });
    });
    const wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;
    const { result } = renderHook(() => useEditTeamAllowed(team), { wrapper });
    const [userCanEditTeam] = result.current;
    expect(userCanEditTeam).toEqual(false);
  });
});

describe('test edit team permissions based on organisations', () => {
  const team = { teamId: 1, organisation_id: 1, members: [] };
  it('manager of organisation associated with team can edit it', () => {
    act(() => {
      store.dispatch({ type: 'SET_ORGANISATIONS', organisations: [1, 2, 3] });
    });
    const wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;
    const { result } = renderHook(() => useEditTeamAllowed(team), { wrapper });
    const [userCanEditTeam] = result.current;
    expect(userCanEditTeam).toEqual(true);
  });

  it('manager of organisation NOT associated with team can NOT edit it', () => {
    act(() => {
      store.dispatch({ type: 'SET_ORGANISATIONS', organisations: [2, 3] });
    });
    const wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;
    const { result } = renderHook(() => useEditTeamAllowed(team), { wrapper });
    const [userCanEditTeam] = result.current;
    expect(userCanEditTeam).toEqual(false);
  });
});
