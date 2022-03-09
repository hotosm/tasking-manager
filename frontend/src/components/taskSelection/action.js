import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { navigate } from '@reach/router';
import ReactPlaceholder from 'react-placeholder';
import Popup from 'reactjs-popup';
import { FormattedMessage, useIntl } from 'react-intl';

import messages from './messages';
import { ProjectInstructions } from './instructions';
import { TasksMap } from './map';
import { HeaderLine } from '../projectDetail/header';
import { Button } from '../button';
import Portal from '../portal';
import { SidebarIcon } from '../svgIcons';
import { openEditor, getTaskGpxUrl, formatImageryUrl } from '../../utils/openEditor';
import { getTaskContributors } from '../../utils/getTaskContributors';
import { TaskHistory } from './taskActivity';
import { ChangesetCommentTags } from './changesetComment';
import { useSetProjectPageTitleTag } from '../../hooks/UseMetaTags';
import { useFetch } from '../../hooks/UseFetch';
import { useReadTaskComments } from '../../hooks/UseReadTaskComments';
import { useDisableBadImagery } from '../../hooks/UseDisableBadImagery';
import { DueDateBox } from '../projectCard/dueDateBox';
import {
  CompletionTabForMapping,
  CompletionTabForValidation,
  SidebarToggle,
  ReopenEditor,
} from './actionSidebars';
import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';
import { MultipleTaskHistoriesAccordion } from './multipleTaskHistories';
import { ResourcesTab } from './resourcesTab';
import { ActionTabsNav } from './actionTabsNav';

const Editor = React.lazy(() => import('../editor'));
const RapiDEditor = React.lazy(() => import('../rapidEditor'));

export function TaskMapAction({ project, projectIsReady, tasks, activeTasks, action, editor }) {
  useSetProjectPageTitleTag(project);
  const userDetails = useSelector((state) => state.auth.get('userDetails'));
  const token = useSelector((state) => state.auth.get('token'));
  const [activeSection, setActiveSection] = useState('completion');
  const [activeEditor, setActiveEditor] = useState(editor);
  const [showSidebar, setShowSidebar] = useState(true);
  const tasksIds = useMemo(
    () =>
      activeTasks
        ? activeTasks
            .map((task) => task.taskId)
            .sort((n1, n2) => {
              // in ascending order
              return n1 - n2;
            })
        : [],
    [activeTasks],
  );
  const [disabled, setDisable] = useState(false);
  const [taskComment, setTaskComment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState();
  const [validationComments, setValidationComments] = useState({});
  const [validationStatus, setValidationStatus] = useState({});
  const [historyTabChecked, setHistoryTabChecked] = useState(false);
  const [multipleTasksInfo, setMultipleTasksInfo] = useState({});
  const intl = useIntl();

  const activeTask = activeTasks && activeTasks[0];
  const timer = new Date(activeTask.lastUpdated);
  timer.setSeconds(timer.getSeconds() + activeTask.autoUnlockSeconds);
  //eslint-disable-next-line
  const [taskHistoryError, taskHistoryLoading, taskHistory] = useFetch(
    `projects/${project.projectId}/tasks/${tasksIds[0]}/`,
    project.projectId && tasksIds && tasksIds.length === 1,
  );

  const contributors =
    taskHistory && taskHistory.taskHistory
      ? getTaskContributors(taskHistory.taskHistory, userDetails.username)
      : [];

  const readTaskComments = useReadTaskComments(taskHistory);
  const disableBadImagery = useDisableBadImagery(taskHistory);

  const getTaskGpxUrlCallback = useCallback((project, tasks) => getTaskGpxUrl(project, tasks), []);
  const formatImageryUrlCallback = useCallback((imagery) => formatImageryUrl(imagery), []);

  const historyTabSwitch = () => {
    setHistoryTabChecked(true);
    setActiveSection('history');
  };

  const handleTaskHistories = (taskIds) => {
    if (taskIds.length < 1) return;

    taskIds.forEach((id) => {
      if (!Object.keys(multipleTasksInfo).includes(id.toString())) {
        fetchLocalJSONAPI(`projects/${project.projectId}/tasks/${id}/`, token).then((data) =>
          setMultipleTasksInfo({ ...multipleTasksInfo, [id]: data }),
        );
      }
    });
  };

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
    window.location.reload();
  };

  return (
    <Portal>
      <div className="cf w-100 vh-minus-77-ns overflow-y-hidden">
        <div className={`fl h-100 relative ${showSidebar ? 'w-70' : 'w-100-minus-4rem'}`}>
          {['ID', 'RAPID'].includes(editor) ? (
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
              {editor === 'ID' ? (
                <Editor
                  setDisable={setDisable}
                  comment={project.changesetComment}
                  presets={project.idPresets}
                  imagery={formatImageryUrlCallback(project.imagery)}
                  gpxUrl={getTaskGpxUrlCallback(project.projectId, tasksIds)}
                />
              ) : (
                <RapiDEditor
                  setDisable={setDisable}
                  comment={project.changesetComment}
                  presets={project.idPresets}
                  imagery={formatImageryUrlCallback(project.imagery)}
                  gpxUrl={getTaskGpxUrlCallback(project.projectId, tasksIds)}
                  powerUser={project.rapidPowerUser}
                />
              )}
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
                showTaskIds={action === 'VALIDATION'}
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
              {(activeEditor === 'ID' || activeEditor === 'RAPID') && (
                <SidebarToggle setShowSidebar={setShowSidebar} />
              )}
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
                <div className="db" title={intl.formatMessage(messages.timeToUnlock)}>
                  <DueDateBox dueDate={timer} align="left" intervalMili={60000} />
                </div>
              </div>
              <div className="cf">
                <ActionTabsNav
                  activeSection={activeSection}
                  setActiveSection={setActiveSection}
                  activeTasks={activeTasks}
                  historyTabSwitch={historyTabSwitch}
                  taskHistoryLength={
                    taskHistory && taskHistory.taskHistory && taskHistory.taskHistory.length
                  }
                  action={action}
                />
              </div>
              <div className="pt1">
                {activeSection === 'completion' && (
                  <>
                    {action === 'MAPPING' && (
                      <CompletionTabForMapping
                        project={project}
                        tasksIds={tasksIds}
                        showReadCommentsAlert={readTaskComments && !historyTabChecked}
                        disableBadImagery={
                          userDetails.mappingLevel !== 'ADVANCED' && disableBadImagery
                        }
                        contributors={contributors}
                        historyTabSwitch={historyTabSwitch}
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
                        contributors={contributors}
                        validationComments={validationComments}
                        setValidationComments={setValidationComments}
                        validationStatus={validationStatus}
                        setValidationStatus={setValidationStatus}
                      />
                    )}
                    <div className="pt3">
                      <ReopenEditor
                        project={project}
                        action={action}
                        editor={activeEditor}
                        callEditor={callEditor}
                      />
                      {(editor === 'ID' || editor === 'RAPID') && (
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
                                showTaskIds={action === 'VALIDATION'}
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
                  <>
                    {activeTasks.length === 1 && (
                      <>
                        <TaskHistory
                          projectId={project.projectId}
                          taskId={tasksIds[0]}
                          commentPayload={taskHistory}
                        />
                      </>
                    )}
                    {action === 'VALIDATION' && activeTasks.length > 1 && (
                      <MultipleTaskHistoriesAccordion
                        handleChange={handleTaskHistories}
                        tasks={activeTasks}
                        projectId={project.projectId}
                      />
                    )}
                  </>
                )}
                {activeSection === 'resources' && (
                  <ResourcesTab project={project} tasksIds={tasksIds} tasksGeojson={tasks} />
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
              <h3 className="blue-dark f5">#{project.projectId}</h3>
              <div>
                {tasksIds.map((task, n) => (
                  <span key={n} className="red fw8 f5 db pb2">{`#${task}`}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Portal>
  );
}
