import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import { store } from '../store';

import { Banner, DonationBanner, ArchivalNotificationBanner } from '../components/banner/index';
import { TopBanner } from '../components/banner/topBanner';

const Wrapper = ({ children }) => (
  <Provider store={store}>
    <IntlProvider locale="en">
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </IntlProvider>
  </Provider>
);

describe('Banner component', () => {
  it('renders Banner component without crashing', () => {
    const { container } = render(<Banner />, { wrapper: Wrapper });
    expect(container).toBeInTheDocument();
  });

  it('renders the optout-form container', () => {
    const { container } = render(<Banner />, { wrapper: Wrapper });
    const form = container.querySelector('#optout-form');
    expect(form).toBeInTheDocument();
  });

  it('renders agree and disagree buttons', () => {
    render(<Banner />, { wrapper: Wrapper });
    expect(screen.getAllByText(/agree/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/disagree/i).length).toBeGreaterThan(0);
  });
});

describe('DonationBanner component', () => {
  it('renders DonationBanner without crashing', () => {
    const { container } = render(<DonationBanner />, { wrapper: Wrapper });
    expect(container).toBeInTheDocument();
  });

  it('renders the donation-form container', () => {
    const { container } = render(<DonationBanner />, { wrapper: Wrapper });
    const form = container.querySelector('#donation-form');
    expect(form).toBeInTheDocument();
  });

  it('renders the HOT Summit link', () => {
    render(<DonationBanner />, { wrapper: Wrapper });
    expect(screen.getByText('2021 HOT Summit')).toBeInTheDocument();
  });

  it('renders Close button', () => {
    render(<DonationBanner />, { wrapper: Wrapper });
    expect(screen.getByText('Close')).toBeInTheDocument();
  });
});

describe('ArchivalNotificationBanner component', () => {
  it('renders ArchivalNotificationBanner without crashing', () => {
    const { container } = render(<ArchivalNotificationBanner />, { wrapper: Wrapper });
    expect(container).toBeInTheDocument();
  });

  it('renders the archival-notification-form container', () => {
    const { container } = render(<ArchivalNotificationBanner />, { wrapper: Wrapper });
    const form = container.querySelector('#archival-notification-form');
    expect(form).toBeInTheDocument();
  });

  it('renders learnmore and close buttons', () => {
    const { container } = render(<ArchivalNotificationBanner />, { wrapper: Wrapper });
    expect(container.querySelector('#archival-notification-learnmore')).toBeInTheDocument();
    expect(container.querySelector('#archival-notification-close')).toBeInTheDocument();
  });
});

describe('TopBanner component', () => {
  it('renders TopBanner without crashing', () => {
    const { container } = render(<TopBanner />, { wrapper: Wrapper });
    expect(container).toBeInTheDocument();
  });
});
