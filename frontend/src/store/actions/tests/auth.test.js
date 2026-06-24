import {
  clearUserDetails,
  updateUserEmail,
  logout,
  updateUserDetails,
  updateOSMInfo,
  updateOrgsInfo,
  updatePMsTeams,
  updateTMsTeams,
  updateToken,
  updateSession,
  setAuthDetails,
  setUserDetails,
  getUserDetails,
  pushUserDetails,
  setSandboxToken,
  clearSandboxToken,
  setSandboxAuthError,
  initiateSandboxAuth,
  completeSandboxAuth,
  getSandboxAuthToken,
  setSandboxAuthStatus,
  types
} from '../auth';

import { setItem, removeItem, getItem } from '../../../utils/safe_storage';
import { pushToLocalJSONAPI, fetchLocalJSONAPI } from '../../../network/genericJSONRequest';
import {
  createSandboxSession,
  getOSMAuthorizationUrl,
  getSandboxToken,
  isTokenValid,
} from '../../../utils/sandboxUtils';

jest.mock('../../../utils/safe_storage', () => ({
  setItem: jest.fn(),
  removeItem: jest.fn(),
  getItem: jest.fn(),
}));

jest.mock('../../../network/genericJSONRequest', () => ({
  pushToLocalJSONAPI: jest.fn(),
  fetchLocalJSONAPI: jest.fn(),
}));

jest.mock('../../../utils/sandboxUtils', () => ({
  createSandboxSession: jest.fn(),
  getOSMAuthorizationUrl: jest.fn(),
  getSandboxToken: jest.fn(),
  isTokenValid: jest.fn(),
}));

describe('Auth Actions', () => {
  let dispatch;
  let getState;

  beforeEach(() => {
    dispatch = jest.fn();
    getState = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('clearUserDetails returns correct action', () => {
    expect(clearUserDetails()).toEqual({ type: types.CLEAR_SESSION });
  });

  it('updateUserDetails returns correct action', () => {
    const userDetails = { name: 'Test' };
    expect(updateUserDetails(userDetails)).toEqual({
      type: types.SET_USER_DETAILS,
      userDetails,
    });
  });

  it('updateOSMInfo returns correct action', () => {
    const osm = { id: 1 };
    expect(updateOSMInfo(osm)).toEqual({ type: types.SET_OSM, osm });
  });

  it('updateOrgsInfo returns correct action', () => {
    const orgs = [1, 2];
    expect(updateOrgsInfo(orgs)).toEqual({ type: types.SET_ORGANISATIONS, organisations: orgs });
  });

  it('updatePMsTeams returns correct action', () => {
    const teams = [1];
    expect(updatePMsTeams(teams)).toEqual({ type: types.SET_PM_TEAMS, teams });
  });

  it('updateTMsTeams returns correct action', () => {
    const teams = [2];
    expect(updateTMsTeams(teams)).toEqual({ type: types.SET_TM_TEAMS, teams });
  });

  it('updateToken returns correct action', () => {
    const token = 'token';
    expect(updateToken(token)).toEqual({ type: types.SET_TOKEN, token });
  });

  it('updateSession returns correct action', () => {
    const session = { active: true };
    expect(updateSession(session)).toEqual({ type: types.SET_SESSION, session });
  });

  it('setSandboxToken returns correct action', () => {
    expect(setSandboxToken('sandbox', { token: 'abc' })).toEqual({
      type: types.SET_SANDBOX_TOKEN,
      sandbox: 'sandbox',
      tokenData: { token: 'abc' },
    });
  });

  it('clearSandboxToken returns correct action', () => {
    expect(clearSandboxToken('sandbox')).toEqual({
      type: types.CLEAR_SANDBOX_TOKEN,
      sandbox: 'sandbox',
    });
  });

  it('setSandboxAuthError returns correct action', () => {
    expect(setSandboxAuthError('error')).toEqual({
      type: types.SET_SANDBOX_AUTH_ERROR,
      error: 'error',
    });
  });

  it('setSandboxAuthStatus returns correct action', () => {
    expect(setSandboxAuthStatus('sandbox', 'success')).toEqual({
      type: types.SET_SANDBOX_AUTH_STATUS,
      sandbox: 'sandbox',
      status: 'success',
    });
  });

  it('logout removes items from storage and clears user details', () => {
    logout()(dispatch);
    expect(removeItem).toHaveBeenCalledWith('username');
    expect(removeItem).toHaveBeenCalledWith('token');
    expect(removeItem).toHaveBeenCalledWith('action');
    expect(removeItem).toHaveBeenCalledWith('osm_oauth_token');
    expect(removeItem).toHaveBeenCalledWith('tasksSortOrder');
    expect(dispatch).toHaveBeenCalledWith(clearUserDetails());
  });

  it('updateUserEmail calls API and dispatches updated details', async () => {
    pushToLocalJSONAPI.mockResolvedValueOnce({});
    const userDetails = { emailAddress: 'test@example.com', name: 'Test' };
    
    await updateUserEmail(userDetails, 'token', ['emailAddress'])(dispatch);
    
    expect(pushToLocalJSONAPI).toHaveBeenCalledWith(
      'users/me/actions/set-user/',
      JSON.stringify({ emailAddress: 'test@example.com' }),
      'token',
      'PATCH'
    );
    expect(dispatch).toHaveBeenCalledWith({
      type: types.SET_USER_DETAILS,
      userDetails,
    });
  });

  it('setAuthDetails sets storage items and dispatches token/session', () => {
    setAuthDetails('user', 'token', 'oauth')(dispatch);
    expect(setItem).toHaveBeenCalledWith('token', btoa('token'));
    expect(setItem).toHaveBeenCalledWith('username', 'user');
    expect(setItem).toHaveBeenCalledWith('osm_oauth_token', 'oauth');
    expect(dispatch).toHaveBeenCalledWith(updateToken(btoa('token')));
    expect(dispatch).toHaveBeenCalledWith(updateSession({ osm_oauth_token: 'oauth' }));
  });

  it('setUserDetails fetches user info and dispatches actions', async () => {
    fetchLocalJSONAPI.mockImplementation((url) => {
      if (url.includes('openstreetmap')) return Promise.resolve({ osmId: 1 });
      if (url.includes('queries')) return Promise.resolve({ id: 1, username: 'test' });
      if (url.includes('organisations')) return Promise.resolve({ organisations: [{ organisationId: 1 }] });
      if (url.includes('team_role=PROJECT_MANAGER')) return Promise.resolve({ teams: [{ teamId: 1 }] });
      if (url.includes('manager=')) return Promise.resolve({ teams: [{ teamId: 2 }] });
      return Promise.reject(new Error('Not found'));
    });

    await setUserDetails('test', 'token')(dispatch);

    expect(dispatch).toHaveBeenCalledWith(updateOSMInfo({ osmId: 1 }));
    expect(dispatch).toHaveBeenCalledWith(updateUserDetails({ id: 1, username: 'test' }));
    expect(dispatch).toHaveBeenCalledWith(updateOrgsInfo([1]));
    expect(dispatch).toHaveBeenCalledWith(updatePMsTeams([1]));
    expect(dispatch).toHaveBeenCalledWith(updateTMsTeams([2]));
  });

  it('setUserDetails handles API errors gracefully', async () => {
    fetchLocalJSONAPI.mockImplementation((url) => {
      if (url.includes('queries')) return Promise.reject(new Error('InvalidToken'));
      return Promise.reject(new Error('Error'));
    });

    await setUserDetails('test', 'token')(dispatch);
    // InvalidToken error should trigger logout
    expect(removeItem).toHaveBeenCalled(); // via logout
  });

  it('getUserDetails gets details if username exists in state', () => {
    getState.mockReturnValue({ auth: { userDetails: { username: 'test' }, token: 'token' } });
    getUserDetails(getState())(dispatch);
    // This will dispatch setUserDetails thunk
    expect(dispatch).toHaveBeenCalled();
  });

  it('pushUserDetails updates user details and fetches new state', async () => {
    getItem.mockReturnValue('test');
    pushToLocalJSONAPI.mockResolvedValueOnce({});
    
    await pushUserDetails({ name: 'new name' }, 'token', true)(dispatch);
    
    expect(pushToLocalJSONAPI).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalled();
  });

  describe('Sandbox Actions', () => {
    it('initiateSandboxAuth blocks if in_progress', async () => {
      getState.mockReturnValue({ auth: { sandboxAuthStatus: { sandbox1: 'in_progress' } } });
      const result = await initiateSandboxAuth('sandbox1', 'url')(dispatch, getState);
      expect(result).toBeNull();
      expect(dispatch).not.toHaveBeenCalledWith(setSandboxAuthStatus('sandbox1', 'in_progress'));
    });

    it('initiateSandboxAuth creates session and redirects', async () => {
      delete window.location;
      window.location = { href: '' };
      getState.mockReturnValue({ auth: { sandboxAuthStatus: {} } });
      createSandboxSession.mockResolvedValue({ id: 'session1' });
      getOSMAuthorizationUrl.mockReturnValue('http://auth.url');

      const result = await initiateSandboxAuth('sandbox1', 'url')(dispatch, getState);
      
      expect(dispatch).toHaveBeenCalledWith(setSandboxAuthStatus('sandbox1', 'in_progress'));
      expect(createSandboxSession).toHaveBeenCalledWith('sandbox1', 'url');
      expect(window.location.href).toBe('http://auth.url');
      expect(result).toEqual({ id: 'session1' });
    });

    it('initiateSandboxAuth handles error', async () => {
      getState.mockReturnValue({ auth: {} });
      createSandboxSession.mockRejectedValue(new Error('Failed'));

      const result = await initiateSandboxAuth('sandbox1', 'url')(dispatch, getState);
      
      expect(dispatch).toHaveBeenCalledWith(setSandboxAuthStatus('sandbox1', 'failed'));
      expect(dispatch).toHaveBeenCalledWith(setSandboxAuthError('Failed'));
      expect(result).toBeNull();
    });

    it('completeSandboxAuth fetches token and stores it', async () => {
      getSandboxToken.mockResolvedValue({ access_token: 'token1', expires_in: 3600 });
      Date.now = jest.fn(() => 1000000);

      const result = await completeSandboxAuth('session1', 'sandbox1')(dispatch);
      
      expect(dispatch).toHaveBeenCalledWith(setSandboxAuthStatus('sandbox1', 'in_progress'));
      expect(getSandboxToken).toHaveBeenCalledWith('session1');
      expect(setItem).toHaveBeenCalled();
      expect(dispatch).toHaveBeenCalledWith(setSandboxAuthStatus('sandbox1', 'success'));
      expect(result.access_token).toBe('token1');
    });

    it('completeSandboxAuth handles failure', async () => {
      getSandboxToken.mockRejectedValue(new Error('Token fetch failed'));

      await expect(completeSandboxAuth('session1', 'sandbox1')(dispatch)).rejects.toThrow('Token fetch failed');
      expect(dispatch).toHaveBeenCalledWith(setSandboxAuthStatus('sandbox1', 'failed'));
      expect(dispatch).toHaveBeenCalledWith(setSandboxAuthError('Token fetch failed'));
    });

    it('getSandboxAuthToken returns stored valid token', async () => {
      getItem.mockReturnValue(JSON.stringify({ access_token: 'token1' }));
      isTokenValid.mockReturnValue(true);

      const result = await getSandboxAuthToken('sandbox1', 'url')(dispatch);
      
      expect(dispatch).toHaveBeenCalledWith(setSandboxToken('sandbox1', { access_token: 'token1' }));
      expect(result.access_token).toBe('token1');
    });

    it('getSandboxAuthToken clears expired token and initiates auth', async () => {
      getItem.mockReturnValue(JSON.stringify({ access_token: 'token1' }));
      isTokenValid.mockReturnValue(false);
      getState.mockReturnValue({ auth: {} });

      await getSandboxAuthToken('sandbox1', 'url')(dispatch, getState);
      
      expect(removeItem).toHaveBeenCalledWith('sandbox_token_sandbox1');
      expect(dispatch).toHaveBeenCalledWith(clearSandboxToken('sandbox1'));
      // Since initiateSandboxAuth is a thunk, we expect dispatch to have been called with it
      expect(dispatch).toHaveBeenCalled();
    });
  });
});
