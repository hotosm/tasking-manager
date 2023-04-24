import '@testing-library/jest-dom';
import TestRenderer from 'react-test-renderer';
import { FormattedMessage } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  LockedTaskModalContent,
  SameProjectLock,
  AnotherProjectLock,
  LicenseError,
  LockError,
} from '../lockedTasks';
import {
  createComponentWithMemoryRouter,
  createComponentWithReduxAndIntl,
  IntlProviders,
  ReduxIntlProviders,
  renderWithRouter,
} from '../../../utils/testWithIntl';
import { store } from '../../../store';
import messages from '../messages';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({
    pathname: 'localhost:3000/example/path',
  }),
}));

describe('test LockedTaskModalContent', () => {
  const { act } = TestRenderer;
  it('return SameProjectLock message', () => {
    act(() => {
      store.dispatch({ type: 'SET_PROJECT', project: 1 });
      store.dispatch({ type: 'SET_LOCKED_TASKS', tasks: [21] });
      store.dispatch({ type: 'SET_TASKS_STATUS', status: 'LOCKED_FOR_MAPPING' });
    });
    const instance = createComponentWithReduxAndIntl(
      <MemoryRouter>
        <LockedTaskModalContent project={{ projectId: 1 }} error={null} />
      </MemoryRouter>,
    );
    const element = instance.root;
    expect(element.findByType(SameProjectLock)).toBeTruthy();
  });

  it('return SameProjectLock message', () => {
    act(() => {
      store.dispatch({ type: 'SET_PROJECT', project: 2 });
      store.dispatch({ type: 'SET_LOCKED_TASKS', tasks: [21] });
      store.dispatch({ type: 'SET_TASKS_STATUS', status: 'LOCKED_FOR_MAPPING' });
    });
    const instance = createComponentWithReduxAndIntl(
      <MemoryRouter>
        <LockedTaskModalContent project={{ projectId: 1 }} error={null} />
      </MemoryRouter>,
    );
    const element = instance.root;
    expect(element.findByType(AnotherProjectLock)).toBeTruthy();
  });

  it('return LicenseError message', () => {
    act(() => {
      store.dispatch({ type: 'SET_PROJECT', project: null });
      store.dispatch({ type: 'SET_LOCKED_TASKS', tasks: [] });
      store.dispatch({ type: 'SET_TASKS_STATUS', status: null });
    });
    const instance = createComponentWithReduxAndIntl(
      <LockedTaskModalContent
        project={{ projectId: 1, licenseId: 123 }}
        error={'UserLicenseError'}
      />,
    );
    const element = instance.root;
    expect(element.findByType(LicenseError)).toBeTruthy();
  });

  it('return JosmError message', () => {
    act(() => {
      store.dispatch({ type: 'SET_PROJECT', project: null });
      store.dispatch({ type: 'SET_LOCKED_TASKS', tasks: [] });
      store.dispatch({ type: 'SET_TASKS_STATUS', status: null });
    });
    const instance = createComponentWithReduxAndIntl(
      <LockedTaskModalContent project={{ projectId: 1, licenseId: 123 }} error={'JOSM'} />,
    );
    const element = instance.root;
    expect(element.findByType(LockError)).toBeTruthy();
    expect(element.findAllByType(FormattedMessage).length).toBe(3);
  });

  it('return forbidden to map the task message', () => {
    act(() => {
      store.dispatch({ type: 'SET_PROJECT', project: null });
      store.dispatch({ type: 'SET_LOCKED_TASKS', tasks: [] });
      store.dispatch({ type: 'SET_TASKS_STATUS', status: null });
    });
    const instance = createComponentWithReduxAndIntl(
      <LockedTaskModalContent project={{ projectId: 1, licenseId: 123 }} error={'FORBIDDEN'} />,
    );
    const element = instance.root;
    expect(element.findByType(LockError)).toBeTruthy();
  });

  it('return no map tasks selected message', () => {
    act(() => {
      store.dispatch({ type: 'SET_PROJECT', project: null });
      store.dispatch({ type: 'SET_LOCKED_TASKS', tasks: [] });
      store.dispatch({ type: 'SET_TASKS_STATUS', status: null });
    });
    const instance = createComponentWithReduxAndIntl(
      <LockedTaskModalContent
        project={{ projectId: 1, licenseId: 123 }}
        error={'noMappedTasksSelected'}
      />,
    );
    const element = instance.root;
    expect(element.findByType(LockError)).toBeTruthy();
  });

  it('return LockError message', () => {
    act(() => {
      store.dispatch({ type: 'SET_PROJECT', project: null });
      store.dispatch({ type: 'SET_LOCKED_TASKS', tasks: [] });
      store.dispatch({ type: 'SET_TASKS_STATUS', status: null });
    });
    const instance = createComponentWithReduxAndIntl(
      <LockedTaskModalContent project={{ projectId: 1, licenseId: 123 }} error={'BAD REQUEST'} />,
    );
    const element = instance.root;
    expect(element.findByType(LockError)).toBeTruthy();
  });
});

describe('License Modal', () => {
  it('should accept the license', async () => {
    const lockTasksMock = jest.fn();
    const user = userEvent.setup();
    render(
      <ReduxIntlProviders>
        <LicenseError id="456" lockTasks={lockTasksMock} />
      </ReduxIntlProviders>,
    );
    await screen.findByText('Sample License');
    await user.click(
      screen.getByRole('button', {
        name: /accept/i,
      }),
    );
    await waitFor(() => expect(lockTasksMock).toHaveBeenCalled());
  });

  it('should decline request to accept the license', async () => {
    const closeMock = jest.fn();
    const user = userEvent.setup();
    render(
      <ReduxIntlProviders>
        <LicenseError id="456" close={closeMock} />
      </ReduxIntlProviders>,
    );
    await screen.findByText('Sample License');
    await user.click(
      screen.getByRole('button', {
        name: /cancel/i,
      }),
    );
    expect(closeMock).toHaveBeenCalled();
  });
});

describe('LockError for CannotValidateMappedTask', () => {
  it('should display the Deselect and continue button', () => {
    render(
      <ReduxIntlProviders>
        <LockError error="CannotValidateMappedTask" selectedTasks={[1, 2, 3]} />
      </ReduxIntlProviders>,
    );
    expect(screen.getByRole('button', { name: 'Deselect and validate' })).toBeInTheDocument();
  });

  it('should not display the Deselect and continue button if only one task is selected for validation', () => {
    render(
      <ReduxIntlProviders>
        <LockError error="CannotValidateMappedTask" selectedTasks={[1]} />
      </ReduxIntlProviders>,
    );
    expect(screen.queryByRole('button', { name: 'Deselect and validate' })).not.toBeInTheDocument();
  });

  it('should lock tasks after deselecting the tasks that the user mapped from the list of selected tasks', async () => {
    const lockTasksFnMock = jest.fn();
    const setSelectedTasksFnMock = jest.fn();
    const dummyTasks = {
      features: [
        {
          properties: {
            taskId: 1,
            mappedBy: 123, // Same value as the logged in user's username
          },
        },
        {
          properties: {
            taskId: 2,
            mappedBy: 321,
          },
        },
      ],
    };

    act(() => {
      store.dispatch({
        type: 'SET_USER_DETAILS',
        userDetails: { id: 123 },
      });
    });

    render(
      <ReduxIntlProviders>
        <LockError
          error="CannotValidateMappedTask"
          selectedTasks={[1, 2]}
          lockTasks={lockTasksFnMock}
          setSelectedTasks={setSelectedTasksFnMock}
          tasks={dummyTasks}
        />
      </ReduxIntlProviders>,
    );
    const user = userEvent.setup();
    await user.click(screen.queryByRole('button', { name: 'Deselect and validate' }));
    expect(lockTasksFnMock).toHaveBeenCalledTimes(1);
  });
});

test('SameProjectLock should display relevant message when user has multiple tasks locked', async () => {
  const lockedTasksSample = {
    project: 5871,
    tasks: [1811, 1222],
    status: 'LOCKED_FOR_VALIDATION',
  };
  const { user, router } = createComponentWithMemoryRouter(
    <IntlProviders>
      <SameProjectLock lockedTasks={lockedTasksSample} action="validate" />
    </IntlProviders>,
  );
  expect(
    screen.getByText(messages.currentProjectLockTextPlural.defaultMessage),
  ).toBeInTheDocument();
  await user.click(
    screen.getByRole('button', {
      name: 'Validate those tasks',
    }),
  );
  await waitFor(() => expect(router.state.location.pathname).toBe('/projects/5871/validate/'));
});

test('AnotherProjectLock should display relevant message when user has multiple tasks locked', async () => {
  renderWithRouter(
    <IntlProviders>
      <AnotherProjectLock projectId={1234} lockedTasksLength={2} action="validate" />
    </IntlProviders>,
  );
  expect(
    screen.getByText(
      /You will need to update the status of that task before you can map another task./i,
    ),
  ).toBeInTheDocument();
});
