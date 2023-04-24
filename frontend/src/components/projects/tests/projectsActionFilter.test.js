import { screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';

import { store } from '../../../store';
import { ReduxIntlProviders, renderWithRouter } from '../../../utils/testWithIntl';
import { ProjectsActionFilter } from '../projectsActionFilter';

describe('ProjectsActionFilter', () => {
  const myMock = jest.fn();
  it('test initialization and state changes', async () => {
    const { user } = renderWithRouter(
      <ReduxIntlProviders>
        <ProjectsActionFilter fullProjectsQuery={{ action: undefined }} setQuery={myMock} />
      </ReduxIntlProviders>,
    );
    expect(screen.queryByText('Any project')).toBeInTheDocument();
    expect(screen.queryByText('Projects to map')).not.toBeInTheDocument();
    expect(screen.queryByText('Projects to validate')).not.toBeInTheDocument();
    expect(screen.queryByText('Archived')).not.toBeInTheDocument();
    // open dropdown
    await user.click(screen.queryByText('Any project'));
    expect(screen.queryByText('Projects to map')).toBeInTheDocument();
    expect(screen.queryByText('Projects to validate')).toBeInTheDocument();
    expect(screen.queryByText('Archived')).toBeInTheDocument();
    // select Projects to validate
    await user.click(screen.queryByText('Projects to validate'));
    expect(store.getState()['preferences']['action']).toBe('validate');
    // select Any projects
    await user.click(screen.queryByText('Projects to validate'));
    await user.click(screen.queryByText('Any project'));
    expect(store.getState()['preferences']['action']).toBe('any');
    // select Projects to map
    await user.click(screen.queryByText('Any project'));
    await user.click(screen.queryByText('Projects to map'));
    expect(store.getState()['preferences']['action']).toBe('map');
    // select Projects to archived, action set to any for this special case
    await user.click(screen.queryByText('Projects to map'));
    await user.click(screen.queryByText(/archived/i));
    expect(store.getState()['preferences']['action']).toBe('any');
  });

  it('initialize it with validate action set', async () => {
    const { user } = renderWithRouter(
      <ReduxIntlProviders>
        <ProjectsActionFilter fullProjectsQuery={{ action: 'validate' }} setQuery={myMock} />
      </ReduxIntlProviders>,
    );
    expect(screen.queryByText('Projects to validate')).toBeInTheDocument();
    await user.click(screen.queryByText('Projects to validate'));
    await user.click(screen.queryByText('Any project'));
    expect(store.getState()['preferences']['action']).toBe('any');
    expect(myMock).toHaveBeenCalledTimes(2);
  });

  it('with an advanced user, the action is set as any', () => {
    act(() => {
      store.dispatch({
        type: 'SET_USER_DETAILS',
        userDetails: { username: 'abc', mappingLevel: 'ADVANCED' },
      });
    });
    renderWithRouter(
      <ReduxIntlProviders localStore={store}>
        <ProjectsActionFilter fullProjectsQuery={{ action: undefined }} setQuery={myMock} />
      </ReduxIntlProviders>,
    );
    expect(screen.queryByText('Any project')).toBeInTheDocument();
    expect(store.getState()['preferences']['action']).toBe('any');
  });
});
