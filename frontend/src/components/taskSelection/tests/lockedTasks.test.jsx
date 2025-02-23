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
  IntlProviders,
  ReduxIntlProviders,
  renderWithRouter,
} from '../../../utils/testWithIntl';
import { store } from '../../../store';
import messages from '../messages';

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useLocation: () => ({
    pathname: 'localhost:3000/example/path',
  }),
}));

describe('test LockedTaskModalContent', () => {
  it('return SameProjectLock message', () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <LockedTaskModalContent project={{ projectId: 1 }} error={null} />
      </ReduxIntlProviders>,
    );
    act(() => {
      store.dispatch({ type: 'SET_PROJECT', project: 1 });
      store.dispatch({ type: 'SET_LOCKED_TASKS', tasks: [21] });
      store.dispatch({ type: 'SET_TASKS_STATUS', status: 'LOCKED_FOR_MAPPING' });
    });
    expect(screen.getByText(messages.anotherLockedTask.defaultMessage)).toBeInTheDocument();
  });

  it('return AnotherProjectLock message', () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <LockedTaskModalContent project={{ projectId: 1 }} error={null} />
      </ReduxIntlProviders>,
    );
    act(() => {
      store.dispatch({ type: 'SET_PROJECT', project: 2 });
      store.dispatch({ type: 'SET_LOCKED_TASKS', tasks: [21] });
      store.dispatch({ type: 'SET_TASKS_STATUS', status: 'LOCKED_FOR_MAPPING' });
    });
    expect(screen.getByText(messages.anotherLockedTask.defaultMessage)).toBeInTheDocument();
    expect(screen.getByRole('link')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/projects/2/map/');
  });

  it('return LicenseError message', () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <LockedTaskModalContent
          project={{ projectId: 1, licenseId: 123 }}
          error={'UserLicenseError'}
        />
      </ReduxIntlProviders>,
    );
    act(() => {
      store.dispatch({ type: 'SET_PROJECT', project: null });
      store.dispatch({ type: 'SET_LOCKED_TASKS', tasks: [] });
      store.dispatch({ type: 'SET_TASKS_STATUS', status: null });
    });
    expect(screen.getByText(messages.lockErrorLicense.defaultMessage)).toBeInTheDocument();
  });

  it('return JosmError message', () => {
    render(
      <ReduxIntlProviders>
        <LockedTaskModalContent project={{ projectId: 1, licenseId: 123 }} error={'JOSM'} />
      </ReduxIntlProviders>,
    );
    act(() => {
      store.dispatch({ type: 'SET_PROJECT', project: null });
      store.dispatch({ type: 'SET_LOCKED_TASKS', tasks: [] });
      store.dispatch({ type: 'SET_TASKS_STATUS', status: null });
    });
    expect(screen.getByText(messages.JOSMError.defaultMessage)).toBeInTheDocument();
    expect(screen.getByText(messages.JOSMErrorDescription.defaultMessage)).toBeInTheDocument();
    // TODO: Check this
    // expect(element.findAllByType(FormattedMessage).length).toBe(3);
  });

  it('return forbidden to map the task message', () => {
    render(
      <ReduxIntlProviders>
        <LockedTaskModalContent project={{ projectId: 1, licenseId: 123 }} error={'FORBIDDEN'} />
      </ReduxIntlProviders>,
    );
    act(() => {
      store.dispatch({ type: 'SET_PROJECT', project: null });
      store.dispatch({ type: 'SET_LOCKED_TASKS', tasks: [] });
      store.dispatch({ type: 'SET_TASKS_STATUS', status: null });
    });
    expect(screen.getByText(messages.lockError.defaultMessage)).toBeInTheDocument();
  });

  it('return no map tasks selected message', () => {
    render(
      <ReduxIntlProviders>
        <LockedTaskModalContent
          project={{ projectId: 1, licenseId: 123 }}
          error={'noMappedTasksSelected'}
        />
      </ReduxIntlProviders>,
    );
    act(() => {
      store.dispatch({ type: 'SET_PROJECT', project: null });
      store.dispatch({ type: 'SET_LOCKED_TASKS', tasks: [] });
      store.dispatch({ type: 'SET_TASKS_STATUS', status: null });
    });
    expect(
      screen.getByText(messages.noMappedTasksSelectedError.defaultMessage),
    ).toBeInTheDocument();
  });

  it('return LockError message', () => {
    render(
      <ReduxIntlProviders>
        <LockedTaskModalContent project={{ projectId: 1, licenseId: 123 }} error={'BAD REQUEST'} />
      </ReduxIntlProviders>,
    );
    act(() => {
      store.dispatch({ type: 'SET_PROJECT', project: null });
      store.dispatch({ type: 'SET_LOCKED_TASKS', tasks: [] });
      store.dispatch({ type: 'SET_TASKS_STATUS', status: null });
    });
    expect(screen.getByText(messages.lockError.defaultMessage)).toBeInTheDocument();
  });
});

describe('License Modal', () => {
  it('should accept the license', async () => {
    const lockTasksMock = vi.fn();
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
    const closeMock = vi.fn();
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
    const lockTasksFnMock = vi.fn();
    const setSelectedTasksFnMock = vi.fn();
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
