import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { 
  CompletionTabForMapping,
  CompletionTabForValidation,
  ReopenEditor,
  SidebarToggle,
  UnsavedMapChangesModalContent
} from '../actionSidebars';
import { ReduxIntlProviders, renderWithRouter, QueryClientProviders } from '../../../utils/testWithIntl';
import * as api from '../../../api/projects';

jest.mock('../../../api/projects', () => ({
  __esModule: true,
  ...jest.requireActual('../../../api/projects'),
  splitTask: jest.fn(),
  stopMapping: jest.fn(),
  submitMappingTask: jest.fn(),
  stopValidation: jest.fn(),
  submitValidationTask: jest.fn(),
}));

const renderComponent = (ui) => {
  return renderWithRouter(
    <QueryClientProviders>
      <ReduxIntlProviders>
        {ui}
      </ReduxIntlProviders>
    </QueryClientProviders>
  );
};

describe('CompletionTabForMapping', () => {
  const mockProject = { projectId: 1, projectInfo: { name: 'Test' } };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('lastProjectPathname', '/projects/1/tasks');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders correctly and handles submission', async () => {
    const setSelectedStatusMock = jest.fn();
    const setTaskCommentMock = jest.fn();

    api.submitMappingTask.mockResolvedValueOnce({ data: {} });

    renderComponent(
      <CompletionTabForMapping
        project={mockProject}
        tasksIds={[1]}
        showReadCommentsAlert={false}
        disableBadImagery={false}
        historyTabSwitch={jest.fn()}
        taskInstructions="Test instructions"
        disabled={false}
        contributors={[]}
        taskComment=""
        setTaskComment={setTaskCommentMock}
        selectedStatus="MAPPED"
        setSelectedStatus={setSelectedStatusMock}
      />
    );

    expect(screen.getByText('Test instructions')).toBeInTheDocument();
    
    // Status radio buttons
    const completeRadio = screen.getByLabelText(/Yes/i); // complete
    const incompleteRadio = screen.getByLabelText(/No/i); // incomplete
    const badImageryRadio = screen.getByLabelText(/The imagery is bad/i); // bad imagery

    expect(completeRadio).toBeChecked(); // Since selectedStatus="MAPPED"
    
    fireEvent.click(incompleteRadio);
    expect(setSelectedStatusMock).toHaveBeenCalledWith('READY');

    // Test Submit Task
    const submitBtn = screen.getByRole('button', { name: /Submit task/i });
    expect(submitBtn).not.toBeDisabled();
    
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.submitMappingTask).toHaveBeenCalled();
    });
  });

  it('handles splitting a task', async () => {
    api.splitTask.mockResolvedValueOnce({ data: { tasks: [{ taskId: 2 }, { taskId: 3 }] } });

    renderComponent(
      <CompletionTabForMapping
        project={mockProject}
        tasksIds={[1]}
        selectedStatus="MAPPED"
        setSelectedStatus={jest.fn()}
        setTaskComment={jest.fn()}
      />
    );

    const splitBtn = screen.getByRole('button', { name: /Split task/i });
    fireEvent.click(splitBtn);

    await waitFor(() => {
      expect(api.splitTask).toHaveBeenCalled();
    });
  });

  it('handles split task error', async () => {
    api.splitTask.mockRejectedValueOnce({ response: { data: { SubCode: 'SmallToSplit' } } });

    renderComponent(
      <CompletionTabForMapping
        project={mockProject}
        tasksIds={[1]}
        selectedStatus="MAPPED"
        setSelectedStatus={jest.fn()}
        setTaskComment={jest.fn()}
      />
    );

    const splitBtn = screen.getByRole('button', { name: /Split task/i });
    fireEvent.click(splitBtn);

    await waitFor(() => {
      expect(screen.getByText(/This task is already too small/i)).toBeInTheDocument();
    });
  });

  it('handles stopping mapping', async () => {
    api.stopMapping.mockResolvedValueOnce({ data: {} });

    renderComponent(
      <CompletionTabForMapping
        project={mockProject}
        tasksIds={[1]}
        selectedStatus="MAPPED"
        setSelectedStatus={jest.fn()}
        setTaskComment={jest.fn()}
      />
    );

    const stopBtn = screen.getByRole('button', { name: /Select another task/i });
    fireEvent.click(stopBtn);

    await waitFor(() => {
      expect(api.stopMapping).toHaveBeenCalled();
    });
  });

  it('shows unsaved changes modal when disabled and clicking buttons', async () => {
    renderComponent(
      <CompletionTabForMapping
        project={mockProject}
        tasksIds={[1]}
        disabled={true}
        selectedStatus="MAPPED"
        setSelectedStatus={jest.fn()}
        setTaskComment={jest.fn()}
        setTaskComment={jest.fn()}
      />
    );

    const stopBtn = screen.getByRole('button', { name: /Select another task/i });
    fireEvent.click(stopBtn);

    await waitFor(() => {
      expect(screen.getByText(/Unsaved map changes/i)).toBeInTheDocument();
    });
  });
});

describe('CompletionTabForValidation', () => {
  const mockProject = { projectId: 1, projectInfo: { name: 'Test' } };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly and allows submitting validation', async () => {
    api.submitValidationTask.mockResolvedValueOnce({ data: {} });

    const setValidationStatusMock = jest.fn();
    const setValidationCommentsMock = jest.fn();

    renderComponent(
      <CompletionTabForValidation
        project={mockProject}
        tasksIds={[1, 2]}
        taskInstructions="Val instructions"
        disabled={false}
        contributors={[]}
        validationStatus={{ 1: 'VALIDATED', 2: 'VALIDATED' }}
        setValidationStatus={setValidationStatusMock}
        validationComments={{ 1: '', 2: '' }}
        setValidationComments={setValidationCommentsMock}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Submit tasks/i });
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.submitValidationTask).toHaveBeenCalled();
    });
  });

  it('handles stopping validation', async () => {
    api.stopValidation.mockResolvedValueOnce({ data: {} });

    renderComponent(
      <CompletionTabForValidation
        project={mockProject}
        tasksIds={[1]}
        validationStatus={{}}
        setValidationStatus={jest.fn()}
        validationComments={{}}
        setValidationComments={jest.fn()}
      />
    );

    const stopBtn = screen.getByRole('button', { name: /Stop validation/i });
    fireEvent.click(stopBtn);

    await waitFor(() => {
      expect(api.stopValidation).toHaveBeenCalled();
    });
  });
});

describe('Other components', () => {
  it('ReopenEditor renders', () => {
    const callEditorMock = jest.fn();
    renderComponent(
      <ReopenEditor
        project={{ mappingEditors: ['ID', 'JOSM'], customEditor: null }}
        action="MAPPING"
        editor="ID"
        callEditor={callEditorMock}
      />
    );
    expect(screen.getAllByText(/Reload editor/i).length).toBeGreaterThan(0);
  });

  it('SidebarToggle renders and handles click', () => {
    const setShowSidebarMock = jest.fn();
    renderComponent(
      <SidebarToggle setShowSidebar={setShowSidebarMock} activeEditor="JOSM" />
    );
    
    const icon = screen.getByRole('button', { name: /Hide sidebar/i });
    fireEvent.click(icon);
    expect(setShowSidebarMock).toHaveBeenCalledWith(false);
  });

  it('UnsavedMapChangesModalContent renders', () => {
    renderComponent(<UnsavedMapChangesModalContent close={jest.fn()} action="unlock" />);
    expect(screen.getByText(/Unsaved map changes/i)).toBeInTheDocument();
  });
});
