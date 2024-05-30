import React from 'react';
import { Provider } from 'react-redux';
import { renderHook, act } from '@testing-library/react-hooks';

import { store } from '../../store';
import { useEditOrgAllowed } from '../UsePermissions';

describe('test edit organisation permissions based on role', () => {
  const org = { organisationId: 1, managers: [{ username: 'test' }] };
  it('ADMIN users can edit any organisation', () => {
    const userDetails = { username: 'admin_user', role: 'ADMIN' };
    act(() => {
      store.dispatch({ type: 'SET_USER_DETAILS', userDetails: userDetails });
    });
    const wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;
    const { result } = renderHook(() => useEditOrgAllowed(org), { wrapper });
    const [userCanEditOrg] = result.current;
    expect(userCanEditOrg).toEqual(true);
  });

  it('NON admin users can NOT edit a organisation', () => {
    const userDetails = { username: 'another user', role: 'MAPPER' };
    act(() => {
      store.dispatch({ type: 'SET_USER_DETAILS', userDetails: userDetails });
    });
    const wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;
    const { result } = renderHook(() => useEditOrgAllowed(org), { wrapper });
    const [userCanEditOrg] = result.current;
    expect(userCanEditOrg).toEqual(false);
  });
});

describe('test edit permissions based on organisation managers data', () => {
  const org = { organisationId: 1, managers: [{ username: 'test' }] };
  it('user that is included on the managers of the organisation CAN edit it', () => {
    const userDetails = { username: 'test', role: 'MAPPER' };
    act(() => {
      store.dispatch({ type: 'SET_ORGANISATIONS', organisations: [2, 3] });
      store.dispatch({ type: 'SET_USER_DETAILS', userDetails: userDetails });
    });
    const wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;
    const { result } = renderHook(() => useEditOrgAllowed(org), { wrapper });
    const [userCanEditOrg] = result.current;
    expect(userCanEditOrg).toEqual(true);
  });

  it('user that is NOT included on the managers of the organisation can NOT edit it', () => {
    const userDetails = { username: 'another user', role: 'MAPPER' };
    act(() => {
      store.dispatch({ type: 'SET_ORGANISATIONS', organisations: [2, 3] });
      store.dispatch({ type: 'SET_USER_DETAILS', userDetails: userDetails });
    });
    const wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;
    const { result } = renderHook(() => useEditOrgAllowed(org), { wrapper });
    const [userCanEditOrg] = result.current;
    expect(userCanEditOrg).toEqual(false);
  });
});

describe('test edit permissions based on organisations redux store data', () => {
  const org = { organisationId: 1, managers: [{ username: 'test' }] };
  it('organisation manager CAN edit it', () => {
    act(() => {
      store.dispatch({ type: 'SET_ORGANISATIONS', organisations: [1, 2, 3] });
    });
    const wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;
    const { result } = renderHook(() => useEditOrgAllowed(org), { wrapper });
    const [userCanEditOrg] = result.current;
    expect(userCanEditOrg).toEqual(true);
  });

  it('user that is not an organisation manager can NOT edit it', () => {
    act(() => {
      store.dispatch({ type: 'SET_ORGANISATIONS', organisations: [2, 3] });
    });
    const wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;
    const { result } = renderHook(() => useEditOrgAllowed(org), { wrapper });
    const [userCanEditOrg] = result.current;
    expect(userCanEditOrg).toEqual(false);
  });
});
