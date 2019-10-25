import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from '@reach/router';
import { FormattedMessage } from 'react-intl';
import ReactPlaceholder from 'react-placeholder';

import messages from './messages';
import { useFetch } from '../../hooks/UseFetch';
import { getTaskAction } from '../../utils/projectPermissions';
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
  const [error, tasksLoading, tasks] = useFetch(`projects/${project.projectId}/tasks/`);
  const user = useSelector(state => state.auth.get('userDetails'));
  const [activeSection, setActiveSection] = useState('tasks');
  const [selected, setSelectedTasks] = useState([]);
  const [taskAction, setTaskAction] = useState('mapATask');

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
      <div className="cf vh-75-ns h-100">
        <div className="w-100 w-50-ns fl pt3 overflow-y-scroll vh-75-ns" >
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
                    <TaskList project={project} selectTask={selectTask} selected={selected} />
                  ) : (
                    <p dangerouslySetInnerHTML={htmlInstructions} />
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
            ready={!tasksLoading && tasks}
          >
            <TasksMap
              mapResults={tasks}
              projectId={project.projectId}
              error={error}
              loading={tasksLoading}
              className="dib w-100 fl"
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
            editors={project.mappingEditors}
            defaultUserEditor={user ? user.defaultEditor : 'iD'}
            taskAction={taskAction}
          />
        </ReactPlaceholder>
      </div>
    </div>
  );
}
