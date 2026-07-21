import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '../../store';
import {
  useEditProjectAllowed,
  useEditTeamAllowed,
  useEditOrgAllowed,
} from '../UsePermissions';

const wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;

const setUser = ({ role = 'MAPPER', username = 'testuser', organisations = [], pmTeams = [], tmTeams = [] } = {}) => {
  act(() => {
    store.dispatch({ type: 'SET_TOKEN', token: 'tok' });
    store.dispatch({ type: 'SET_USER_DETAILS', userDetails: { id: 1, username, role } });
    if (organisations.length) store.dispatch({ type: 'SET_ORGANISATIONS', organisations });
    if (pmTeams.length) store.dispatch({ type: 'SET_PM_TEAMS', teams: pmTeams });
    if (tmTeams.length) store.dispatch({ type: 'SET_TM_TEAMS', teams: tmTeams });
  });
};

const resetStore = () => {
  act(() => {
    store.dispatch({ type: 'SET_TOKEN', token: null });
    store.dispatch({ type: 'SET_USER_DETAILS', userDetails: { id: null, username: null, role: 'MAPPER' } });
    store.dispatch({ type: 'SET_ORGANISATIONS', organisations: [] });
  });
};

// ─── useEditProjectAllowed ───────────────────────────────────────────────────

describe('useEditProjectAllowed', () => {
  afterEach(() => { resetStore(); jest.clearAllMocks(); });

  it('devuelve true para usuarios ADMIN', async () => {
    setUser({ role: 'ADMIN', username: 'admin' });
    const project = { author: 'other', organisation: 99, teams: [] };
    const { result } = renderHook(() => useEditProjectAllowed(project), { wrapper });

    await act(async () => { await Promise.resolve(); });
    expect(result.current[0]).toBe(true);
  });

  it('devuelve true cuando el usuario es el autor del proyecto', async () => {
    setUser({ role: 'MAPPER', username: 'projectowner' });
    const project = { author: 'projectowner', organisation: 99, teams: [] };
    const { result } = renderHook(() => useEditProjectAllowed(project), { wrapper });

    await act(async () => { await Promise.resolve(); });
    expect(result.current[0]).toBe(true);
  });

  it('devuelve false para MAPPER que no es el autor', () => {
    setUser({ role: 'MAPPER', username: 'stranger' });
    const project = { author: 'someone_else', organisation: 99, teams: [] };
    const { result } = renderHook(() => useEditProjectAllowed(project), { wrapper });
    expect(result.current[0]).toBe(false);
  });

  it('devuelve true cuando el usuario es manager de la organización del proyecto', async () => {
    setUser({ role: 'MAPPER', username: 'orgmgr', organisations: [10] });
    const project = { author: 'other', organisation: 10, teams: [] };
    const { result } = renderHook(() => useEditProjectAllowed(project), { wrapper });

    await act(async () => { await Promise.resolve(); });
    expect(result.current[0]).toBe(true);
  });

  it('devuelve true cuando el usuario está en un equipo PROJECT_MANAGER del proyecto', async () => {
    setUser({ role: 'MAPPER', username: 'teampm', pmTeams: [55] });
    const project = {
      author: 'other',
      organisation: 99,
      teams: [{ teamId: 55, role: 'PROJECT_MANAGER' }],
    };
    const { result } = renderHook(() => useEditProjectAllowed(project), { wrapper });

    await act(async () => { await Promise.resolve(); });
    expect(result.current[0]).toBe(true);
  });

  it('devuelve false cuando el equipo tiene rol MAPPER (no PROJECT_MANAGER)', () => {
    setUser({ role: 'MAPPER', username: 'mapper', pmTeams: [55] });
    const project = {
      author: 'other',
      organisation: 99,
      teams: [{ teamId: 55, role: 'MAPPER' }],
    };
    const { result } = renderHook(() => useEditProjectAllowed(project), { wrapper });
    expect(result.current[0]).toBe(false);
  });

  it('devuelve false cuando project.teams es null', () => {
    setUser({ role: 'MAPPER', username: 'user' });
    const project = { author: 'other', organisation: 99, teams: null };
    const { result } = renderHook(() => useEditProjectAllowed(project), { wrapper });
    expect(result.current[0]).toBe(false);
  });
});

// ─── useEditTeamAllowed ──────────────────────────────────────────────────────

describe('useEditTeamAllowed', () => {
  afterEach(() => { resetStore(); jest.clearAllMocks(); });

  it('devuelve true para ADMIN', async () => {
    setUser({ role: 'ADMIN', username: 'admin' });
    const team = { teamId: 1, organisation_id: 5, members: [] };
    const { result } = renderHook(() => useEditTeamAllowed(team), { wrapper });

    await act(async () => { await Promise.resolve(); });
    expect(result.current[0]).toBe(true);
  });

  it('devuelve false para MAPPER sin relación con el equipo', () => {
    setUser({ role: 'MAPPER', username: 'nobody' });
    const team = { teamId: 99, organisation_id: 5, members: [] };
    const { result } = renderHook(() => useEditTeamAllowed(team), { wrapper });
    expect(result.current[0]).toBe(false);
  });

  it('devuelve true cuando el usuario es MANAGER activo en members', async () => {
    setUser({ role: 'MAPPER', username: 'manager_user' });
    const team = {
      teamId: 10,
      organisation_id: 5,
      members: [{ username: 'manager_user', function: 'MANAGER', active: true }],
    };
    const { result } = renderHook(() => useEditTeamAllowed(team), { wrapper });

    await act(async () => { await Promise.resolve(); });
    expect(result.current[0]).toBe(true);
  });

  it('devuelve false cuando el miembro MANAGER no está activo', () => {
    setUser({ role: 'MAPPER', username: 'inactive_mgr' });
    const team = {
      teamId: 10,
      organisation_id: 5,
      members: [{ username: 'inactive_mgr', function: 'MANAGER', active: false }],
    };
    const { result } = renderHook(() => useEditTeamAllowed(team), { wrapper });
    expect(result.current[0]).toBe(false);
  });

  it('devuelve true cuando el equipo está en tmTeams del store', async () => {
    setUser({ role: 'MAPPER', username: 'user', tmTeams: [7] });
    const team = { teamId: 7, organisation_id: 5, members: [] };
    const { result } = renderHook(() => useEditTeamAllowed(team), { wrapper });

    await act(async () => { await Promise.resolve(); });
    expect(result.current[0]).toBe(true);
  });
});

// ─── useEditOrgAllowed ───────────────────────────────────────────────────────

describe('useEditOrgAllowed', () => {
  afterEach(() => { resetStore(); jest.clearAllMocks(); });

  it('devuelve true para ADMIN', async () => {
    setUser({ role: 'ADMIN', username: 'admin' });
    const org = { organisationId: 1, managers: [] };
    const { result } = renderHook(() => useEditOrgAllowed(org), { wrapper });

    await act(async () => { await Promise.resolve(); });
    expect(result.current[0]).toBe(true);
  });

  it('devuelve false para MAPPER sin relación con la org', () => {
    setUser({ role: 'MAPPER', username: 'nobody' });
    const org = { organisationId: 99, managers: [] };
    const { result } = renderHook(() => useEditOrgAllowed(org), { wrapper });
    expect(result.current[0]).toBe(false);
  });

  it('devuelve true cuando el usuario es manager listado en la org', async () => {
    setUser({ role: 'MAPPER', username: 'org_manager' });
    const org = {
      organisationId: 10,
      managers: [{ username: 'org_manager' }],
    };
    const { result } = renderHook(() => useEditOrgAllowed(org), { wrapper });

    await act(async () => { await Promise.resolve(); });
    expect(result.current[0]).toBe(true);
  });

  it('devuelve true cuando organisationId está en el store', async () => {
    setUser({ role: 'MAPPER', username: 'storemgr', organisations: [15] });
    const org = { organisationId: 15, managers: [] };
    const { result } = renderHook(() => useEditOrgAllowed(org), { wrapper });

    await act(async () => { await Promise.resolve(); });
    expect(result.current[0]).toBe(true);
  });

  it('devuelve false cuando org es null', () => {
    setUser({ role: 'MAPPER', username: 'user' });
    const org = null;
    const { result } = renderHook(() => useEditOrgAllowed(org || {}), { wrapper });
    expect(result.current[0]).toBe(false);
  });
});
