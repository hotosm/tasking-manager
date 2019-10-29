import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from '@reach/router';
import { FormattedMessage } from 'react-intl';
import ReactPlaceholder from 'react-placeholder';

import messages from './messages';
import { useFetch, useFetchIntervaled } from '../../hooks/UseFetch';
import { getTaskAction } from '../../utils/projectPermissions';
import { updateTasksStatus } from '../../utils/updateTasksStatus';
import { PriorityBox } from '../projectcard/projectCard';
import { TasksMap } from './map.js';
import { TaskSelectionFooter } from './footer';
import { TaskList } from './taskList';
import { htmlFromMarkdown } from '../projectDetail/htmlFromMarkdown';

export function HeaderLine({ author, projectId, priority }: Object) {
  const userLink = (
    <Link to={`/users/${author}`} className="link blue-dark underline">
      {author}
    </Link>
  );
  const projectIdLink = (
    <Link to={`/projects/${projectId}`} className="no-underline">
      <span className="blue-light">#{projectId}</span>
    </Link>
  );
  return (
    <div className="cf">
      <div className="w-70 dib fl">
        <span className="blue-dark">
          <FormattedMessage {...messages.createBy} values={{ user: userLink, id: projectIdLink }} />
        </span>
      </div>
      <div className="mw4 dib fr">
        <PriorityBox priority={priority} extraClasses={'pv2 ph3'} />
      </div>
    </div>
  );
}

export function TaskSelection({ project, type, loading }: Object) {
  // these two fetches are needed to initialize the component
  const [tasksError, tasksLoading, initialTasks] = useFetch(`projects/${project.projectId}/tasks/`);
  /* eslint-disable-next-line */
  const [tasksActivitiesError, tasksActivitiesLoading, initialActivities] = useFetch(
    `projects/${project.projectId}/activities/latest/`,
  );
  // get activities each 60 seconds
  /* eslint-disable-next-line */
  const [activitiesError, activities] = useFetchIntervaled(
    `projects/${project.projectId}/activities/latest/`,
    60000,
  );
  const user = useSelector(state => state.auth.get('userDetails'));
  const [tasks, setTasks] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [selected, setSelectedTasks] = useState([]);
  const [taskAction, setTaskAction] = useState('mapATask');

  useEffect(() => {
    setActiveSection(user.mappingLevel === 'BEGINNER' ? 'instructions' : 'tasks');
    setTasks(initialTasks);
  }, [user.mappingLevel, initialTasks]);

  useEffect(() => {
    if (initialTasks && activities) {
      setTasks(updateTasksStatus(initialTasks, activities));
    }
  }, [initialTasks, activities]);

  const htmlInstructions =
    project.projectInfo && htmlFromMarkdown(project.projectInfo.instructions);

  function selectTask(selection, status = null) {
    if (typeof selection === 'object') {
      setSelectedTasks(selection);
    } else {
      if (selected.includes(selection)) {
        setSelectedTasks([]);
        setTaskAction(getTaskAction(user, project, null));
      } else {
        setSelectedTasks([selection]);
        setTaskAction(getTaskAction(user, project, status));
      }
    }
  }

  return (
    <div>
      <div className="cf vh-minus-200-ns">
        <div className="w-100 w-50-ns fl pt3 overflow-y-scroll-ns vh-minus-200-ns h-100">
          <div className="pl4-ns pl2 pr2">
            <ReactPlaceholder
              showLoadingAnimation={true}
              rows={3}
              ready={typeof project.projectId === 'number' && project.projectId > 0}
            >
              <HeaderLine
                author={project.author}
                priority={project.projectPriority}
                projectId={project.projectId}
              />
              <div className="cf pb3">
                <h3 className="f2 fw6 mt2 mb3 ttu barlow-condensed blue-dark">
                  {project.projectInfo && project.projectInfo.name}
                </h3>
                <span className="blue-light">{project.campaignTag}</span>
                {project.countryTag && (
                  <span className="blue-light">
                    <span className="ph2">&#183;</span>
                    {project.countryTag.map(country => country).join(', ')}
                  </span>
                )}
              </div>
              <div className="cf">
                <div className="cf ttu barlow-condensed f4 pv2 blue-dark">
                  <span
                    className={`mr4 pb2 pointer ${activeSection === 'tasks' && 'bb b--blue-dark'}`}
                    onClick={() => setActiveSection('tasks')}
                  >
                    <FormattedMessage {...messages.tasks} />
                  </span>
                  <span
                    className={`mr4 pb2 pointer ${activeSection === 'instructions' &&
                      'bb b--blue-dark'}`}
                    onClick={() => setActiveSection('instructions')}
                  >
                    <FormattedMessage {...messages.instructions} />
                  </span>
                </div>
                <div className="pt3">
                  {activeSection === 'tasks' ? (
                    <TaskList
                      project={project}
                      tasks={activities || initialActivities}
                      selectTask={selectTask}
                      selected={selected}
                    />
                  ) : (
                    <div
                      className="markdown-content base-font blue-dark"
                      dangerouslySetInnerHTML={htmlInstructions}
                    />
                  )}
                </div>
              </div>
            </ReactPlaceholder>
          </div>
        </div>
        <div className="w-100 w-50-ns fl h-100">
          <ReactPlaceholder
            showLoadingAnimation={true}
            type={'media'}
            rows={26}
            delay={200}
            ready={!tasksLoading}
          >
            <TasksMap
              mapResults={tasks}
              projectId={project.projectId}
              error={tasksError}
              loading={tasksLoading}
              className="dib w-100 fl h-100-ns vh-75"
              selectTask={selectTask}
              selected={selected}
              taskBordersOnly={false}
            />
          </ReactPlaceholder>
        </div>
      </div>
      <div className="cf w-100 bt b--grey-light fixed bottom-0 left-0 z-5">
        <ReactPlaceholder
          showLoadingAnimation={true}
          rows={3}
          delay={500}
          ready={typeof project.projectId === 'number' && project.projectId > 0}
        >
          <TaskSelectionFooter
            mappingTypes={project.mappingTypes}
            imagery={project.imagery}
            mappingEditors={project.mappingEditors}
            validationEditors={project.validationEditors}
            defaultUserEditor={user ? user.defaultEditor : 'iD'}
            taskAction={taskAction}
          />
        </ReactPlaceholder>
      </div>
    </div>
  );
}
