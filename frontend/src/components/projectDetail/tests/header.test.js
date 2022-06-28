import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';

import { HeaderLine, ProjectHeader } from '../header';
import { ReduxIntlProviders, IntlProviders } from '../../../utils/testWithIntl';
import { getProjectSummary } from '../../../network/tests/mockData/projects';
import { store } from '../../../store';

describe('test if HeaderLine component', () => {
  it('shows id 2 and HIGH priority status for a HOT project to a user with edit rights', () => {
    render(
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
    render(
      <IntlProviders>
        <HeaderLine projectId={1} priority={'LOW'} showEditLink={false} organisation={'HOT'} />
      </IntlProviders>,
    );

    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#1').closest('a').href).toContain('projects/1');
    expect(screen.getByText('| HOT')).toBeInTheDocument();
    expect(screen.queryByText('Edit project')).not.toBeInTheDocument();
    expect(screen.queryByText('Low')).not.toBeInTheDocument();
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
    render(
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
    expect(screen.getByText('Environment Conservation')).toBeInTheDocument();
    expect(screen.getByText('Women security')).toBeInTheDocument();
    expect(screen.getByText('Bolivia')).toBeInTheDocument();
    expect(screen.queryByText(/private/i)).not.toBeInTheDocument();
  });

  it('shows Header for urgent priority project for non-logged in user', () => {
    act(() => {
      store.dispatch({ type: 'SET_LOCALE', locale: 'en-US' });
    });
    render(
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
    expect(screen.getByText('Environment Conservation')).toBeInTheDocument();
    expect(screen.getByText('Women security')).toBeInTheDocument();
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
    render(
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
    expect(screen.queryByText('Low')).not.toBeInTheDocument(); //LOW priority tag should not be displayed
    expect(screen.queryByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('La Paz Buildings')).toBeInTheDocument();
    expect(screen.getByText('La Paz Buildings').closest('h3').lang).toBe('en');
    expect(screen.getByText('Environment Conservation')).toBeInTheDocument();
    expect(screen.getByText('Bolivia')).toBeInTheDocument();
    expect(screen.queryByText(/private/i)).not.toBeInTheDocument();
  });
});
