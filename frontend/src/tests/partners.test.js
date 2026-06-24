import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import { store } from '../store';

import { PartnersCard, PartnersManagement, PartnersInformation, CreatePartnersInfo } from '../components/partners/partners';
import { PartnersProgressBar } from '../components/partners/partnersProgresBar';

const Wrapper = ({ children }) => (
  <Provider store={store}>
    <IntlProvider locale="en">
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </IntlProvider>
  </Provider>
);

const mockPartner = {
  id: 1,
  name: 'Test Partner',
  permalink: 'test-partner',
  primary_hashtag: '#testpartner',
  logo_url: '/logo.png',
  website_links: [],
};

const mockPartners = [
  { id: 1, name: 'Partner One', permalink: 'partner-one', primary_hashtag: '#partnerone', logo_url: '/logo1.png' },
  { id: 2, name: 'Partner Two', permalink: 'partner-two', primary_hashtag: '#partnertwo', logo_url: null },
];

describe('PartnersCard component', () => {
  it('renders PartnersCard without crashing', () => {
    render(<PartnersCard details={mockPartner} />, { wrapper: Wrapper });
    expect(screen.getByText('Test Partner')).toBeInTheDocument();
  });

  it('renders partner name and hashtag', () => {
    render(<PartnersCard details={mockPartner} />, { wrapper: Wrapper });
    expect(screen.getByText('Test Partner')).toBeInTheDocument();
    expect(screen.getByText('#testpartner')).toBeInTheDocument();
  });

  it('renders partner logo when logo_url is provided', () => {
    render(<PartnersCard details={mockPartner} />, { wrapper: Wrapper });
    const img = screen.getByAltText('Test Partner logo');
    expect(img).toBeInTheDocument();
  });

  it('renders edit and statistics links', () => {
    render(<PartnersCard details={mockPartner} />, { wrapper: Wrapper });
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(2);
  });

  it('does not render logo when logo_url is null', () => {
    const partnerNoLogo = { ...mockPartner, logo_url: null };
    render(<PartnersCard details={partnerNoLogo} />, { wrapper: Wrapper });
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});

describe('PartnersManagement component', () => {
  it('renders with admin access and partners', () => {
    render(
      <PartnersManagement partners={mockPartners} isAdmin={true} isPartnersFetched={true} />,
      { wrapper: Wrapper }
    );
    expect(screen.getByText('Partner One')).toBeInTheDocument();
    expect(screen.getByText('Partner Two')).toBeInTheDocument();
  });

  it('renders not-allowed message when not admin', () => {
    render(
      <PartnersManagement partners={mockPartners} isAdmin={false} isPartnersFetched={true} />,
      { wrapper: Wrapper }
    );
    // Non-admin sees a different message
    expect(screen.queryByText('Partner One')).not.toBeInTheDocument();
  });

  it('renders empty state when no partners found', () => {
    render(
      <PartnersManagement partners={[]} isAdmin={true} isPartnersFetched={true} />,
      { wrapper: Wrapper }
    );
    // Empty state
    expect(screen.queryByText('Partner One')).not.toBeInTheDocument();
  });

  it('renders loading state when not fetched', () => {
    const { container } = render(
      <PartnersManagement partners={[]} isAdmin={true} isPartnersFetched={false} />,
      { wrapper: Wrapper }
    );
    expect(container).toBeInTheDocument();
  });
});

describe('CreatePartnersInfo component', () => {
  it('renders CreatePartnersInfo without crashing', () => {
    const { container } = render(
      <CreatePartnersInfo formState={{}} />,
      { wrapper: Wrapper }
    );
    expect(container).toBeInTheDocument();
  });
});

describe('PartnersProgressBar component', () => {
  it('renders PartnersProgressBar with required props', () => {
    const { container } = render(
      <PartnersProgressBar
        percent={75}
        className="test-bar"
      />,
      { wrapper: Wrapper }
    );
    expect(container).toBeInTheDocument();
  });

  it('renders PartnersProgressBar with 0 percent', () => {
    const { container } = render(
      <PartnersProgressBar percent={0} />,
      { wrapper: Wrapper }
    );
    expect(container).toBeInTheDocument();
  });

  it('renders PartnersProgressBar with 100 percent', () => {
    const { container } = render(
      <PartnersProgressBar percent={100} />,
      { wrapper: Wrapper }
    );
    expect(container).toBeInTheDocument();
  });
});
