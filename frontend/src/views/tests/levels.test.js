import '@testing-library/jest-dom';
import { act, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';

import { store } from '../../store';
import { ListLevels, CreateLevel, EditLevel } from '../levels';
import {
  ReduxIntlProviders,
  renderWithRouter,
  createComponentWithMemoryRouter,
} from '../../utils/testWithIntl';
import { server } from '../../network/tests/server';
import { API_URL } from '../../config';

// Mock heavy component dependencies
jest.mock('../../components/levels', () => ({
  LevelsManagement: ({ levels, isFetched }) => (
    <div data-testid="levels-management">
      {isFetched && levels && levels.map((l) => <div key={l.id}>{l.name}</div>)}
    </div>
  ),
  LevelForm: ({ level }) => <div data-testid="level-form">{level?.name}</div>,
  LevelInformation: ({ badges }) => (
    <div data-testid="level-information">badges: {badges?.length ?? 0}</div>
  ),
}));

jest.mock('../../components/deleteModal', () => ({
  DeleteModal: ({ name }) => <button data-testid="delete-modal">Delete {name}</button>,
}));

const mockLevelsList = {
  levels: [
    { id: 1, name: 'Beginner', description: 'Level 1' },
    { id: 2, name: 'Intermediate', description: 'Level 2' },
    { id: 3, name: 'Advanced', description: 'Level 3' },
  ],
};

const mockLevel = { id: 7, name: 'Expert Level', description: 'Top level' };
const mockBadgesList = { badges: [{ id: 1, name: 'Badge A' }, { id: 2, name: 'Badge B' }] };

const setAdminAuth = () => {
  act(() => {
    store.dispatch({ type: 'SET_TOKEN', token: 'admin-token' });
    store.dispatch({
      type: 'SET_USER_DETAILS',
      userDetails: { id: 1, username: 'admin', role: 'ADMIN' },
    });
  });
};

// ─── ListLevels ───────────────────────────────────────────────────────────────

describe('ListLevels', () => {
  beforeEach(() => {
    server.use(
      rest.get(API_URL + 'levels/', (req, res, ctx) => {
        return res(ctx.json(mockLevelsList));
      }),
    );
  });
  afterEach(() => jest.clearAllMocks());

  it('renderiza el componente de gestión de niveles', async () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <ListLevels />
      </ReduxIntlProviders>,
    );
    await waitFor(() => {
      expect(screen.getByTestId('levels-management')).toBeInTheDocument();
    });
  });

  it('muestra los niveles cargados desde la API', async () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <ListLevels />
      </ReduxIntlProviders>,
    );
    await waitFor(() => {
      expect(screen.getByText('Beginner')).toBeInTheDocument();
      expect(screen.getByText('Intermediate')).toBeInTheDocument();
      expect(screen.getByText('Advanced')).toBeInTheDocument();
    });
  });

  it('pasa isFetched=false durante la carga', () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <ListLevels />
      </ReduxIntlProviders>,
    );
    expect(screen.getByTestId('levels-management')).toBeInTheDocument();
  });
});

// ─── CreateLevel ──────────────────────────────────────────────────────────────

describe('CreateLevel', () => {
  beforeEach(() => {
    setAdminAuth();
    server.use(
      rest.get(API_URL + 'badges/', (req, res, ctx) => {
        return res(ctx.json(mockBadgesList));
      }),
      rest.post(API_URL + 'levels/', (req, res, ctx) => {
        return res(ctx.json({ id: 99, name: 'New Level' }));
      }),
    );
  });
  afterEach(() => jest.clearAllMocks());

  it('renderiza el encabezado "New Level" tras cargar los badges', async () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <CreateLevel />
      </ReduxIntlProviders>,
    );
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /new level/i })).toBeInTheDocument();
    });
  });

  it('renderiza el formulario de información del nivel', async () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <CreateLevel />
      </ReduxIntlProviders>,
    );
    await waitFor(() => {
      expect(screen.getByTestId('level-information')).toBeInTheDocument();
    });
  });

  it('pasa los badges al LevelInformation', async () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <CreateLevel />
      </ReduxIntlProviders>,
    );
    await waitFor(() => {
      expect(screen.getByText(/badges: 2/i)).toBeInTheDocument();
    });
  });

  it('renderiza el botón de creación (Create Level)', async () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <CreateLevel />
      </ReduxIntlProviders>,
    );
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create level/i })).toBeInTheDocument();
    });
  });

  it('el botón de crear está deshabilitado cuando el formulario está pristine', async () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <CreateLevel />
      </ReduxIntlProviders>,
    );
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /create level/i });
      expect(btn).toBeDisabled();
    });
  });

  it('renderiza el botón de cancelar', async () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <CreateLevel />
      </ReduxIntlProviders>,
    );
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });

  it('renderiza el encabezado de información de nivel', async () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <CreateLevel />
      </ReduxIntlProviders>,
    );
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /level info/i })).toBeInTheDocument();
    });
  });
});

// ─── EditLevel ────────────────────────────────────────────────────────────────

describe('EditLevel', () => {
  beforeEach(() => {
    setAdminAuth();
    server.use(
      rest.get(API_URL + 'levels/:id/', (req, res, ctx) => {
        return res(ctx.json(mockLevel));
      }),
      rest.get(API_URL + 'badges/', (req, res, ctx) => {
        return res(ctx.json(mockBadgesList));
      }),
      rest.patch(API_URL + 'levels/:id/', (req, res, ctx) => {
        return res(ctx.json({ ...mockLevel, name: 'Updated Level' }));
      }),
      rest.delete(API_URL + 'levels/:id/', (req, res, ctx) => {
        return res(ctx.json({ Success: 'Level deleted' }));
      }),
    );
  });
  afterEach(() => jest.clearAllMocks());

  it('renderiza el encabezado "Manage Level"', async () => {
    createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <EditLevel />
      </ReduxIntlProviders>,
      { route: '/manage/levels/:id', entryRoute: '/manage/levels/7' },
    );
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /manage level/i })).toBeInTheDocument();
    });
  });

  it('renderiza el LevelForm con los datos del nivel', async () => {
    createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <EditLevel />
      </ReduxIntlProviders>,
      { route: '/manage/levels/:id', entryRoute: '/manage/levels/7' },
    );
    await waitFor(() => {
      expect(screen.getByTestId('level-form')).toBeInTheDocument();
      expect(screen.getByText('Expert Level')).toBeInTheDocument();
    });
  });

  it('renderiza el botón DeleteModal', async () => {
    createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <EditLevel />
      </ReduxIntlProviders>,
      { route: '/manage/levels/:id', entryRoute: '/manage/levels/7' },
    );
    await waitFor(() => {
      expect(screen.getByTestId('delete-modal')).toBeInTheDocument();
    });
  });

  it('el DeleteModal muestra el nombre del nivel', async () => {
    createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <EditLevel />
      </ReduxIntlProviders>,
      { route: '/manage/levels/:id', entryRoute: '/manage/levels/7' },
    );
    await waitFor(() => {
      expect(screen.getByText(/delete expert level/i)).toBeInTheDocument();
    });
  });
});
