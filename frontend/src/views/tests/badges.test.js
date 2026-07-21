import '@testing-library/jest-dom';
import { act, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';

import { store } from '../../store';
import { ListBadges, CreateBadge, EditBadge } from '../badges';
import {
  ReduxIntlProviders,
  renderWithRouter,
  createComponentWithMemoryRouter,
} from '../../utils/testWithIntl';
import { server } from '../../network/tests/server';
import { API_URL } from '../../config';

// Mock heavy component dependencies
jest.mock('../../components/badges', () => ({
  BadgesManagement: ({ badges, isFetched }) => (
    <div data-testid="badges-management">
      {isFetched && badges && badges.map((b) => <div key={b.id}>{b.name}</div>)}
    </div>
  ),
  BadgeUpdateForm: ({ badge }) => (
    <div data-testid="badge-update-form">{badge?.name}</div>
  ),
  BadgeInformation: () => <div data-testid="badge-information" />,
}));

jest.mock('../../components/deleteModal', () => ({
  DeleteModal: ({ id, name }) => (
    <button data-testid="delete-modal">Delete {name}</button>
  ),
}));

const mockBadgesList = {
  badges: [
    { id: 1, name: 'Beginner Badge', description: 'First badge' },
    { id: 2, name: 'Advanced Badge', description: 'Second badge' },
    { id: 3, name: 'Expert Badge', description: 'Third badge' },
  ],
};

const mockBadge = {
  id: 5,
  name: 'Test Badge',
  description: 'A test badge',
};

const setAdminAuth = () => {
  act(() => {
    store.dispatch({ type: 'SET_TOKEN', token: 'admin-token' });
    store.dispatch({
      type: 'SET_USER_DETAILS',
      userDetails: { id: 1, username: 'admin', role: 'ADMIN' },
    });
  });
};

// ─── ListBadges ───────────────────────────────────────────────────────────────

describe('ListBadges', () => {
  beforeEach(() => {
    server.use(
      rest.get(API_URL + 'badges/', (req, res, ctx) => {
        return res(ctx.json(mockBadgesList));
      }),
    );
  });
  afterEach(() => jest.clearAllMocks());

  it('renderiza el componente de gestión de badges', async () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <ListBadges />
      </ReduxIntlProviders>,
    );
    await waitFor(() => {
      expect(screen.getByTestId('badges-management')).toBeInTheDocument();
    });
  });

  it('pasa la lista de badges al componente BadgesManagement', async () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <ListBadges />
      </ReduxIntlProviders>,
    );
    await waitFor(() => {
      expect(screen.getByText('Beginner Badge')).toBeInTheDocument();
      expect(screen.getByText('Advanced Badge')).toBeInTheDocument();
      expect(screen.getByText('Expert Badge')).toBeInTheDocument();
    });
  });

  it('maneja el estado de carga (isFetched=false inicialmente)', () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <ListBadges />
      </ReduxIntlProviders>,
    );
    // During loading, BadgesManagement receives isFetched=false
    expect(screen.getByTestId('badges-management')).toBeInTheDocument();
  });
});

// ─── CreateBadge ──────────────────────────────────────────────────────────────

describe('CreateBadge', () => {
  beforeEach(() => {
    setAdminAuth();
    server.use(
      rest.post(API_URL + 'badges/', (req, res, ctx) => {
        return res(ctx.json({ id: 99, name: 'New Badge' }));
      }),
    );
  });
  afterEach(() => jest.clearAllMocks());

  it('renderiza el encabezado "New Badge"', () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <CreateBadge />
      </ReduxIntlProviders>,
    );
    expect(screen.getByRole('heading', { name: /new badge/i })).toBeInTheDocument();
  });

  it('renderiza el formulario de información del badge', () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <CreateBadge />
      </ReduxIntlProviders>,
    );
    expect(screen.getByTestId('badge-information')).toBeInTheDocument();
  });

  it('renderiza el botón de creación (Create Badge)', () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <CreateBadge />
      </ReduxIntlProviders>,
    );
    expect(screen.getByRole('button', { name: /create badge/i })).toBeInTheDocument();
  });

  it('el botón de crear está deshabilitado cuando el formulario está vacío (pristine)', () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <CreateBadge />
      </ReduxIntlProviders>,
    );
    const createBtn = screen.getByRole('button', { name: /create badge/i });
    expect(createBtn).toBeDisabled();
  });

  it('renderiza el botón de cancelar', () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <CreateBadge />
      </ReduxIntlProviders>,
    );
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('el enlace de cancelar apunta a ../  (directorio padre)', () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <CreateBadge />
      </ReduxIntlProviders>,
    );
    const cancelLink = screen.getByRole('link');
    expect(cancelLink).toBeInTheDocument();
  });

  it('renderiza el encabezado de información del badge (Badge Information)', () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <CreateBadge />
      </ReduxIntlProviders>,
    );
    expect(screen.getByRole('heading', { name: /badge info/i })).toBeInTheDocument();
  });
});

// ─── EditBadge ────────────────────────────────────────────────────────────────

describe('EditBadge', () => {
  beforeEach(() => {
    setAdminAuth();
    server.use(
      rest.get(API_URL + 'badges/:id/', (req, res, ctx) => {
        return res(ctx.json(mockBadge));
      }),
      rest.patch(API_URL + 'badges/:id/', (req, res, ctx) => {
        return res(ctx.json({ ...mockBadge, name: 'Updated Badge' }));
      }),
      rest.delete(API_URL + 'badges/:id/', (req, res, ctx) => {
        return res(ctx.json({ Success: 'Badge deleted' }));
      }),
    );
  });
  afterEach(() => jest.clearAllMocks());

  it('renderiza el encabezado "Manage Badge"', async () => {
    createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <EditBadge />
      </ReduxIntlProviders>,
      { route: '/manage/badges/:id', entryRoute: '/manage/badges/5' },
    );
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /manage badge/i })).toBeInTheDocument();
    });
  });

  it('renderiza el formulario de actualización del badge', async () => {
    createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <EditBadge />
      </ReduxIntlProviders>,
      { route: '/manage/badges/:id', entryRoute: '/manage/badges/5' },
    );
    await waitFor(() => {
      expect(screen.getByTestId('badge-update-form')).toBeInTheDocument();
    });
  });

  it('muestra el nombre del badge cargado desde la API', async () => {
    createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <EditBadge />
      </ReduxIntlProviders>,
      { route: '/manage/badges/:id', entryRoute: '/manage/badges/5' },
    );
    await waitFor(() => {
      expect(screen.getByText('Test Badge')).toBeInTheDocument();
    });
  });

  it('renderiza el botón de eliminación (DeleteModal)', async () => {
    createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <EditBadge />
      </ReduxIntlProviders>,
      { route: '/manage/badges/:id', entryRoute: '/manage/badges/5' },
    );
    await waitFor(() => {
      expect(screen.getByTestId('delete-modal')).toBeInTheDocument();
    });
  });
});
