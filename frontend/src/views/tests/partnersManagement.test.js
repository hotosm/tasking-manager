import '@testing-library/jest-dom';
import { act, screen, waitFor } from '@testing-library/react';

import { store } from '../../store';
import { ListPartners, CreatePartner, EditPartners } from '../partnersManagement';
import {
  createComponentWithMemoryRouter,
  ReduxIntlProviders,
  renderWithRouter,
} from '../../utils/testWithIntl';
import { useFetch } from '../../hooks/UseFetch';
import { fetchLocalJSONAPI, pushToLocalJSONAPI } from '../../network/genericJSONRequest';
import { putEntity } from '../../utils/management';

jest.mock('../../hooks/UseFetch', () => ({
  useFetch: jest.fn(),
}));

jest.mock('../../network/genericJSONRequest', () => ({
  fetchLocalJSONAPI: jest.fn(),
  pushToLocalJSONAPI: jest.fn(),
}));

jest.mock('../../utils/management', () => ({
  putEntity: jest.fn(),
}));

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

// Mock partner form components
jest.mock('../../components/partners/partners', () => ({
  PartnersManagement: ({ partners, isAdmin, isPartnersFetched }) => (
    <div data-testid="partners-management">
      {isPartnersFetched &&
        partners?.partners?.map((p) => (
          <span key={p.id} data-testid="partner-item">
            {p.name}
          </span>
        ))}
    </div>
  ),
  PartnersForm: ({ updatePartner, errorMessage }) => (
    <div data-testid="partners-form">
      {errorMessage && <span data-testid="error-msg">{errorMessage}</span>}
      <button onClick={() => updatePartner({ name: 'Updated', primary_hashtag: '#tag', permalink: 'slug' })}>
        Save
      </button>
      <button
        onClick={() =>
          updatePartner({})
        }
      >
        Save Invalid
      </button>
    </div>
  ),
  CreatePartnersInfo: () => <div data-testid="create-partners-info" />,
}));

jest.mock('../../components/button', () => ({
  FormSubmitButton: ({ children, disabled }) => (
    <button type="submit" disabled={disabled} data-testid="submit-btn">
      {children}
    </button>
  ),
  CustomButton: ({ children }) => <button data-testid="cancel-btn">{children}</button>,
}));

jest.mock('../../components/deleteModal', () => ({
  DeleteModal: ({ name }) => <div data-testid="delete-modal">{name}</div>,
}));

jest.mock('../../components/alert', () => ({
  Alert: ({ children, type }) => (
    <div data-testid={`alert-${type}`}>{children}</div>
  ),
}));

// Suppress scss import
jest.mock('../../components/partners/styles.scss', () => ({}), { virtual: true });

const mockPartnersList = {
  partners: [
    { id: 1, name: 'Partner Alpha' },
    { id: 2, name: 'Partner Beta' },
  ],
};

const mockPartner = {
  id: 5,
  name: 'Editable Partner',
  primary_hashtag: '#editable',
  permalink: 'editable-partner',
};

const setAdminAuth = () => {
  act(() => {
    store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
    store.dispatch({
      type: 'SET_USER_DETAILS',
      userDetails: { id: 1, username: 'admin', role: 'ADMIN' },
    });
  });
};

const setNonAdminAuth = () => {
  act(() => {
    store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
    store.dispatch({
      type: 'SET_USER_DETAILS',
      userDetails: { id: 2, username: 'mapper', role: 'MAPPER' },
    });
  });
};

// ─── ListPartners ───────────────────────────────────────────────────────────

describe('ListPartners', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders partners management component after data loads', async () => {
    fetchLocalJSONAPI.mockResolvedValue(mockPartnersList);
    setAdminAuth();

    renderWithRouter(
      <ReduxIntlProviders>
        <ListPartners />
      </ReduxIntlProviders>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('partners-management')).toBeInTheDocument();
    });
  });

  it('displays the list of fetched partners', async () => {
    fetchLocalJSONAPI.mockResolvedValue(mockPartnersList);
    setAdminAuth();

    renderWithRouter(
      <ReduxIntlProviders>
        <ListPartners />
      </ReduxIntlProviders>,
    );

    await waitFor(() => {
      expect(screen.getByText('Partner Alpha')).toBeInTheDocument();
      expect(screen.getByText('Partner Beta')).toBeInTheDocument();
    });
  });

  it('redirects to /login when user is not authenticated', async () => {
    act(() => {
      store.dispatch({ type: 'SET_TOKEN', token: null });
      store.dispatch({ type: 'SET_USER_DETAILS', userDetails: { id: null } });
    });

    renderWithRouter(
      <ReduxIntlProviders>
        <ListPartners />
      </ReduxIntlProviders>,
    );

    await waitFor(() => {
      expect(window.location.pathname).toBe('/login');
    });
  });
});

// ─── CreatePartner ──────────────────────────────────────────────────────────

describe('CreatePartner', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders the create partner form for ADMIN users', () => {
    setAdminAuth();

    renderWithRouter(
      <ReduxIntlProviders>
        <CreatePartner />
      </ReduxIntlProviders>,
    );

    expect(screen.getByTestId('create-partners-info')).toBeInTheDocument();
    expect(screen.getByTestId('submit-btn')).toBeInTheDocument();
  });

  it('renders "not allowed" message for non-admin users', () => {
    setNonAdminAuth();

    renderWithRouter(
      <ReduxIntlProviders>
        <CreatePartner />
      </ReduxIntlProviders>,
    );

    expect(screen.queryByTestId('create-partners-info')).not.toBeInTheDocument();
    // The not-allowed message is rendered via FormattedMessage
    expect(screen.queryByTestId('submit-btn')).not.toBeInTheDocument();
  });

  it('renders cancel button for ADMIN', () => {
    setAdminAuth();

    renderWithRouter(
      <ReduxIntlProviders>
        <CreatePartner />
      </ReduxIntlProviders>,
    );

    expect(screen.getByTestId('cancel-btn')).toBeInTheDocument();
  });

  it('renders the New Partner heading for ADMIN', () => {
    setAdminAuth();

    renderWithRouter(
      <ReduxIntlProviders>
        <CreatePartner />
      </ReduxIntlProviders>,
    );

    // FormattedMessage renders the heading text
    const heading = document.querySelector('h3');
    expect(heading).toBeInTheDocument();
  });
});

// ─── EditPartners ────────────────────────────────────────────────────────────

describe('EditPartners', () => {
  afterEach(() => jest.clearAllMocks());

  const setupEdit = ({ loading = false, error = null, role = 'ADMIN' } = {}) => {
    useFetch.mockReturnValue([error, loading, mockPartner]);
    act(() => {
      store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
      store.dispatch({
        type: 'SET_USER_DETAILS',
        userDetails: { id: 1, username: 'admin', role },
      });
    });

    return createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <EditPartners />
      </ReduxIntlProviders>,
      { route: '/manage/partners/:id', entryRoute: '/manage/partners/5' },
    );
  };

  it('shows loading placeholder while data is being fetched', () => {
    const { container } = setupEdit({ loading: true });
    expect(container.getElementsByClassName('show-loading-animation').length).toBeGreaterThan(0);
  });

  it('renders PartnersForm for ADMIN users after load', async () => {
    setupEdit();
    await waitFor(() => {
      expect(screen.getByTestId('partners-form')).toBeInTheDocument();
    });
  });

  it('renders DeleteModal for ADMIN users', async () => {
    setupEdit();
    await waitFor(() => {
      expect(screen.getByTestId('delete-modal')).toBeInTheDocument();
    });
  });

  it('renders not-allowed message for non-admin users', async () => {
    setupEdit({ role: 'MAPPER' });
    await waitFor(() => {
      expect(screen.queryByTestId('partners-form')).not.toBeInTheDocument();
    });
  });

  it('calls putEntity with valid payload on save', async () => {
    putEntity.mockImplementation((url, type, payload, token, onSuccess) => onSuccess());
    setupEdit();

    await waitFor(() => {
      expect(screen.getByTestId('partners-form')).toBeInTheDocument();
    });

    const saveBtn = screen.getByRole('button', { name: /^save$/i });
    act(() => saveBtn.click());

    await waitFor(() => {
      expect(putEntity).toHaveBeenCalledWith(
        'partners/5/',
        'partner',
        expect.objectContaining({ name: 'Updated' }),
        'validToken',
        expect.any(Function),
        expect.any(Function),
      );
    });
  });

  it('sets error message when required fields are missing', async () => {
    setupEdit();

    await waitFor(() => {
      expect(screen.getByTestId('partners-form')).toBeInTheDocument();
    });

    const invalidSaveBtn = screen.getByRole('button', { name: /save invalid/i });
    act(() => invalidSaveBtn.click());

    await waitFor(() => {
      expect(screen.getByTestId('error-msg')).toBeInTheDocument();
    });
  });
});
