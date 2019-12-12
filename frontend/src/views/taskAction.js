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
import { Login } from './login';

export function MapTask({ id }: Object) {
  return <TaskAction project={id} action="MAPPING" />
}

export function ValidateTask({ id }: Object) {
  return <TaskAction project={id} action="VALIDATION" />
}

export function TaskAction({ project, action }: Object) {
  const userDetails = useSelector(state => state.auth.get('userDetails'));
  const token = useSelector(state => state.auth.get('token'));
  // eslint-disable-next-line
  const [editor, setEditor] = useQueryParam('editor', StringParam);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(
    () => {
      if (userDetails.id && token && action) {
        fetchLocalJSONAPI(`users/${userDetails.id}/tasks/?status=LOCKED_FOR_${action}`, token).then(
          res => {
            console.log(res);
            setTasks(res.tasks);
            setLoading(false);
          }
        );
      }
    }, [action, userDetails.id, token]
  );
  if (token) {
    if (loading) {
      return <ReactPlaceholder
        showLoadingAnimation={true}
        type="text"
        rows={4}
        delay={10}
        ready={!loading}
      >
      </ReactPlaceholder>
    }
    if (tasks.length === 0) {
      return (
        <div className="cf pull-center pa4">
          <p>
            <FormattedMessage {...messages.noLockedTasksMessage} values={{currentProject: project}} />
          </p>
          <Button className="bg-red white" onClick={() => navigate(`/projects/${project}/tasks/`)} >
            <FormattedMessage {...messages.goToProjectButton} values={{project: project}} />
          </Button>
        </div>
      );
    }
    if (tasks.length > 0 && tasks[0].projectId !== Number(project)) {
      return (
        <div className="cf tc blue-dark pull-center pa4">
          <p className="pv4">
            <FormattedMessage {...messages.noLockedTasksOnProjectMessage} values={{currentProject: project, lockedProject: tasks[0].projectId }} />
          </p>
          <Button className="bg-red white" onClick={() => navigate(`/projects/${project}/tasks/`)}>
            <FormattedMessage {...messages.goToProjectButton} values={{project: tasks[0].projectId}}/>
          </Button>
        </div>
      );
    }
    if (tasks.length > 0 && tasks[0].projectId === Number(project)) {
      return <TaskActionPossible project={project} tasks={tasks} action={action} editor={editor} />
    }
  } else {
    return <Login redirect_to={`projects/${project}/${action}/` } />;
  }
}

export function TaskActionPossible({project, tasks, action, editor}) {
  const [tasksGeojson, setTasksGeojson] = useState();
  // eslint-disable-next-line
  const [projectDataError, projectDataLoading, projectData] = useFetch(
    `projects/${project}/queries/summary/`,
    project
  );
  useEffect(
    () => {
      if (project && tasks) {
        fetchLocalJSONAPI(`projects/${project}/tasks/?tasks=${tasks.map(i=>i.taskId).join(',')}`)
          .then(res => setTasksGeojson(res));
      }
    }, [project, tasks]
  );
  return (
    <div className="cf">
      <TaskMapAction project={projectData} tasks={tasksGeojson} action={action} editor={editor} />
    </div>
  );
}
