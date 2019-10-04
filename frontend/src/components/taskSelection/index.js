import React, {useState} from 'react';
import { useSelector } from 'react-redux';
import { Link } from '@reach/router';
import { FormattedMessage } from 'react-intl';
import ReactPlaceholder from 'react-placeholder';

import messages from './messages';
import { useFetch } from '../../hooks/UseFetch';
import { PriorityBox } from '../projectcard/projectCard';
import { TasksMap } from './map.js';
import { TaskSelectionFooter } from './footer';
import { TaskList } from './taskList';

function HeaderLine({author, projectId, priority}: Object) {
  const userLink = (
    <Link to={`/users/${author}`} className="link blue-dark underline">
      {author}
    </Link>
  );
  const projectIdLink = <Link to={`/projects/${projectId}`} className="no-underline">
    <span className="blue-light">#{projectId}</span>
  </Link>;
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

export function TaskSelection({project, type, loading}: Object) {
  const [error, tasksLoading, tasks] = useFetch(`projects/${project.projectId}/tasks/`);
  const [activeSection, setActiveSection] = useState('tasks');
  const defaultEditor = useSelector(state => state.preferences.default_editor);
  const [selected, setSelectedTasks] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState(null);

  function selectTask(selection, status=null) {
    if (typeof(selection) === 'object') {
      setSelectedTasks(selection);
    } else {
      if (selected.includes(selection)) {
        setSelectedTasks([]);
        setSelectedStatus(null)
      } else {
        setSelectedTasks([selection]);
        setSelectedStatus(status);
      }
    }
  }

  return (
    <div>
      <div className="cf pv3">
        <div className="w-100 w-50-ns fl">
          <div className="ph4">
            <ReactPlaceholder
              showLoadingAnimation={true}
              rows={3}
              delay={500}
              ready={typeof(project.projectId) === 'number' && project.projectId > 0}
            >
              <HeaderLine author={project.author} priority={project.projectPriority} projectId={project.projectId} />
              <div className="cf pb3">
                <h3 className="f2 fw6 mt2 mb3 ttu barlow-condensed blue-dark">
                  {project.projectInfo && project.projectInfo.name}
                </h3>
                <span className="blue-light">{project.campaignTag}</span>
                {project.countryTag &&
                  <span className="blue-light">
                    <span className="ph2">&#183;</span>{project.countryTag.map(country => country).join(', ')}
                  </span>
                }
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
                    className={`mr4 pb2 pointer ${activeSection === 'instructions' && 'bb b--blue-dark'}`}
                    onClick={() => setActiveSection('instructions')}
                  >
                    <FormattedMessage {...messages.instructions} />
                  </span>
                </div>
                <div className="pt4">
                  {activeSection === 'tasks' ? (
                    <TaskList projectId={project.projectId} selectTask={selectTask} selected={selected} />
                  ) : (
                    <p>{project.projectInfo.instructions}</p>
                  )}
                </div>
              </div>
            </ReactPlaceholder>
          </div>
        </div>
        <div className="w-100 w-50-ns fl">
          <TasksMap
            mapResults={tasks}
            projectId={project.projectId}
            type={type}
            error={error}
            loading={tasksLoading}
            className="dib w-100 fl"
            selectTask={selectTask}
            selected={selected}
          />
        </div>
      </div>
      <div className="cf ph4 bt b--grey-light">
        <ReactPlaceholder
          showLoadingAnimation={true}
          rows={3}
          delay={500}
          ready={typeof(project.projectId) === 'number' && project.projectId >0}
        >
          <TaskSelectionFooter
            mappingTypes={project.mappingTypes}
            imagery={project.imagery}
            editors={project.mappingEditors}
            defaultUserEditor={defaultEditor}
            selected={selected}
            selectedStatus={selectedStatus}
          />
        </ReactPlaceholder>
      </div>
    </div>
  );
}
