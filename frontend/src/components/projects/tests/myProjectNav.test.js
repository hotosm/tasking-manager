import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';
import { QueryParamProvider } from 'use-query-params';
import { act, render, screen, waitFor } from '@testing-library/react';

import { MyProjectNav, FilterButton } from '../myProjectNav';
import {
  createComponentWithMemoryRouter,
  ReduxIntlProviders,
  renderWithRouter,
} from '../../../utils/testWithIntl';
import { store } from '../../../store';

describe('Manage Projects Top Navigation Bar', () => {
  it('should hide inaccessible components for mappers', () => {
    act(() => {
      store.dispatch({
        type: 'SET_USER_DETAILS',
        userDetails: { username: 'test', role: 'MAPPER' },
      });
    });

    const { container } = renderWithRouter(
      <QueryParamProvider adapter={ReactRouter6Adapter}>
        <ReduxIntlProviders>
          <MyProjectNav management={false} />
        </ReduxIntlProviders>
      </QueryParamProvider>,
    );

    expect(
      screen.getByRole('heading', {
        name: /my projects/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: /new/i,
      }),
    ).not.toBeInTheDocument();
    expect(screen.queryAllByRole('combobox').length).toBe(0);
    // Check for SVGs for dropdowns and list/vard view toggle
    expect(container.querySelectorAll('svg').length).toBe(2);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sort by/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /contributed/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /favorited/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /managed by me/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /created by me/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.queryByRole('graphics-symbol')).not.toBeInTheDocument();
  });

  it('should render correct details for management view', () => {
    act(() => {
      store.dispatch({
        type: 'SET_USER_DETAILS',
        userDetails: { username: 'test', role: 'ADMIN' },
      });
    });

    const { container } = renderWithRouter(
      <QueryParamProvider adapter={ReactRouter6Adapter}>
        <ReduxIntlProviders>
          <MyProjectNav management />
        </ReduxIntlProviders>
      </QueryParamProvider>,
    );

    expect(
      screen.getByRole('heading', {
        name: /manage projects/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /new/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('combobox').length).toBe(2);
    expect(screen.queryByRole('button', { name: /contributed/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /favorited/i })).not.toBeInTheDocument();
    expect(container.querySelectorAll('svg').length).toBe(7);
    expect(screen.getAllByRole('graphics-symbol').length).toBe(2);
  });

  it('should navigate to new project creation page on button click', async () => {
    const { user, router } = createComponentWithMemoryRouter(
      <QueryParamProvider adapter={ReactRouter6Adapter}>
        <ReduxIntlProviders>
          <MyProjectNav management />
        </ReduxIntlProviders>
      </QueryParamProvider>,
    );

    await user.click(
      screen.queryByRole('button', {
        name: /new/i,
      }),
    );
    await waitFor(() => expect(router.state.location.pathname).toBe('/manage/projects/new/'));
  });
});

describe('Filter Button Component', () => {
  it('should display correct classes for active buttons', () => {
    render(<FilterButton isActive>Click me!</FilterButton>);
    expect(screen.getByText(/click me!/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /click me!/i }).getAttribute('class')).toMatch(
      'bg-blue-grey white fw5',
    );
  });

  it('should display correct classes for inactive buttons', () => {
    render(<FilterButton isActive={false}>Click me!</FilterButton>);
    expect(screen.getByRole('button', { name: /click me!/i }).getAttribute('class')).toMatch(
      'bg-white blue-grey',
    );
  });

  it('should set query when clicked', async () => {
    const setQueryMock = jest.fn();
    const user = userEvent.setup();
    render(
      <FilterButton isActive={false} setQuery={setQueryMock}>
        Click me!
      </FilterButton>,
    );

    await user.click(screen.getByRole('button', { name: /click me!/i }));
    expect(setQueryMock).toHaveBeenCalled();
  });
});
