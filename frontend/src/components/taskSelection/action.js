import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { navigate } from '@reach/router';
import ReactPlaceholder from 'react-placeholder';
import Popup from 'reactjs-popup';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { ProjectInstructions } from './instructions';
import { TasksMap } from './map';
import { HeaderLine } from '../projectDetail/header';
import { Button } from '../button';
import Portal from '../portal';
import { SidebarIcon } from '../svgIcons';
import { openEditor, getTaskGpxUrl, formatImageryUrl } from '../../utils/openEditor';
import { TaskHistory } from './taskActivity';
import { ChangesetCommentTags } from './changesetComment';
import { useSetProjectPageTitleTag } from '../../hooks/UseMetaTags';
import { useFetch } from '../../hooks/UseFetch';
import { DueDateBox } from '../projectCard/dueDateBox';
import {
  CompletionTabForMapping,
  CompletionTabForValidation,
  SidebarToggle,
  ReopenEditor,
} from './actionSidebars';

const Editor = React.lazy(() => import('../editor'));

export function TaskMapAction({ project, projectIsReady, tasks, activeTasks, action, editor }) {
  useSetProjectPageTitleTag(project);
  const userDetails = useSelector((state) => state.auth.get('userDetails'));
  const [activeSection, setActiveSection] = useState('completion');
  const [activeEditor, setActiveEditor] = useState(editor);
  const [showSidebar, setShowSidebar] = useState(true);
  const tasksIds = activeTasks ? activeTasks.map((task) => task.taskId) : [];
  const [disabled, setDisable] = useState(false);
  const [taskComment, setTaskComment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState();

  const activeTask = activeTasks && activeTasks[0];
  const timer = new Date(activeTask.lastUpdated);
  timer.setSeconds(timer.getSeconds() + activeTask.autoUnlockSeconds);
  //eslint-disable-next-line
  const [taskHistoryError, taskHistoryLoading, taskHistory] = useFetch(
    `projects/${project.projectId}/tasks/${tasksIds[0]}/`,
    project.projectId && tasksIds && tasksIds.length === 1,
  );

  const getTaskGpxUrlCallback = useCallback((project, tasks) => getTaskGpxUrl(project, tasks), []);
  const formatImageryUrlCallback = useCallback((imagery) => formatImageryUrl(imagery), []);

  useEffect(() => {
    if (!editor && projectIsReady && userDetails.defaultEditor && tasks && tasksIds) {
      let editorToUse;
      if (action === 'MAPPING') {
        editorToUse = project.mappingEditors.includes(userDetails.defaultEditor)
          ? [userDetails.defaultEditor]
          : project.mappingEditors;
      } else {
        editorToUse = project.validationEditors.includes(userDetails.defaultEditor)
          ? [userDetails.defaultEditor]
          : project.validationEditors;
      }
      const url = openEditor(
        editorToUse[0],
        project,
        tasks,
        tasksIds,
        [window.innerWidth, window.innerHeight],
        null,
      );
      if (url) {
        navigate(`./${url}`);
      } else {
        navigate(`./?editor=${editorToUse[0]}`);
      }
    }
  }, [editor, project, projectIsReady, userDetails.defaultEditor, action, tasks, tasksIds]);

  const callEditor = (arr) => {
    setActiveEditor(arr[0].value);
    const url = openEditor(
      arr[0].value,
      project,
      tasks,
      tasksIds,
      [window.innerWidth, window.innerHeight],
      null,
    );
    if (url) {
      navigate(`./${url}`);
    } else {
      navigate(`./?editor=${arr[0].value}`);
    }
  };

  return (
    <Portal>
      <div className="cf w-100 vh-minus-77-ns overflow-y-hidden">
        <div className={`fl h-100 relative ${showSidebar ? 'w-70' : 'w-100-minus-4rem'}`}>
          {editor === 'ID' ? (
            <React.Suspense
              fallback={
                <div className={`w7 h5 center`}>
                  <ReactPlaceholder
                    showLoadingAnimation={true}
                    type="media"
                    rows={26}
                    ready={false}
                  />
                </div>
              }
            >
              <Editor
                setDisable={setDisable}
                comment={project.changesetComment}
                presets={project.idPresets}
                imageryUrl={formatImageryUrlCallback(project.imagery)}
                gpxUrl={getTaskGpxUrlCallback(project.projectId, tasksIds)}
              />
            </React.Suspense>
          ) : (
            <ReactPlaceholder
              showLoadingAnimation={true}
              type="media"
              rows={26}
              delay={10}
              ready={tasks !== undefined && tasks.features !== undefined}
            >
              <TasksMap
                mapResults={tasks}
                className="dib w-100 fl h-100-ns vh-75"
                taskBordersOnly={false}
                animateZoom={false}
                selected={tasksIds}
              />
            </ReactPlaceholder>
          )}
        </div>
        {showSidebar ? (
          <div className="w-30 fr pt3 ph3 h-100 overflow-y-scroll base-font bg-white">
            <ReactPlaceholder
              showLoadingAnimation={true}
              rows={3}
              ready={typeof project.projectId === 'number' && project.projectId > 0}
            >
              {activeEditor === 'ID' && <SidebarToggle setShowSidebar={setShowSidebar} />}
              <HeaderLine
                author={project.author}
                projectId={project.projectId}
                organisation={project.organisationName}
              />
              <div className="cf pb3">
                <h3
                  className="f2 fw6 mt2 mb1 ttu barlow-condensed blue-dark"
                  lang={project.projectInfo && project.projectInfo.locale}
                >
                  {project.projectInfo && project.projectInfo.name}
                  <span className="pl2">&#183;</span>
                  {tasksIds.map((task, n) => (
                    <span key={n}>
                      <span className="red dib ph2">{`#${task}`}</span>
                      {tasksIds.length > 1 && n !== tasksIds.length - 1 ? (
                        <span className="blue-light">&#183;</span>
                      ) : (
                        ''
                      )}
                    </span>
                  ))}
                </h3>
                <DueDateBox dueDate={timer} align="left" intervalMili={60000} />
              </div>
              <div className="cf">
                <div className="cf ttu barlow-condensed f4 pv2 blue-dark">
                  <span
                    className={`mr4-l mr3 pb2 pointer ${
                      activeSection === 'completion' && 'bb b--blue-dark'
                    }`}
                    onClick={() => setActiveSection('completion')}
                  >
                    <FormattedMessage {...messages.completion} />
                  </span>
                  <span
                    className={`mr4-l mr3 pb2 pointer ${
                      activeSection === 'instructions' && 'bb b--blue-dark'
                    }`}
                    onClick={() => setActiveSection('instructions')}
                  >
                    <FormattedMessage {...messages.instructions} />
                  </span>
                  {activeTasks && activeTasks.length === 1 && (
                    <span
                      className={`pb2 pointer truncate ${
                        activeSection === 'history' && 'bb b--blue-dark'
                      }`}
                      onClick={() => setActiveSection('history')}
                    >
                      <FormattedMessage {...messages.history} />
                      {taskHistory &&
                        taskHistory.taskHistory &&
                        taskHistory.taskHistory.length > 1 && (
                          <div
                            className="bg-red white dib br-100 tc f6 ml1 mb1 v-mid"
                            style={{ height: '1.125rem', width: '1.125rem' }}
                          >
                            {taskHistory.taskHistory.length}
                          </div>
                        )}
                    </span>
                  )}
                </div>
              </div>
              <div className="pt3">
                {activeSection === 'completion' && (
                  <>
                    {action === 'MAPPING' && (
                      <CompletionTabForMapping
                        project={project}
                        tasksIds={tasksIds}
                        taskInstructions={
                          activeTasks && activeTasks.length === 1
                            ? activeTasks[0].perTaskInstructions
                            : null
                        }
                        disabled={disabled}
                        taskComment={taskComment}
                        setTaskComment={setTaskComment}
                        selectedStatus={selectedStatus}
                        setSelectedStatus={setSelectedStatus}
                      />
                    )}
                    {action === 'VALIDATION' && (
                      <CompletionTabForValidation
                        project={project}
                        tasksIds={tasksIds}
                        taskInstructions={
                          activeTasks && activeTasks.length === 1
                            ? activeTasks[0].perTaskInstructions
                            : null
                        }
                        disabled={disabled}
                        taskComment={taskComment}
                        setTaskComment={setTaskComment}
                        selectedStatus={selectedStatus}
                        setSelectedStatus={setSelectedStatus}
                      />
                    )}
                    <div className="pt3">
                      <ReopenEditor
                        project={project}
                        action={action}
                        editor={activeEditor}
                        callEditor={callEditor}
                      />
                      {editor === 'ID' && (
                        <Popup
                          modal
                          trigger={(open) => (
                            <div className="w-50 cf fl tc pt4">
                              <Button className="blue-dark bg-white dib">
                                <FormattedMessage {...messages.tasksMap} />
                              </Button>
                            </div>
                          )}
                          closeOnEscape={true}
                          closeOnDocumentClick={true}
                        >
                          {(close) => (
                            <div className="vh-75">
                              <TasksMap
                                mapResults={tasks}
                                className="dib w-100 fl h-100-ns vh-75"
                                taskBordersOnly={false}
                                animateZoom={false}
                                selected={tasksIds}
                              />
                            </div>
                          )}
                        </Popup>
                      )}
                    </div>
                  </>
                )}
                {activeSection === 'instructions' && (
                  <>
                    <ProjectInstructions
                      instructions={project.projectInfo && project.projectInfo.instructions}
                    />
                    <ChangesetCommentTags tags={project.changesetComment} />
                  </>
                )}
                {activeSection === 'history' && (
                  <TaskHistory
                    projectId={project.projectId}
                    taskId={tasksIds[0]}
                    commentPayload={taskHistory}
                  />
                )}
              </div>
            </ReactPlaceholder>
          </div>
        ) : (
          <div
            className="w3 h-100 base-font fr cf tc mt3 ph1 pl2 pr1 pointer"
            onClick={() => setShowSidebar(true)}
          >
            <FormattedMessage {...messages.showSidebar}>
              {(msg) => (
                <div className="db" title={msg}>
                  <SidebarIcon />
                </div>
              )}
            </FormattedMessage>
            <div className="db">
              <h3 className="blue-dark">#{project.projectId}</h3>
              <div>
                {tasksIds.map((task, n) => (
                  <span key={n} className="red fw5 db pb2">{`#${task}`}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Portal>
  );
}
