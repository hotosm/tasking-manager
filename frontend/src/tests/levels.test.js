import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import { store } from '../store';

import { LevelCard, LevelsManagement } from '../components/levels/index';

const Wrapper = ({ children }) => (
  <Provider store={store}>
    <IntlProvider locale="en">
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </IntlProvider>
  </Provider>
);

const mockLevel = {
  id: 1,
  name: 'Beginner',
  color: '#ff0000',
  isBeginner: true,
};

const mockLevels = [
  { id: 1, name: 'Beginner', color: '#ff0000', isBeginner: true },
  { id: 2, name: 'Intermediate', color: '#00ff00', isBeginner: false },
  { id: 3, name: 'Advanced', color: '#0000ff', isBeginner: false },
];

describe('LevelCard component', () => {
  it('renders LevelCard without crashing', () => {
    render(<LevelCard level={mockLevel} number={1} />, { wrapper: Wrapper });
    expect(screen.getByText(/1\. Beginner/)).toBeInTheDocument();
  });

  it('renders the level name and number', () => {
    render(<LevelCard level={mockLevel} number={2} />, { wrapper: Wrapper });
    expect(screen.getByText(/2\. Beginner/)).toBeInTheDocument();
  });

  it('links to correct level URL', () => {
    render(<LevelCard level={mockLevel} number={1} />, { wrapper: Wrapper });
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/1/');
  });
});

describe('LevelsManagement component', () => {
  it('renders LevelsManagement with levels loaded', () => {
    render(
      <LevelsManagement levels={mockLevels} isFetched={true} />,
      { wrapper: Wrapper }
    );
    expect(screen.getByText(/Beginner/)).toBeInTheDocument();
    expect(screen.getByText(/Intermediate/)).toBeInTheDocument();
    expect(screen.getByText(/Advanced/)).toBeInTheDocument();
  });

  it('renders empty state when no levels', () => {
    render(
      <LevelsManagement levels={[]} isFetched={true} />,
      { wrapper: Wrapper }
    );
    expect(screen.queryByText('Beginner')).not.toBeInTheDocument();
  });

  it('renders loading state when not fetched', () => {
    const { container } = render(
      <LevelsManagement levels={[]} isFetched={false} />,
      { wrapper: Wrapper }
    );
    expect(container).toBeInTheDocument();
  });

  it('renders multiple level cards in order', () => {
    render(
      <LevelsManagement levels={mockLevels} isFetched={true} />,
      { wrapper: Wrapper }
    );
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(3);
  });

  it('renders correct level numbering', () => {
    render(
      <LevelsManagement levels={mockLevels} isFetched={true} />,
      { wrapper: Wrapper }
    );
    expect(screen.getByText(/1\. Beginner/)).toBeInTheDocument();
    expect(screen.getByText(/2\. Intermediate/)).toBeInTheDocument();
    expect(screen.getByText(/3\. Advanced/)).toBeInTheDocument();
  });
});
