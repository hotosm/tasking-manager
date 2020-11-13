import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { navigate } from '@reach/router';
import { useQueryParam, StringParam } from 'use-query-params';
import { FormattedMessage } from 'react-intl';
import ReactPlaceholder from 'react-placeholder';

import messages from './messages';
import { useFetch } from '../hooks/UseFetch';
import { fetchLocalJSONAPI } from '../network/genericJSONRequest';
import { Button } from '../components/button';
import { TaskMapAction } from '../components/taskSelection/action';
import { AnotherProjectLock } from '../components/taskSelection/lockedTasks';
import { Login } from './login';

export function MapTask({ id }: Object) {
  return <TaskAction project={id} action="MAPPING" />;
}

export function ValidateTask({ id }: Object) {
  return <TaskAction project={id} action="VALIDATION" />;
}

export function TaskAction({ project, action }: Object) {
  const userDetails = useSelector((state) => state.auth.get('userDetails'));
  const token = useSelector((state) => state.auth.get('token'));
  const locale = useSelector((state) => state.preferences.locale);
  // eslint-disable-next-line
  const [editor, setEditor] = useQueryParam('editor', StringParam);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (userDetails.id && token && action && project) {
      fetchLocalJSONAPI(`users/queries/tasks/locked/details/`, token, 'GET', locale)
        .then((res) => {
          setTasks(res.tasks);
          setLoading(false);
        })
        .catch((e) => navigate(`/projects/${project}/tasks/`));
    }
  }, [action, userDetails.id, token, project, locale]);
  if (token) {
    if (loading) {
      return (
        <ReactPlaceholder
          showLoadingAnimation={true}
          type="text"
          rows={4}
          delay={10}
          ready={!loading}
        >
          Loading...
        </ReactPlaceholder>
      );
    }
    // if user has not locked tasks on the system, suggest him to go to the task selection page of the current project
    if (tasks.length === 0) {
      return (
        <div className="cf pull-center pa4">
          <p>
            <FormattedMessage
              {...messages.noLockedTasksMessage}
              values={{ currentProject: project }}
            />
          </p>
          <Button className="bg-red white" onClick={() => navigate(`/projects/${project}/tasks/`)}>
            <FormattedMessage {...messages.goToProjectButton} values={{ project: project }} />
          </Button>
        </div>
      );
    }
    // if user has locked tasks on another project, suggest him to go update it
    if (tasks.length > 0 && tasks[0].projectId !== Number(project)) {
      const action = tasks[0].taskStatus === 'LOCKED_FOR_VALIDATION' ? 'validate' : 'map';
      return (
        <div className="cf tc blue-dark pull-center pa4">
          <AnotherProjectLock
            projectId={tasks[0].projectId}
            action={action}
            lockedTasksLength={tasks.length}
          />
        </div>
      );
    }
    if (tasks.length > 0 && tasks[0].projectId === Number(project)) {
      return <TaskActionPossible project={project} tasks={tasks} action={action} editor={editor} />;
    }
  } else {
    return (
      <Login redirectTo={`/projects/${project}/${action === 'VALIDATION' ? 'validate' : 'map'}/`} />
    );
  }
}

export function TaskActionPossible({ project, tasks, action, editor }) {
  const [tasksGeojson, setTasksGeojson] = useState();
  const [projectDataError, projectDataLoading, projectData] = useFetch(
    `projects/${project}/queries/summary/`,
    project,
  );
  useEffect(() => {
    if (project && tasks) {
      fetchLocalJSONAPI(`projects/${project}/tasks/`).then((res) => setTasksGeojson(res));
    }
  }, [project, tasks]);
  return (
    <div className="cf w-100">
      <ReactPlaceholder
        showLoadingAnimation={true}
        type="media"
        rows={26}
        delay={10}
        ready={!projectDataError && !projectDataLoading && tasksGeojson !== null}
      >
        <TaskMapAction
          project={projectData}
          projectIsReady={!projectDataError && !projectDataLoading}
          tasks={tasksGeojson}
          activeTasks={tasks}
          action={action}
          editor={editor}
        />
      </ReactPlaceholder>
    </div>
  );
}
