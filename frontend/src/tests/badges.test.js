import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import { store } from '../store';

import { BadgeCard, BadgesManagement } from '../components/badges/index';

const Wrapper = ({ children }) => (
  <Provider store={store}>
    <IntlProvider locale="en">
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </IntlProvider>
  </Provider>
);

const mockBadge = {
  id: 1,
  name: 'Test Badge',
  description: 'A test badge description',
  imagePath: '/images/test-badge.png',
};

const mockBadges = [
  { id: 1, name: 'First Badge', description: 'First description', imagePath: '/img1.png' },
  { id: 2, name: 'Second Badge', description: 'Second description', imagePath: '/img2.png' },
];

describe('BadgeCard component', () => {
  it('renders BadgeCard without crashing', () => {
    render(<BadgeCard badge={mockBadge} />, { wrapper: Wrapper });
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('renders badge name and description', () => {
    render(<BadgeCard badge={mockBadge} />, { wrapper: Wrapper });
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
    expect(screen.getByText('A test badge description')).toBeInTheDocument();
  });

  it('renders badge image with correct src and alt', () => {
    render(<BadgeCard badge={mockBadge} />, { wrapper: Wrapper });
    const img = screen.getByAltText('Test Badge badge icon');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/images/test-badge.png');
  });

  it('links to the correct badge URL', () => {
    render(<BadgeCard badge={mockBadge} />, { wrapper: Wrapper });
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/1/');
  });
});

describe('BadgesManagement component', () => {
  it('renders BadgesManagement with badges loaded', () => {
    render(
      <BadgesManagement badges={mockBadges} isFetched={true} />,
      { wrapper: Wrapper }
    );
    expect(screen.getByText('First Badge')).toBeInTheDocument();
    expect(screen.getByText('Second Badge')).toBeInTheDocument();
  });

  it('renders empty state when no badges', () => {
    render(
      <BadgesManagement badges={[]} isFetched={true} />,
      { wrapper: Wrapper }
    );
    expect(screen.queryByText('First Badge')).not.toBeInTheDocument();
  });

  it('renders loading state when not fetched', () => {
    const { container } = render(
      <BadgesManagement badges={[]} isFetched={false} />,
      { wrapper: Wrapper }
    );
    expect(container).toBeInTheDocument();
  });

  it('renders multiple badge cards when badges provided', () => {
    render(
      <BadgesManagement badges={mockBadges} isFetched={true} />,
      { wrapper: Wrapper }
    );
    const badges = screen.getAllByRole('link');
    expect(badges.length).toBeGreaterThanOrEqual(2);
  });
});
