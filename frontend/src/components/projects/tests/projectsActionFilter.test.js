import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';

import { store } from '../../../store';
import { ReduxIntlProviders } from '../../../utils/testWithIntl';
import { ProjectsActionFilter } from '../projectsActionFilter';

describe('ProjectsActionFilter', () => {
  const myMock = jest.fn();
  it('test initialization and state changes', () => {
    render(
      <ReduxIntlProviders>
        <ProjectsActionFilter fullProjectsQuery={{ action: undefined }} setQuery={myMock} />
      </ReduxIntlProviders>,
    );
    expect(screen.queryByText('Projects to map')).toBeInTheDocument();
    expect(screen.queryByText('Projects to validate')).not.toBeInTheDocument();
    expect(screen.queryByText('Any project')).not.toBeInTheDocument();
    // open dropdown
    fireEvent.click(screen.queryByText('Projects to map'));
    expect(screen.queryByText('Projects to validate')).toBeInTheDocument();
    expect(screen.queryByText('Any project')).toBeInTheDocument();
    // select Projects to validate
    fireEvent.click(screen.queryByText('Projects to validate'));
    expect(store.getState()['preferences']['action']).toBe('validate');
    // select Any projects
    fireEvent.click(screen.queryByText('Projects to validate'));
    fireEvent.click(screen.queryByText('Any project'));
    expect(store.getState()['preferences']['action']).toBe('any');
    // select Projects to map
    fireEvent.click(screen.queryByText('Any project'));
    fireEvent.click(screen.queryByText('Projects to map'));
    expect(store.getState()['preferences']['action']).toBe('map');
  });
  it('initialize it with validate action set', () => {
    render(
      <ReduxIntlProviders>
        <ProjectsActionFilter fullProjectsQuery={{ action: 'validate' }} setQuery={myMock} />
      </ReduxIntlProviders>,
    );
    expect(screen.queryByText('Projects to validate')).toBeInTheDocument();
    fireEvent.click(screen.queryByText('Projects to validate'));
    fireEvent.click(screen.queryByText('Any project'));
    expect(store.getState()['preferences']['action']).toBe('any');
    expect(myMock).toHaveBeenCalledTimes(1);
  });
  it('with an advanced user, the action is set as any', () => {
    act(() => {
      store.dispatch({
        type: 'SET_USER_DETAILS',
        userDetails: { username: 'abc', mappingLevel: 'ADVANCED' },
      });
    });
    render(
      <ReduxIntlProviders localStore={store}>
        <ProjectsActionFilter fullProjectsQuery={{ action: undefined }} setQuery={myMock} />
      </ReduxIntlProviders>,
    );
    expect(screen.queryByText('Any project')).toBeInTheDocument();
    expect(store.getState()['preferences']['action']).toBe('any');
  });
});
