import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryParam, StringParam } from 'use-query-params';
import { FormattedMessage } from 'react-intl';
import ReactPlaceholder from 'react-placeholder';

import messages from './messages';
import { Button } from '../components/button';
import { TaskMapAction } from '../components/taskSelection/action';
import { AnotherProjectLock } from '../components/taskSelection/lockedTasks';
import { useLockedTasksQuery } from '../api/user';
import { useProjectSummaryQuery, useTasksQuery } from '../api/projects';

export function MapTask() {
  const { id } = useParams();
  return <TaskAction projectId={id} action="MAPPING" />;
}

export function ValidateTask() {
  const { id } = useParams();
  return <TaskAction projectId={id} action="VALIDATION" />;
}

export function TaskAction({ projectId, action }: Object) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  // eslint-disable-next-line
  const [editor, setEditor] = useQueryParam('editor', StringParam);

  const { status: lockedTasksStatus, data: lockedTasks, refetch: getTasks } = useLockedTasksQuery();

  useEffect(() => {
    dispatch({ type: 'SET_VISIBILITY', isVisible: false });
    return () => {
      dispatch({ type: 'SET_VISIBILITY', isVisible: true });
    };
  }, [dispatch]);

  useEffect(() => {
    if (!token) {
      navigate('/login', {
        state: {
          from: `/projects/${projectId}/${action === 'VALIDATION' ? 'validate' : 'map'}/`,
        },
      });
    }
  }, [action, navigate, projectId, token]);

  if (lockedTasksStatus === 'loading') {
    return (
      <ReactPlaceholder showLoadingAnimation={true} type="text" rows={4} delay={10}>
        Loading...
      </ReactPlaceholder>
    );
  }

  if (lockedTasksStatus === 'success') {
    // if user has not locked tasks on the system, suggest him to go to the task selection page of the current project
    if (lockedTasks.length === 0) {
      return (
        <div className="cf pull-center pa4">
          <p>
            <FormattedMessage
              {...messages.noLockedTasksMessage}
              values={{ currentProject: projectId }}
            />
          </p>
          <Button
            className="bg-red white"
            onClick={() => navigate(`/projects/${projectId}/tasks/`)}
          >
            <FormattedMessage {...messages.goToProjectButton} values={{ project: projectId }} />
          </Button>
        </div>
      );
    }

    // if user has locked tasks on another project, suggest him to go update it
    if (lockedTasks.length > 0 && lockedTasks[0].projectId !== Number(projectId)) {
      const action = lockedTasks[0].taskStatus === 'LOCKED_FOR_VALIDATION' ? 'validate' : 'map';
      return (
        <div className="cf tc blue-dark pull-center pa4">
          <AnotherProjectLock
            projectId={lockedTasks[0].projectId}
            action={action}
            lockedTasksLength={lockedTasks.length}
          />
        </div>
      );
    }

    if (lockedTasks.length > 0 && lockedTasks[0].projectId === Number(projectId)) {
      return (
        <TaskActionPossible
          projectId={projectId}
          lockedTasks={lockedTasks}
          action={action}
          editor={editor}
          getTasks={getTasks}
        />
      );
    }
  }
  return null;
}

export function TaskActionPossible({ projectId, lockedTasks, action, editor, getTasks }) {
  const { data: project, status: projectStatus } = useProjectSummaryQuery(projectId, {
    useErrorBoundary: true,
  });
  const { data: tasks, status: tasksStatus } = useTasksQuery(projectId, { useErrorBoundary: true });

  return (
    <div className="cf w-100">
      <ReactPlaceholder
        showLoadingAnimation
        type="media"
        rows={26}
        delay={10}
        ready={projectStatus === 'success' && tasksStatus === 'success'}
      >
        <TaskMapAction
          project={project}
          tasks={tasks}
          activeTasks={lockedTasks}
          getTasks={getTasks}
          action={action}
          editor={editor}
        />
      </ReactPlaceholder>
    </div>
  );
}
