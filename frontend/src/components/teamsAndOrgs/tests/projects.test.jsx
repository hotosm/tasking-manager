import '@testing-library/jest-dom';
import { screen, waitFor } from '@testing-library/react';

import { Projects } from '../projects';
import { projects } from '../../../network/tests/mockData/projects';
import {
  createComponentWithMemoryRouter,
  IntlProviders,
  renderWithRouter,
} from '../../../utils/testWithIntl';

describe('Projects component', () => {
  it('should display loading placeholder when API is being fetched', () => {
    const { container } = renderWithRouter(
      <IntlProviders>
        <Projects projects={[]} viewAllEndpoint="/view/all" />
      </IntlProviders>,
    );
    expect(container.getElementsByClassName('show-loading-animation')).toHaveLength(20);
  });

  it('should display component details and projects passed', () => {
    renderWithRouter(
      <IntlProviders>
        <Projects projects={projects} viewAllEndpoint="/view/all" showAddButton />
      </IntlProviders>,
    );
    expect(screen.getByRole('heading', { name: /projects/i })).toBeInTheDocument();
    expect(screen.getAllByRole('article').length).toBe(2);
    expect(screen.getByRole('heading', { name: projects.results[0].name }));
    expect(screen.getByRole('heading', { name: projects.results[1].name }));
    expect(screen.getByRole('button', { name: /new/i })).toBeInTheDocument();
  });

  it('should navigate to project creation page on new button click', async () => {
    const { user, router } = createComponentWithMemoryRouter(
      <IntlProviders>
        <Projects projects={projects} viewAllEndpoint="/view/all" showAddButton />
      </IntlProviders>,
    );
    await user.click(screen.getByRole('button', { name: /new/i }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/manage/projects/new/'));
  });

  it('should display no projects found message', () => {
    renderWithRouter(
      <IntlProviders>
        <Projects ownerEntity="user" projects={{ results: [] }} viewAllEndpoint="/view/all" />
      </IntlProviders>,
    );
    expect(screen.getByText(/doesn't have projects yet/i)).toBeInTheDocument();
  });

  it('should navigate to manage projects page when view all is clicked ', async () => {
    const { user, router } = createComponentWithMemoryRouter(
      <IntlProviders>
        <Projects projects={projects} viewAllEndpoint="/path/to/view/all" />
      </IntlProviders>,
    );
    await user.click(
      screen.getByRole('link', {
        name: /view all/i,
      }),
    );
    await waitFor(() => expect(router.state.location.pathname).toBe('/path/to/view/all'));
  });
});
