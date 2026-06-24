import '@testing-library/jest-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

import { PartnersStats } from '../partnersStats';
import { useFetch } from '../../hooks/UseFetch';

const mockNavigate = jest.fn();

let mockParams = {
  id: 'hot',
  tabname: undefined,
};

const mockPartner = {
  name: 'HOT Partner',
  logo_url: '',
  primary_hashtag: '#HOT',
  mapswipe_group_id: 'group-1',
  link_x: 'https://x.com/hot',
  link_meta: 'https://facebook.com/hot',
  link_instagram: 'https://instagram.com/hot',
  link_website: 'https://www.hotosm.org',
};

jest.mock('react-router-dom', () => {
  const actualReactRouter = jest.requireActual('react-router-dom');

  return {
    ...actualReactRouter,
    useParams: () => mockParams,
    useNavigate: () => mockNavigate,
  };
});

jest.mock('../../hooks/UseFetch', () => ({
  useFetch: jest.fn(),
}));

jest.mock('../notFound', () => ({
  NotFound: () => <div data-testid="not-found">Not Found</div>,
}));

jest.mock('../../components/partners/leaderboard', () => ({
  Leaderboard: ({ partner, partnerStats }) => (
    <div data-testid="leaderboard">
      Leaderboard {partner?.name} {partnerStats?.totalEdits || ''}
    </div>
  ),
}));

jest.mock('../partnersMapswipeStats', () => ({
  PartnersMapswipeStats: () => <div data-testid="mapswipe-stats">Mapswipe Stats</div>,
}));

jest.mock('../../components/partners/partnersResources', () => ({
  Resources: ({ partner }) => <div data-testid="resources">Resources {partner?.name}</div>,
}));

jest.mock('../../components/svgIcons', () => ({
  TwitterIcon: () => <span data-testid="twitter-icon">Twitter</span>,
  FacebookIcon: () => <span data-testid="facebook-icon">Facebook</span>,
  InstagramIcon: () => <span data-testid="instagram-icon">Instagram</span>,
}));

jest.mock('../../components/button', () => ({
  Button: ({ children, onClick, className }) => (
    <button type="button" className={className} onClick={onClick}>
      {children}
    </button>
  ),
}));

jest.mock('react-placeholder', () => ({
  __esModule: true,
  default: ({ children, ready }) =>
    ready ? <div>{children}</div> : <div data-testid="partners-placeholder">Loading</div>,
}));

beforeEach(() => {
  jest.clearAllMocks();

  mockParams = {
    id: 'hot',
    tabname: undefined,
  };

  useFetch.mockReturnValue([false, false, mockPartner]);

  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          result: {
            hot: {
              totalEdits: 123,
            },
          },
        }),
    }),
  );

  window.open = jest.fn();
});

describe('PartnersStats view', () => {
  it('renders partner leaderboard, tabs, resources and social links', async () => {
    render(<PartnersStats />);

    expect(useFetch).toHaveBeenCalledWith('partners/hot/');
    expect(screen.getByText('HOT Partner')).toBeInTheDocument();
    expect(screen.getByText('Tasking Manager')).toBeInTheDocument();
    expect(screen.getByText('Map Swipe')).toBeInTheDocument();
    expect(screen.getByTestId('resources')).toHaveTextContent('Resources HOT Partner');

    expect(screen.getByTestId('twitter-icon')).toBeInTheDocument();
    expect(screen.getByTestId('facebook-icon')).toBeInTheDocument();
    expect(screen.getByTestId('instagram-icon')).toBeInTheDocument();

    expect(screen.getByTestId('leaderboard')).toHaveTextContent('Leaderboard HOT Partner');

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/stats/hashtags/hot'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('leaderboard')).toHaveTextContent('123');
    });
  });

  it('renders the partner logo when logo_url exists', () => {
    useFetch.mockReturnValueOnce([
      false,
      false,
      {
        ...mockPartner,
        logo_url: 'https://example.com/logo.png',
      },
    ]);

    render(<PartnersStats />);

    expect(screen.getByAltText('logo')).toHaveAttribute('src', 'https://example.com/logo.png');
  });

  it('renders mapswipe tab content and opens mapswipe website', () => {
    mockParams = {
      id: 'hot',
      tabname: 'mapswipe',
    };

    render(<PartnersStats />);

    expect(screen.getByTestId('mapswipe-stats')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /start mapping with/i }));

    expect(window.open).toHaveBeenCalledWith(
      'https://web.mapswipe.org/#/en',
      '_blank',
      'noopener',
    );
  });

  it('navigates when clicking tab buttons', () => {
    render(<PartnersStats />);

    fireEvent.click(screen.getByText('Map Swipe'));

    expect(mockNavigate).toHaveBeenCalledWith('/partners/hot/stats/mapswipe');

    fireEvent.click(screen.getByText('Tasking Manager'));

    expect(mockNavigate).toHaveBeenCalledWith('/partners/hot/stats');
  });

  it('does not show the mapswipe tab when partner has no mapswipe group', () => {
    useFetch.mockReturnValueOnce([
      false,
      false,
      {
        ...mockPartner,
        mapswipe_group_id: '',
      },
    ]);

    render(<PartnersStats />);

    expect(screen.getByText('Tasking Manager')).toBeInTheDocument();
    expect(screen.queryByText('Map Swipe')).not.toBeInTheDocument();
  });

  it('renders not found when the partner request fails', () => {
    useFetch.mockReturnValueOnce([true, false, {}]);

    render(<PartnersStats />);

    expect(screen.getByTestId('not-found')).toBeInTheDocument();
  });

  it('renders loading placeholder while partner is loading', () => {
    useFetch.mockReturnValueOnce([false, true, {}]);

    render(<PartnersStats />);

    expect(screen.getByTestId('partners-placeholder')).toBeInTheDocument();
  });

  it('logs an error when ohsome stats response is not ok', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        statusText: 'Server error',
      }),
    );

    render(<PartnersStats />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error al obtener los datos:',
        'Server error',
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it('logs an error when ohsome stats request throws', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

    render(<PartnersStats />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error al procesar la solicitud:',
        expect.any(Error),
      );
    });

    consoleErrorSpy.mockRestore();
  });
});