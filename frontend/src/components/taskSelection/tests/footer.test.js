import '@testing-library/jest-dom';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { act, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { Imagery } from '../imagery';
import { MappingTypes } from '../../mappingTypes';
import TaskSelectionFooter from '../footer';
import { Button } from '../../button';
import {
  createComponentWithMemoryRouter,
  createComponentWithReduxAndIntl,
  ReduxIntlProviders,
} from '../../../utils/testWithIntl';
import { getProjectSummary } from '../../../network/tests/mockData/projects';
import { setupFaultyHandlers } from '../../../network/tests/server';
import messages from '../messages';
import { store } from '../../../store';
import tasksGeojson from '../../../utils/tests/snippets/tasksGeometry';

describe('test if footer', () => {
  it('has MappingTypes with ROADS and BUILDINGS', () => {
    const element = createComponentWithReduxAndIntl(
      <MemoryRouter>
        <TaskSelectionFooter
          project={{
            projectId: 1,
            mappingTypes: ['ROADS', 'BUILDINGS'],
            mappingEditors: ['ID', 'JOSM'],
          }}
          taskAction={'mapSelectedTask'}
        />
      </MemoryRouter>,
    );
    const testInstance = element.root;
    expect(testInstance.findByType(MappingTypes).props.types).toStrictEqual(['ROADS', 'BUILDINGS']);
  });

  it('has imagery component returning the correct message', () => {
    const element = createComponentWithReduxAndIntl(
      <MemoryRouter>
        <TaskSelectionFooter
          project={{
            projectId: 3,
            mappingEditors: ['ID', 'JOSM'],
            mappingTypes: ['ROADS', 'BUILDINGS'],
            imagery:
              'tms[1,22]:https://service.com/earthservice/tms/Layer@EPSG:3857@jpg/{zoom}/{x}/{-y}.jpg',
          }}
          taskAction={'mapATask'}
        />
      </MemoryRouter>,
    );
    const testInstance = element.root;
    expect(testInstance.findByType(Imagery).props.value).toBe(
      'tms[1,22]:https://service.com/earthservice/tms/Layer@EPSG:3857@jpg/{zoom}/{x}/{-y}.jpg',
    );
  });

  it('returns the correct contribute button message when action is "mapATask"', () => {
    const element = createComponentWithReduxAndIntl(
      <MemoryRouter>
        <TaskSelectionFooter
          project={{ projectId: 1, mappingTypes: ['LAND_USE'], mappingEditors: ['ID', 'JOSM'] }}
          taskAction={'mapATask'}
        />
      </MemoryRouter>,
    );
    const testInstance = element.root;
    expect(testInstance.findByType(Button).findByType(FormattedMessage).props.id).toBe(
      'project.selectTask.footer.button.mapRandomTask',
    );
  });

  it('returns the correct contribute button message when action is "selectAnotherProject"', () => {
    const element = createComponentWithReduxAndIntl(
      <MemoryRouter>
        <TaskSelectionFooter
          project={{ projectId: 1, mappingTypes: ['LAND_USE'], mappingEditors: ['ID', 'JOSM'] }}
          taskAction={'selectAnotherProject'}
        />
      </MemoryRouter>,
    );
    const testInstance = element.root;
    expect(testInstance.findByType(Button).findByType(FormattedMessage).props.id).toBe(
      'project.selectTask.footer.button.selectAnotherProject',
    );
  });

  it('returns the correct contribute button message when action is "mappingIsComplete"', () => {
    const element = createComponentWithReduxAndIntl(
      <MemoryRouter>
        <TaskSelectionFooter
          project={{ projectId: 1, mappingTypes: ['LAND_USE'], mappingEditors: ['ID', 'JOSM'] }}
          taskAction={'mappingIsComplete'}
        />
      </MemoryRouter>,
    );
    const testInstance = element.root;
    expect(testInstance.findByType(Button).findByType(FormattedMessage).props.id).toBe(
      'project.selectTask.footer.button.selectAnotherProject',
    );
  });

  it('returns the correct contribute button message when action is "projectIsComplete"', () => {
    const element = createComponentWithReduxAndIntl(
      <MemoryRouter>
        <TaskSelectionFooter
          project={{ projectId: 1, mappingTypes: ['LAND_USE'], mappingEditors: ['ID', 'JOSM'] }}
          taskAction={'projectIsComplete'}
        />
      </MemoryRouter>,
    );
    const testInstance = element.root;
    expect(testInstance.findByType(Button).findByType(FormattedMessage).props.id).toBe(
      'project.selectTask.footer.button.selectAnotherProject',
    );
  });

  it('returns the correct contribute button message when taskAction is "validateSelectedTask"', () => {
    const element = createComponentWithReduxAndIntl(
      <MemoryRouter>
        <TaskSelectionFooter
          project={{
            projectId: 1,
            mappingTypes: ['LAND_USE'],
            mappingEditors: ['ID', 'JOSM'],
            validationEditors: ['ID', 'JOSM'],
          }}
          taskAction={'validateSelectedTask'}
        />
      </MemoryRouter>,
    );
    const testInstance = element.root;
    expect(testInstance.findByType(Button).findByType(FormattedMessage).props.id).toBe(
      'project.selectTask.footer.button.validateSelectedTask',
    );
  });
});

describe('Footer Lock Tasks', () => {
  const clearReduxStore = () =>
    act(() => {
      store.dispatch({ type: 'SET_PROJECT', project: null });
      store.dispatch({ type: 'SET_LOCKED_TASKS', tasks: [] });
      store.dispatch({ type: 'SET_TASKS_STATUS', status: null });
    });

  it('should display task cannot be locked for mapping message', async () => {
    await clearReduxStore();
    setupFaultyHandlers();
    const { user } = createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <TaskSelectionFooter
          defaultUserEditor="ID"
          project={getProjectSummary(3212)}
          selectedTasks={[2]}
          taskAction="mapATask"
        />
      </ReduxIntlProviders>,
    );
    await user.click(
      screen.getByRole('button', {
        name: /map a task/i,
      }),
    );
    await waitFor(() => {
      expect(screen.getByText(messages.lockError.defaultMessage)).toBeInTheDocument();
    });
  });

  it('should display no mapped tasks selected message', async () => {
    await clearReduxStore();
    setupFaultyHandlers();
    const { user } = createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <TaskSelectionFooter
          defaultUserEditor="ID"
          project={getProjectSummary(3212)}
          selectedTasks={[2]}
          taskAction="validateATask"
          tasks={tasksGeojson}
        />
      </ReduxIntlProviders>,
    );
    await user.click(
      screen.getByRole('button', {
        name: /validate a task/i,
      }),
    );
    await waitFor(() => {
      expect(
        screen.getByText(messages.noMappedTasksSelectedError.defaultMessage),
      ).toBeInTheDocument();
    });
  });

  it('should display task cannot be locked for validation message', async () => {
    await clearReduxStore();
    setupFaultyHandlers();
    const { user } = createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <TaskSelectionFooter
          defaultUserEditor="ID"
          project={getProjectSummary(3212)}
          selectedTasks={[11]}
          taskAction="validateATask"
          tasks={tasksGeojson}
        />
      </ReduxIntlProviders>,
    );
    await user.click(
      screen.getByRole('button', {
        name: /validate a task/i,
      }),
    );
    await waitFor(() => {
      expect(screen.getByText(messages.lockError.defaultMessage)).toBeInTheDocument();
    });
  });

  it('should display JOSM error', async () => {
    setupFaultyHandlers();
    const { user } = createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <TaskSelectionFooter
          defaultUserEditor="JOSM"
          project={getProjectSummary(123)}
          selectedTasks={[1]}
          taskAction="mapATask"
        />
      </ReduxIntlProviders>,
    );
    await user.click(
      screen.getByRole('button', {
        name: /map a task/i,
      }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole('heading', {
          name: messages.JOSMError.defaultMessage,
        }),
      ).toBeInTheDocument(),
    );
    await user.click(
      screen.getByRole('button', {
        name: /close/i,
      }),
    );
    expect(
      screen.queryByRole('heading', {
        name: messages.JOSMError.defaultMessage,
      }),
    ).not.toBeInTheDocument();
  });

  it('should navigate to explore page for a complete project', async () => {
    const { user, router } = createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <TaskSelectionFooter project={getProjectSummary(222)} taskAction="selectAnotherProject" />
      </ReduxIntlProviders>,
    );
    await user.click(
      screen.getByRole('button', {
        name: /select another project/i,
      }),
    );
    expect(router.state.location.pathname).toBe('/explore/');
  });

  it('should navigate to task action page on mapping a task', async () => {
    const { user, router } = createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <TaskSelectionFooter
          defaultUserEditor="ID"
          project={getProjectSummary(123)}
          selectedTasks={[1]}
          taskAction="mapATask"
          tasks={tasksGeojson}
        />
      </ReduxIntlProviders>,
    );
    await user.click(
      screen.getByRole('button', {
        name: /map a task/i,
      }),
    );
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/projects/123/map/');
      expect(router.state.location.search).toBe('?editor=ID');
    });
  });

  it('should navigate to task action page on validating a task', async () => {
    await clearReduxStore();
    const { user, router } = createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <TaskSelectionFooter
          defaultUserEditor="ID"
          project={getProjectSummary(123)}
          selectedTasks={[11]}
          taskAction="validateATask"
          tasks={tasksGeojson}
        />
      </ReduxIntlProviders>,
    );
    await user.click(
      screen.getByRole('button', {
        name: /validate a task/i,
      }),
    );
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/projects/123/validate/');
      expect(router.state.location.search).toBe('?editor=ID');
    });
  });

  it('should resume mapping', async () => {
    await clearReduxStore();
    const { user, router } = createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <TaskSelectionFooter
          defaultUserEditor="ID"
          project={getProjectSummary(123)}
          selectedTasks={[1]}
          taskAction="resumeMapping"
          tasks={tasksGeojson}
        />
      </ReduxIntlProviders>,
    );
    await user.click(
      screen.getByRole('button', {
        name: /resume mapping/i,
      }),
    );
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/projects/123/map/');
      expect(router.state.location.search).toBe('?editor=ID');
    });
  });

  it('should resume validation', async () => {
    await clearReduxStore();
    const { user, router } = createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <TaskSelectionFooter
          defaultUserEditor="ID"
          project={getProjectSummary(123)}
          selectedTasks={[1]}
          taskAction="resumeValidation"
          tasks={tasksGeojson}
        />
      </ReduxIntlProviders>,
    );
    await user.click(
      screen.getByRole('button', {
        name: /resume validation/i,
      }),
    );
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/projects/123/validate/');
      expect(router.state.location.search).toBe('?editor=ID');
    });
  });

  it('should fallback editor when user default is not in the list for validation', async () => {
    await clearReduxStore();
    const { user, router } = createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <TaskSelectionFooter
          defaultUserEditor="someRandomEditor"
          project={getProjectSummary(123)}
          selectedTasks={[1]}
          taskAction="resumeValidation"
          tasks={tasksGeojson}
        />
      </ReduxIntlProviders>,
    );
    await user.click(
      screen.getByRole('button', {
        name: /resume validation/i,
      }),
    );
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/projects/123/validate/');
      expect(router.state.location.search).toBe('?editor=ID');
    });
  });

  it('should fallback editor when user default is not in the list for mapping', async () => {
    await clearReduxStore();
    const { user, router } = createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <TaskSelectionFooter
          defaultUserEditor="someRandomEditor"
          project={getProjectSummary(123)}
          selectedTasks={[1]}
          taskAction="resumeMapping"
          tasks={tasksGeojson}
        />
      </ReduxIntlProviders>,
    );
    await user.click(
      screen.getByRole('button', {
        name: /resume mapping/i,
      }),
    );
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/projects/123/map/');
      expect(router.state.location.search).toBe('?editor=ID');
    });
  });

  // TODO: it should handle the window object reference for custom editor
});
