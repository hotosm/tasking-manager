import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import { store } from '../store';

import { ContactForm } from '../components/homepage/contactForm';
import { FeaturedProjects } from '../components/homepage/featuredProjects';
import * as UseFeaturedProjectAPI from '../hooks/UseFeaturedProjectAPI';

const Wrapper = ({ children }) => (
  <Provider store={store}>
    <IntlProvider locale="en">
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </IntlProvider>
  </Provider>
);

describe('ContactForm component', () => {
  it('renders correctly', () => {
    const { container } = render(
      <ContactForm submitMessage={jest.fn()} disabledForm={false} />,
      { wrapper: Wrapper }
    );
    expect(container).toBeInTheDocument();
  });

  it('renders name, email, and content fields', () => {
    render(
      <ContactForm submitMessage={jest.fn()} disabledForm={false} />,
      { wrapper: Wrapper }
    );
    // Since final-form registers fields by name
    const nameInput = document.querySelector('input[name="name"]');
    const emailInput = document.querySelector('input[name="email"]');
    const contentInput = document.querySelector('textarea[name="content"]');
    
    expect(nameInput).toBeInTheDocument();
    expect(emailInput).toBeInTheDocument();
    expect(contentInput).toBeInTheDocument();
  });
});

describe('FeaturedProjects component', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders null when there are no projects', () => {
    jest.spyOn(UseFeaturedProjectAPI, 'useFeaturedProjectAPI').mockReturnValue([
      { projects: { results: [] }, activeProjectCardPage: 0, activeProjectCardPageMobile: 0, isLoading: false, isError: false },
      jest.fn()
    ]);
    const { container } = render(<FeaturedProjects />, { wrapper: Wrapper });
    expect(container.firstChild).toBeNull();
  });

  it('renders projects and pagination arrows', () => {
    jest.spyOn(UseFeaturedProjectAPI, 'useFeaturedProjectAPI').mockReturnValue([
      { 
        projects: { 
          results: [
            { projectId: 1, name: 'Proj1' },
            { projectId: 2, name: 'Proj2' }
          ] 
        }, 
        activeProjectCardPage: 0, 
        activeProjectCardPageMobile: 0, 
        isLoading: false, 
        isError: false 
      },
      jest.fn()
    ]);
    const { container } = render(<FeaturedProjects />, { wrapper: Wrapper });
    expect(container).toBeInTheDocument();
    expect(screen.getByText(/featured projects/i)).toBeInTheDocument();
  });

  it('renders error state', () => {
    jest.spyOn(UseFeaturedProjectAPI, 'useFeaturedProjectAPI').mockReturnValue([
      { 
        projects: { 
          results: [{ projectId: 1, name: 'Proj1' }] 
        }, 
        activeProjectCardPage: 0, 
        activeProjectCardPageMobile: 0, 
        isLoading: false, 
        isError: true 
      },
      jest.fn()
    ]);
    render(<FeaturedProjects />, { wrapper: Wrapper });
    expect(screen.getByText(/error loading the/i)).toBeInTheDocument();
  });
});
