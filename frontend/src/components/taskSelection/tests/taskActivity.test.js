import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TaskActivity, TaskDataDropdown, TaskHistory } from '../taskActivity';
import { ReduxIntlProviders, renderWithRouter, QueryClientProviders } from '../../../utils/testWithIntl';

jest.mock('../../../utils/openEditor', () => ({
  __esModule: true,
  getIdUrl: jest.fn(() => 'http://id.editor'),
  sendJosmCommands: jest.fn(),
}));

jest.mock('../../../utils/osmchaLink', () => ({
  __esModule: true,
  formatOSMChaLink: jest.fn(() => 'http://osmcha.link'),
}));

const mockProject = {
  projectId: 1,
  projectInfo: { name: 'Test Project' },
  changesetComment: '#test',
};

jest.mock('../../../api/projects', () => ({
  __esModule: true,
  useTaskDetail: jest.fn(),
}));

const renderComponent = (ui) => {
  return renderWithRouter(
    <QueryClientProviders>
      <ReduxIntlProviders initialState={{ auth: { userDetails: { id: 1, username: 'test_user' }, token: 'abc' } }}>
        {ui}
      </ReduxIntlProviders>
    </QueryClientProviders>
  );
};

describe('TaskHistory Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { useTaskDetail } = require('../../../api/projects');
    useTaskDetail.mockReturnValue({ data: { taskHistory: [] }, status: 'success' });
  });

  it('renders correctly with activities', async () => {
    const { useTaskDetail } = require('../../../api/projects');
    useTaskDetail.mockReturnValueOnce({
      data: {
        taskHistory: [
          { historyId: 1, action: 'COMMENT', actionText: 'Test', actionBy: 'user1', actionDate: '2021-01-01' },
          { historyId: 2, action: 'STATE_CHANGE', actionText: 'MAPPED', actionBy: 'user1', actionDate: '2021-01-02' }
        ]
      },
      status: 'success'
    });

    renderComponent(<TaskHistory projectId={1} taskId={1} />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('view task history options')).toBeInTheDocument();
    });

    const commentsRadio = screen.getByLabelText(/Comments/i);
    expect(commentsRadio).toBeChecked();
    
    // Switch to activities
    const activitiesRadio = screen.getByLabelText(/Activities/i);
    fireEvent.click(activitiesRadio);
    expect(activitiesRadio).toBeChecked();

    // Switch to all
    const allRadio = screen.getByLabelText(/All/i);
    fireEvent.click(allRadio);
    expect(allRadio).toBeChecked();
  });

  it('renders loading state', () => {
    const { useTaskDetail } = require('../../../api/projects');
    useTaskDetail.mockReturnValueOnce({ data: null, status: 'loading' });
    const { container } = renderComponent(<TaskHistory projectId={1} taskId={1} />);
    expect(container.querySelector('.show-loading-animation')).toBeInTheDocument();
  });

  it('renders error state', () => {
    const { useTaskDetail } = require('../../../api/projects');
    useTaskDetail.mockReturnValueOnce({ data: null, status: 'error' });
    renderComponent(<TaskHistory projectId={1} taskId={1} />);
    expect(screen.getByText(/Error occurred while fetching task detail/i)).toBeInTheDocument();
  });

  it('renders no activities state', () => {
    const { useTaskDetail } = require('../../../api/projects');
    useTaskDetail.mockReturnValueOnce({
      data: { taskHistory: [] },
      status: 'success'
    });
    renderComponent(<TaskHistory projectId={1} taskId={1} />);
    expect(screen.getByText(/No activities to display/i)).toBeInTheDocument();
  });
});

describe('TaskDataDropdown Component', () => {
  it('renders correctly', () => {
    const history = {
      taskHistory: [
        { action: 'STATE_CHANGE', actionText: 'MAPPED', actionBy: 'user1', actionDate: '2021-01-01' },
      ],
    };
    renderComponent(<TaskDataDropdown history={history} changesetComment="#test" bbox={[0,0,1,1]} />);
    expect(screen.getByText(/Task Data/i)).toBeInTheDocument();
  });

  it('does not render if no history', () => {
    const history = { taskHistory: [] };
    const { container } = renderComponent(<TaskDataDropdown history={history} changesetComment="#test" bbox={[0,0,1,1]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('TaskActivity Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { useTaskDetail } = require('../../../api/projects');
    useTaskDetail.mockReturnValue({ data: { taskHistory: [] }, status: 'success' });
  });

  it('renders and handles close', async () => {
    const closeMock = jest.fn();
    renderComponent(
      <TaskActivity
        taskId={1}
        status="MAPPED"
        project={mockProject}
        bbox={[0,0,1,1]}
        close={closeMock}
        userCanValidate={true}
      />
    );
    expect(screen.getByText(/Task Activity/i)).toBeInTheDocument();
    expect(screen.getByText(/#1: Test Project/i)).toBeInTheDocument();

    const closeIcon = document.querySelector('svg.fr'); // CloseIcon has class fr pointer
    fireEvent.click(closeIcon);
    expect(closeMock).toHaveBeenCalled();
  });

  it('renders EditorDropdown for VALIDATED status', async () => {
    renderComponent(
      <TaskActivity
        taskId={1}
        status="VALIDATED"
        project={mockProject}
        bbox={[0,0,1,1]}
        close={jest.fn()}
        userCanValidate={true}
      />
    );
    expect(screen.getByText(/Open Editor/i)).toBeInTheDocument();
    expect(screen.getByText(/Revert VALIDATED/i)).toBeInTheDocument();
  });

  it('handles undo last task action', async () => {
    const updateActivitiesMock = jest.fn();
    renderComponent(
      <TaskActivity
        taskId={1}
        status="VALIDATED"
        project={mockProject}
        bbox={[0,0,1,1]}
        close={jest.fn()}
        updateActivities={updateActivitiesMock}
        userCanValidate={true}
      />
    );

    const revertBtn = screen.getByText(/Revert VALIDATED/i);
    fireEvent.click(revertBtn);

    const yesBtn = screen.getByText(/Yes/i);
    const noBtn = screen.getByText(/No/i);
    expect(yesBtn).toBeInTheDocument();
    expect(noBtn).toBeInTheDocument();

    // cancel
    fireEvent.click(noBtn);
    expect(screen.getByText(/Revert VALIDATED/i)).toBeInTheDocument();

    // confirm
    fireEvent.click(revertBtn);
    fireEvent.click(screen.getByText(/Yes/i));

    // Wait for resetTask to resolve
    await waitFor(() => {
      expect(screen.queryByText(/Revert VALIDATED/i)).not.toBeInTheDocument();
    });
  });

  it.skip('allows posting a comment', async () => {
    renderComponent(
      <TaskActivity
        taskId={1}
        status="MAPPED"
        project={mockProject}
        bbox={[0,0,1,1]}
        close={jest.fn()}
        userCanValidate={true}
      />
    );
    
    // Wait for comment input field to be available
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Test comment' } });
    
    const submitBtn = screen.getByRole('button', { name: /Comment/i });
    expect(submitBtn).not.toBeDisabled();
    
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it.skip('handles loading task on editor iD', async () => {
    renderComponent(
      <TaskActivity
        taskId={1}
        status="VALIDATED"
        project={mockProject}
        bbox={[0,0,1,1]}
        close={jest.fn()}
        userCanValidate={true}
      />
    );
    
    const dropdown = screen.getByText(/Open Editor/i);
    fireEvent.click(dropdown);
    
    // Using a broader match for the ID option since it might have other elements or classes
    const idOption = await screen.findByText('iD Editor');
    fireEvent.click(idOption);
    
    expect(require('../../../utils/openEditor').getIdUrl).toHaveBeenCalled();
  });

  it.skip('handles loading task on editor JOSM', async () => {
    renderComponent(
      <TaskActivity
        taskId={1}
        status="VALIDATED"
        project={mockProject}
        bbox={[0,0,1,1]}
        close={jest.fn()}
        userCanValidate={true}
      />
    );
    
    const dropdown = screen.getByText(/Open Editor/i);
    fireEvent.click(dropdown);
    
    const josmOption = await screen.findByText('JOSM');
    fireEvent.click(josmOption);
    
    expect(require('../../../utils/openEditor').sendJosmCommands).toHaveBeenCalled();
  });
});
