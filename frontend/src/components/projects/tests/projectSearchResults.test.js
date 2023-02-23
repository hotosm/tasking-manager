import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { screen, act } from '@testing-library/react';

import { ReduxIntlProviders, renderWithRouter } from '../../../utils/testWithIntl';
import { ProjectSearchResults } from '../projectSearchResults';
import { projects } from '../../../network/tests/mockData/projects';
import { store } from '../../../store';

describe('Project Search Results', () => {
  it('should display project cards', () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <ProjectSearchResults
          state={{ isLoading: false, isError: false, projects: projects.results }}
        />
      </ReduxIntlProviders>,
    );
    
    expect(screen.getByText('Showing 2 of 0 projects')).toBeInTheDocument();
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
    renderWithRouter(
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
});
