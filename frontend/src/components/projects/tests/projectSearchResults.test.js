import '@testing-library/jest-dom';
import { screen, act } from '@testing-library/react';

import { ReduxIntlProviders, IntlProviders, renderWithRouter } from '../../../utils/testWithIntl';
import {
  ExploreProjectCards,
  ExploreProjectList,
  ProjectSearchResults,
} from '../projectSearchResults';
import { projects } from '../../../network/tests/mockData/projects';
import { store } from '../../../store';

describe('Project Search Results', () => {
  it('should display project cards', () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <ProjectSearchResults
          status={'success'}
          projects={projects.results}
          pagination={{
            total: 11,
          }}
        />
      </ReduxIntlProviders>,
    );

    expect(screen.getByText('Showing 2 of 11 projects')).toBeInTheDocument();
    expect(screen.getAllByRole('article').length).toBe(2);
    expect(screen.getByRole('heading', { name: 'NRCS_Duduwa Mapping' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'NRCS_Khajura Mapping' })).toBeInTheDocument();
  });

  it('should not display card views when toggled to list view', () => {
    act(() => {
      store.dispatch({
        type: 'TOGGLE_LIST_VIEW',
      });
    });

    renderWithRouter(
      <ReduxIntlProviders>
        <ProjectSearchResults management status="success" projects={projects.results} />
      </ReduxIntlProviders>,
    );

    expect(screen.queryAllByRole('article').length).toBe(0);
    expect(
      screen.getAllByRole('link', {
        name: /edit/i,
      }).length,
    ).toBe(2);
  });

  it('should display error and provide actionable to retry', async () => {
    const retryFn = jest.fn();
    const { user } = renderWithRouter(
      <ReduxIntlProviders>
        <ProjectSearchResults status="error" projects={[]} retryFn={retryFn} />
      </ReduxIntlProviders>,
    );

    expect(screen.getByText('Error loading the Projects for Explore Projects')).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: /retry/i });
    expect(retryBtn).toBeInTheDocument();
    await user.click(retryBtn);
    expect(retryFn).toHaveBeenCalled();
  });

  it('should display loading indicators', async () => {
    const { container } = renderWithRouter(
      <ReduxIntlProviders>
        <ProjectSearchResults status="loading" projects={[]} />
      </ReduxIntlProviders>,
    );
    expect(container.getElementsByClassName('show-loading-animation').length).toBeGreaterThan(0);
  });

  it('should display 0 projects if the pagination total is absent', async () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <ProjectSearchResults status="success" projects={projects.results} />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('Showing 2 of 0 projects')).toBeInTheDocument();
  });
});

test('ExploreProjectCards should display empty DOM element when no project is passed as props', () => {
  const { container } = renderWithRouter(
    <IntlProviders>
      <ExploreProjectCards pageOfCards={[]} />
    </IntlProviders>,
  );
  expect(container).toBeEmptyDOMElement();
});

test('ExploreProjectList should display empty DOM element when no project is passed as props', () => {
  const { container } = renderWithRouter(
    <IntlProviders>
      <ExploreProjectList pageOfCards={[]} />
    </IntlProviders>,
  );
  expect(container).toBeEmptyDOMElement();
});
