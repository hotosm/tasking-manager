import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import { store } from '../store';

import { MessageContributors } from '../components/teamsAndOrgs/messageContributors';
import { MessageMembers } from '../components/teamsAndOrgs/messageMembers';

const Wrapper = ({ children }) => (
  <Provider store={store}>
    <IntlProvider locale="en">
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </IntlProvider>
  </Provider>
);

describe('MessageContributors component', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <MessageContributors campaignId={1} />,
      { wrapper: Wrapper }
    );
    expect(container).toBeInTheDocument();
  });

  it('renders the message contributors heading', () => {
    render(<MessageContributors campaignId={1} />, { wrapper: Wrapper });
    // Title should be visible
    expect(screen.getByText(/message contributors/i)).toBeInTheDocument();
  });

  it('renders with undefined campaignId', () => {
    const { container } = render(
      <MessageContributors />,
      { wrapper: Wrapper }
    );
    expect(container).toBeInTheDocument();
  });
});

describe('MessageMembers component', () => {
  const mockMembers = [
    { username: 'user1', function: 'MEMBER' },
    { username: 'user2', function: 'MANAGER' },
  ];

  it('renders without crashing', () => {
    const { container } = render(
      <MessageMembers teamId={1} members={mockMembers} />,
      { wrapper: Wrapper }
    );
    expect(container).toBeInTheDocument();
  });

  it('renders the message members heading', () => {
    render(<MessageMembers teamId={1} members={mockMembers} />, { wrapper: Wrapper });
    expect(screen.getByText(/message members/i)).toBeInTheDocument();
  });

  it('renders with empty members array', () => {
    const { container } = render(
      <MessageMembers teamId={1} members={[]} />,
      { wrapper: Wrapper }
    );
    expect(container).toBeInTheDocument();
  });

  it('renders with undefined members', () => {
    const { container } = render(
      <MessageMembers teamId={1} />,
      { wrapper: Wrapper }
    );
    expect(container).toBeInTheDocument();
  });
});
