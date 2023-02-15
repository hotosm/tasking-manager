import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { render, screen, act } from '@testing-library/react';

import { IntlProviders, ReduxIntlProviders } from '../../../utils/testWithIntl';
import {
  ExploreProjectCards,
  ExploreProjectList,
  ProjectSearchResults,
} from '../projectSearchResults';
import { projects } from '../../../network/tests/mockData/projects';
import { store } from '../../../store';

describe('Project Search Results', () => {
  it('should display project cards', () => {
    render(
      <ReduxIntlProviders>
        <ProjectSearchResults
          state={{
            isLoading: false,
            isError: false,
            projects: projects.results,
            pagination: {
              total: 11,
            },
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

    render(
      <ReduxIntlProviders>
        <ProjectSearchResults management state={{ isLoading: false, projects: projects.results }} />
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
    render(
      <ReduxIntlProviders>
        <ProjectSearchResults state={{ isError: true, projects: [] }} retryFn={retryFn} />
      </ReduxIntlProviders>,
    );

    expect(screen.getByText('Error loading the Projects for Explore Projects')).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: /retry/i });
    expect(retryBtn).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(retryBtn);
    expect(retryFn).toHaveBeenCalled();
  });

  it('should display loading indicators', async () => {
    const { container } = render(
      <ReduxIntlProviders>
        <ProjectSearchResults state={{ isLoading: true, isError: false, projects: [] }} />
      </ReduxIntlProviders>,
    );
    expect(container.getElementsByClassName('show-loading-animation').length).toBeGreaterThan(0);
  });

  it('should display 0 projects if the pagination total is absent', async () => {
    render(
      <ReduxIntlProviders>
        <ProjectSearchResults
          state={{
            isLoading: false,
            isError: false,
            projects: projects.results,
          }}
        />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('Showing 2 of 0 projects')).toBeInTheDocument();
  });
});

test('ExploreProjectCards should display empty DOM element when no project is passed as props', () => {
  const { container } = render(
    <IntlProviders>
      <ExploreProjectCards pageOfCards={[]} />
    </IntlProviders>,
  );
  expect(container).toBeEmptyDOMElement();
});

test('ExploreProjectList should display empty DOM element when no project is passed as props', () => {
  const { container } = render(
    <IntlProviders>
      <ExploreProjectList pageOfCards={[]} />
    </IntlProviders>,
  );
  expect(container).toBeEmptyDOMElement();
});
