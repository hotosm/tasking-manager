import '@testing-library/jest-dom';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CompletionTabForMapping, CompletionTabForValidation } from '../actionSidebars';
import { ReduxIntlProviders, renderWithRouter } from '../../../utils/testWithIntl';
import { setupFaultyHandlers } from '../../../network/tests/server';
import messages from '../messages';

describe('Appeareance of unsaved map changes to be dealt with while mapping', () => {
  test('when splitting a task', async () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <CompletionTabForMapping disabled />
      </ReduxIntlProviders>,
    );
    await userEvent.click(screen.getByRole('button', { name: /split task/i }));
    expect(
      screen.getByRole('heading', {
        name: messages.unsavedChanges.defaultMessage,
      }),
    ).toBeInTheDocument();
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: /close/i,
      }),
    );
    expect(
      screen.queryByRole('heading', {
        name: messages.unsavedChanges.defaultMessage,
      }),
    ).not.toBeInTheDocument();
  });

  test('when submitting a task', async () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <CompletionTabForMapping disabled />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText(messages.unsavedChangesTooltip.defaultMessage)).toBeInTheDocument();
  });

  test('when selecting another task', async () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <CompletionTabForMapping disabled />
      </ReduxIntlProviders>,
    );
    await userEvent.click(
      screen.getByRole('button', {
        name: /select another task/i,
      }),
    );
    expect(
      screen.getByRole('heading', {
        name: messages.unsavedChanges.defaultMessage,
      }),
    ).toBeInTheDocument();
  });
});

describe('Miscellaneous modals and prompts', () => {
  test('should display/hide split task error', async () => {
    setupFaultyHandlers();
    renderWithRouter(
      <ReduxIntlProviders>
        <CompletionTabForMapping project={{ projectId: 123 }} tasksIds={[1997]} />
      </ReduxIntlProviders>,
    );

    await userEvent.click(
      screen.getByRole('button', {
        name: /split task/i,
      }),
    );
    await waitFor(() =>
      expect(screen.getByText('It was not possible to split the task')).toBeInTheDocument(),
    );
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: /close/i,
      }),
    );
    expect(screen.queryByText('It was not possible to split the task')).not.toBeInTheDocument();
  });

  test('should prompt the user to read comments', async () => {
    const historyTabSwitchMock = jest.fn();
    renderWithRouter(
      <ReduxIntlProviders>
        <CompletionTabForMapping showReadCommentsAlert historyTabSwitch={historyTabSwitchMock} />
      </ReduxIntlProviders>,
    );

    expect(screen.getByText(messages.readTaskComments.defaultMessage)).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', {
        name: messages.readTaskComments.defaultMessage,
      }),
    );
    expect(historyTabSwitchMock).toHaveBeenCalledTimes(1);
  });

  test('should display/hide help text', async () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <CompletionTabForMapping showReadCommentsAlert />
      </ReduxIntlProviders>,
    );
    await userEvent.click(screen.getByLabelText('toggle help'));
    expect(screen.getByText(messages.instructionsSelect.defaultMessage)).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText('hide instructions'));
    expect(screen.queryByText(messages.instructionsSelect.defaultMessage)).not.toBeInTheDocument();
  });

  test('should display/hide task specific instructions', async () => {
    const instruction = 'this is a sample instruction';
    renderWithRouter(
      <ReduxIntlProviders>
        <CompletionTabForMapping taskInstructions={instruction} />
      </ReduxIntlProviders>,
    );

    expect(screen.getByText(instruction)).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', {
        name: messages.taskExtraInfo.defaultMessage,
      }),
    );
    expect(screen.queryByText(instruction)).not.toBeInTheDocument();
  });
});

describe('Appeareance of unsaved map changes to be dealt with while validating', () => {
  test('when stopping validation session', async () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <CompletionTabForValidation disabled validationStatus={{}} tasksIds={[]} />
      </ReduxIntlProviders>,
    );
    await userEvent.click(screen.getByRole('button', { name: /stop validation/i }));
    expect(
      screen.getByRole('heading', {
        name: messages.unsavedChanges.defaultMessage,
      }),
    ).toBeInTheDocument();
  });

  test('when submitting a task', async () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <CompletionTabForValidation disabled validationStatus={{}} tasksIds={[]} />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText(messages.unsavedChangesTooltip.defaultMessage)).toBeInTheDocument();
  });
});
