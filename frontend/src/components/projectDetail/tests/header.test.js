import React from 'react';
import { screen, act, render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { HeaderLine, ProjectHeader, TagLine } from '../header';
import { ReduxIntlProviders, IntlProviders, renderWithRouter } from '../../../utils/testWithIntl';
import { getProjectSummary } from '../../../network/tests/mockData/projects';
import { store } from '../../../store';

describe('test if HeaderLine component', () => {
  it('shows id 2 and HIGH priority status for a HOT project to a user with edit rights', () => {
    renderWithRouter(
      <IntlProviders>
        <HeaderLine projectId={2} priority={'HIGH'} showEditLink={true} organisation={'HOT'} />
      </IntlProviders>,
    );

    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('#2').closest('a').href).toContain('projects/2');
    expect(screen.getByText('| HOT')).toBeInTheDocument();
    expect(screen.getByText('Edit project')).toBeInTheDocument();
    expect(screen.getByText('Edit project').closest('a').href).toContain('/manage/projects/2');
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('shows id 1 for a LOW priority HOT project to a user with no edit rights', () => {
    renderWithRouter(
      <IntlProviders>
        <HeaderLine projectId={1} priority={'LOW'} showEditLink={false} organisation={'HOT'} />
      </IntlProviders>,
    );

    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#1').closest('a').href).toContain('projects/1');
    expect(screen.getByText('| HOT')).toBeInTheDocument();
    expect(screen.queryByText('Edit project')).not.toBeInTheDocument();
    expect(screen.queryByText('Low')).toBeInTheDocument();
  });
});

describe('test if ProjectHeader component', () => {
  const project = getProjectSummary(1);
  it('shows Header for urgent priority project for logged in project author', () => {
    act(() => {
      store.dispatch({ type: 'SET_LOCALE', locale: 'en-US' });
      store.dispatch({
        type: 'SET_USER_DETAILS',
        userDetails: { username: 'test_user' },
      });
    });
    renderWithRouter(
      <ReduxIntlProviders>
        <ProjectHeader project={project} showEditLink={true} />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#1').closest('a').href).toContain('projects/1');
    expect(screen.getByText('| HOT')).toBeInTheDocument();
    expect(screen.getByText('Edit project')).toBeInTheDocument();
    expect(screen.getByText('Edit project').closest('a').href).toContain('/manage/projects/1');
    expect(screen.getByText('Urgent')).toBeInTheDocument();
    expect(screen.getByText('La Paz Buildings')).toBeInTheDocument();
    expect(screen.getByText('La Paz Buildings').closest('h3').lang).toBe('en');
    expect(screen.getByText(/Environment Conservation/i)).toBeInTheDocument();
    expect(screen.getByText(/Women security/i)).toBeInTheDocument();
    expect(screen.getByText('Bolivia')).toBeInTheDocument();
    expect(screen.queryByText(/private/i)).not.toBeInTheDocument();
  });

  it('shows Header for urgent priority project for non-logged in user', () => {
    act(() => {
      store.dispatch({ type: 'SET_LOCALE', locale: 'en-US' });
    });
    renderWithRouter(
      <ReduxIntlProviders>
        <ProjectHeader project={project} showEditLink={false} />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#1').closest('a').href).toContain('projects/1');
    expect(screen.getByText('| HOT')).toBeInTheDocument();
    expect(screen.queryByText('Edit project')).not.toBeInTheDocument();
    expect(screen.getByText('Urgent')).toBeInTheDocument();
    expect(screen.getByText('La Paz Buildings')).toBeInTheDocument();
    expect(screen.getByText('La Paz Buildings').closest('h3').lang).toBe('en');
    expect(screen.getByText(/Environment Conservation/i)).toBeInTheDocument();
    expect(screen.getByText(/Women security/i)).toBeInTheDocument();
    expect(screen.getByText('Bolivia')).toBeInTheDocument();
    expect(screen.queryByText(/private/i)).not.toBeInTheDocument();
  });

  it('shows Header for low priority draft project for logged in user', () => {
    act(() => {
      store.dispatch({ type: 'SET_LOCALE', locale: 'en-US' });
      store.dispatch({
        type: 'SET_USER_DETAILS',
        userDetails: { username: 'user123' },
      });
    });
    renderWithRouter(
      <ReduxIntlProviders>
        <ProjectHeader
          project={{ ...project, projectPriority: 'LOW', status: 'DRAFT' }}
          showEditLink={true}
        />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#1').closest('a').href).toContain('projects/1');
    expect(screen.getByText('| HOT')).toBeInTheDocument();
    expect(screen.queryByText('Edit project')).not.toBeInTheDocument();
    expect(screen.queryByText('Low')).toBeInTheDocument();
    expect(screen.queryByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('La Paz Buildings')).toBeInTheDocument();
    expect(screen.getByText('La Paz Buildings').closest('h3').lang).toBe('en');
    expect(screen.getByText(/Environment Conservation/i)).toBeInTheDocument();
    expect(screen.getByText('Bolivia')).toBeInTheDocument();
    expect(screen.queryByText(/private/i)).not.toBeInTheDocument();
  });
});

describe('TagLine', () => {
  it('renders tags with proper formatting', () => {
    const campaigns = [{ name: 'Campaign 1' }, { name: 'Campaign 2' }];
    const countries = ['Country 1'];
    const interests = [{ name: 'Interest 1' }, { name: 'Interest 2' }];

    const { container } = render(
      <ReduxIntlProviders>
        <TagLine campaigns={campaigns} countries={countries} interests={interests} />
      </ReduxIntlProviders>,
    );

    const tagLineElement = container.querySelector('.blue-light');
    const tagElements = tagLineElement.querySelectorAll('span');
    expect(tagElements.length).toBe(5);
    expect(tagElements[0].textContent).toBe('Campaign 1, Campaign 2');
    expect(tagElements[1].textContent).toBe('·Country 1');
    expect(tagElements[2].textContent).toBe('·');
    expect(tagElements[3].textContent).toBe('·Interest 1, Interest 2');
    expect(tagElements[4].textContent).toBe('·');
  });

  it('renders tags without bullet separators if there is only one tag', () => {
    const campaigns = [{ name: 'Campaign 1' }];
    const countries = [];
    const interests = [];

    const { container } = render(
      <ReduxIntlProviders>
        <TagLine campaigns={campaigns} countries={countries} interests={interests} />
      </ReduxIntlProviders>,
    );
    const tagLineElement = container.querySelector('.blue-light');
    const tagElements = tagLineElement.querySelectorAll('span');
    expect(tagElements.length).toBe(1);
    expect(tagElements[0].textContent).toBe('Campaign 1');
  });

  it('renders an empty tag line if no tags are provided', () => {
    const campaigns = [];
    const countries = [];
    const interests = [];

    const { container } = render(
      <ReduxIntlProviders>
        <TagLine campaigns={campaigns} countries={countries} interests={interests} />
      </ReduxIntlProviders>,
    );
    const tagLineElement = container.querySelector('.blue-light');
    const tagElements = tagLineElement.querySelectorAll('span');
    expect(tagElements.length).toBe(0);
  });
});
