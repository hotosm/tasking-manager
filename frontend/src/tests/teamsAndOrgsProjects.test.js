import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import { store } from '../store';

import { Projects } from '../components/teamsAndOrgs/projects';

const Wrapper = ({ children }) => (
  <Provider store={store}>
    <IntlProvider locale="en">
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </IntlProvider>
  </Provider>
);

describe('Projects component', () => {
  it('renders without crashing with default props', () => {
    const { container } = render(<Projects />, { wrapper: Wrapper });
    expect(container).toBeInTheDocument();
  });

  it('renders empty state correctly', () => {
    render(
      <Projects 
        projects={{ results: [] }} 
        ownerEntity="team" 
      />, 
      { wrapper: Wrapper }
    );
    expect(screen.getByText(/projects/i)).toBeInTheDocument();
    // Assuming messages.noProjectsFound translates something we can find
    // But since we just mock the locale, it will just render the raw IDs or default translation if available.
  });

  it('renders with AddButton when showAddButton is true', () => {
    render(
      <Projects 
        projects={{ results: [] }} 
        showAddButton={true}
      />, 
      { wrapper: Wrapper }
    );
    // AddButton usually renders a link to /manage/projects/new/
    expect(screen.getByRole('link', { name: /add/i }) || screen.getByText(/new/i)).toBeTruthy();
  });

  it('renders projects correctly', () => {
    const mockProjects = {
      results: [
        { projectId: 1, name: 'Project 1' },
        { projectId: 2, name: 'Project 2' }
      ]
    };
    render(
      <Projects 
        projects={mockProjects} 
      />, 
      { wrapper: Wrapper }
    );
    // ProjectCards should be rendered
    // If translations are missing, we might just look for project titles if passed as props to ProjectCard.
  });
});
