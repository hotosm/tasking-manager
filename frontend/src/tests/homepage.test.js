import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import { store } from '../store';

import { Jumbotron, SecondaryJumbotron } from '../components/homepage/jumbotron';
import { MappingFlow } from '../components/homepage/mappingFlow';
import { Testimonials } from '../components/homepage/testimonials';
import { WhoIsMapping } from '../components/homepage/whoIsMapping';

const Wrapper = ({ children }) => (
  <Provider store={store}>
    <IntlProvider locale="en">
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </IntlProvider>
  </Provider>
);

describe('Jumbotron component', () => {
  it('renders Jumbotron without crashing', () => {
    const { container } = render(<Jumbotron />, { wrapper: Wrapper });
    expect(container).toBeInTheDocument();
  });

  it('renders the jumbotron container', () => {
    const { container } = render(<Jumbotron />, { wrapper: Wrapper });
    expect(container.querySelector('#jumbotron')).toBeInTheDocument();
  });

  it('renders explore link', () => {
    render(<Jumbotron />, { wrapper: Wrapper });
    const links = screen.getAllByRole('link');
    const exploreLink = links.find(l => l.getAttribute('href') === '/explore');
    expect(exploreLink).toBeTruthy();
  });
});

describe('SecondaryJumbotron component', () => {
  it('renders SecondaryJumbotron without crashing', () => {
    const { container } = render(<SecondaryJumbotron />, { wrapper: Wrapper });
    expect(container).toBeInTheDocument();
  });

  it('renders a learn link', () => {
    render(<SecondaryJumbotron />, { wrapper: Wrapper });
    const links = screen.getAllByRole('link');
    const learnLink = links.find(l => l.getAttribute('href') === '/learn');
    expect(learnLink).toBeTruthy();
  });
});

describe('MappingFlow component', () => {
  it('renders MappingFlow without crashing', () => {
    const { container } = render(<MappingFlow />, { wrapper: Wrapper });
    expect(container).toBeInTheDocument();
  });
});

describe('Testimonials component', () => {
  it('renders Testimonials without crashing', () => {
    const { container } = render(<Testimonials />, { wrapper: Wrapper });
    expect(container).toBeInTheDocument();
  });
});

describe('WhoIsMapping component', () => {
  it('renders WhoIsMapping without crashing', () => {
    const { container } = render(<WhoIsMapping />, { wrapper: Wrapper });
    expect(container).toBeInTheDocument();
  });
});
