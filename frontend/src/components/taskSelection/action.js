import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import ReactPlaceholder from 'react-placeholder';
import Popup from 'reactjs-popup';
import toast from 'react-hot-toast';
import { FormattedMessage, useIntl } from 'react-intl';

import messages from './messages';
import { ProjectInstructions } from './instructions';
import { TasksMap } from './map';
import { HeaderLine } from '../projectDetail/header';
import { Button } from '../button';
import Portal from '../portal';
import { SidebarIcon } from '../svgIcons';
import { openEditor, getTaskGpxUrl, formatImageryUrl, formatJosmUrl } from '../../utils/openEditor';
import { getTaskContributors } from '../../utils/getTaskContributors';
import { TaskHistory } from './taskActivity';
import { ChangesetCommentTags } from './changesetComment';
import { useSetProjectPageTitleTag } from '../../hooks/UseMetaTags';
import { useReadTaskComments } from '../../hooks/UseReadTaskComments';
import { useDisableBadImagery } from '../../hooks/UseDisableBadImagery';
import { DueDateBox } from '../projectCard/dueDateBox';
import {
  CompletionTabForMapping,
  CompletionTabForValidation,
  SidebarToggle,
  ReopenEditor,
  UnsavedMapChangesModalContent,
} from './actionSidebars';
import { MultipleTaskHistoriesAccordion } from './multipleTaskHistories';
import { ResourcesTab } from './resourcesTab';
import { ActionTabsNav } from './actionTabsNav';
import { LockedTaskModalContent } from './lockedTasks';
import { SessionAboutToExpire, SessionExpired } from './extendSession';
import { MappingTypes } from '../mappingTypes';
import { usePriorityAreasQuery, useTaskDetail } from '../../api/projects';

const Editor = React.lazy(() => import('../editor'));
const RapiDEditor = React.lazy(() => import('../rapidEditor'));

const MINUTES_BEFORE_DIALOG = 5;

export function TaskMapAction({ project, tasks, activeTasks, getTasks, action, editor }) {
  useSetProjectPageTitleTag(project);
  const intl = useIntl();
  const navigate = useNavigate();
  const location = useLocation();
  const aboutToExpireTimeoutRef = useRef();
  const expiredTimeoutRef = useRef();
  const userDetails = useSelector((state) => state.auth.userDetails);
  const token = useSelector((state) => state.auth.token);
  const [activeSection, setActiveSection] = useState('completion');
  const [activeEditor, setActiveEditor] = useState(editor);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isJosmError, setIsJosmError] = useState(false);
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
  const [showMapChangesModal, setShowMapChangesModal] = useState(false);
  const [showSessionExpiringDialog, setShowSessionExpiringDialog] = useState(false);
  const [showSessionExpiredDialog, setSessionTimeExpiredDialog] = useState(false);

  const activeTask = activeTasks?.[0];
  const timer = new Date(activeTask.lastUpdated);
  timer.setSeconds(timer.getSeconds() + activeTask.autoUnlockSeconds);
  //eslint-disable-next-line
  const { data: taskDetail } = useTaskDetail(project.projectId, tasksIds[0]);
  const { data: priorityArea, isError: isPriorityAreaError } = usePriorityAreasQuery(
    project.projectId,
  );

  const contributors = taskDetail?.taskHistory
    ? getTaskContributors(taskDetail.taskHistory, userDetails.username)
    : [];

  const readTaskComments = useReadTaskComments(taskDetail);
  const disableBadImagery = useDisableBadImagery(taskDetail);

  const getTaskGpxUrlCallback = useCallback((project, tasks) => getTaskGpxUrl(project, tasks), []);
  const formatImageryUrlCallback = useCallback((imagery) => formatImageryUrl(imagery), []);

  const historyTabSwitch = () => {
    setHistoryTabChecked(true);
    setActiveSection('history');
  };

  useEffect(() => {
    const tempTimer = new Date(activeTask.lastUpdated);
    tempTimer.setSeconds(tempTimer.getSeconds() + activeTask.autoUnlockSeconds);
    const milliDifferenceForSessionExpire = new Date(tempTimer) - Date.now();
    const milliDifferenceForAboutToSessionExpire =
      milliDifferenceForSessionExpire - MINUTES_BEFORE_DIALOG * 60 * 1000;

    aboutToExpireTimeoutRef.current = setTimeout(() => {
      setSessionTimeExpiredDialog(false);
      setShowSessionExpiringDialog(true);
    }, milliDifferenceForAboutToSessionExpire);

    expiredTimeoutRef.current = setTimeout(() => {
      setShowSessionExpiringDialog(false);
      setSessionTimeExpiredDialog(true);
    }, milliDifferenceForSessionExpire);

    return () => {
      clearTimeout(aboutToExpireTimeoutRef.current);
      clearTimeout(expiredTimeoutRef.current);
    };
  }, [activeTask.autoUnlockSeconds, activeTask.lastUpdated]);

  useEffect(() => {
    if (!editor && userDetails.defaultEditor && tasks && tasksIds) {
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
  }, [editor, project, userDetails.defaultEditor, action, tasks, tasksIds, navigate]);

  useEffect(() => {
    if (location.state?.directedFrom) {
      localStorage.setItem('lastProjectPathname', location.state.directedFrom);
    } else {
      localStorage.removeItem('lastProjectPathname');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    isPriorityAreaError &&
      !['ID', 'RAPID'].includes(editor) &&
      toast.error(<FormattedMessage {...messages.priorityAreasLoadingError} />);
  }, [editor, isPriorityAreaError]);

  const callEditor = async (arr) => {
    setIsJosmError(false);
    if (!disabled) {
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
        if (arr[0].value === 'JOSM') {
          try {
            await fetch(formatJosmUrl('version', { jsonp: 'checkJOSM' }));
          } catch (e) {
            setIsJosmError(true);
            return;
          }
        }
      } else {
        navigate(`./?editor=${arr[0].value}`);
      }
    } else {
      // we need to return a promise in order to be called by useAsync
      return new Promise((resolve, reject) => {
        setShowMapChangesModal('reload editor');
        resolve();
      });
    }
  };

  return (
    <>
      <Portal>
        <div className="cf w-100 vh-minus-69-ns overflow-y-hidden">
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
                    showSidebar={showSidebar}
                  />
                )}
              </React.Suspense>
            ) : (
              <ReactPlaceholder
                showLoadingAnimation={true}
                type="media"
                rows={26}
                delay={10}
                ready={Boolean(tasks?.features !== undefined)}
              >
                <TasksMap
                  mapResults={tasks}
                  className="dib w-100 fl h-100-ns vh-75"
                  taskBordersOnly={false}
                  animateZoom={false}
                  selected={tasksIds}
                  showTaskIds={action === 'VALIDATION'}
                  priorityAreas={priorityArea}
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
                  <SidebarToggle setShowSidebar={setShowSidebar} activeEditor={activeEditor} />
                )}
                <HeaderLine
                  author={project.author}
                  projectId={project.projectId}
                  organisation={project.organisationName}
                />
                <div className="cf pb3">
                  <h3
                    className="f2 fw5 lh-title mt2 mb1 ttu barlow-condensed blue-dark"
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
                    <DueDateBox dueDate={timer} isTaskStatusPage intervalMili={60000} />
                  </div>
                </div>
                <MappingTypes types={project.mappingTypes} />
                <div className="cf mt3">
                  <ActionTabsNav
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                    activeTasks={activeTasks}
                    historyTabSwitch={historyTabSwitch}
                    taskHistoryLength={taskDetail?.taskHistory?.length}
                    action={action}
                  />
                </div>
                <div className="pt0">
                  {activeSection === 'completion' && (
                    <>
                      {action === 'MAPPING' && (
                        <CompletionTabForMapping
                          project={project}
                          tasksIds={tasksIds}
                          showReadCommentsAlert={readTaskComments && !historyTabChecked}
                          disableBadImagery={
                            userDetails.mappingLevel !== 'ADVANCED' || disableBadImagery
                          }
                          contributors={contributors}
                          historyTabSwitch={historyTabSwitch}
                          taskInstructions={activeTasks && activeTasks[0].perTaskInstructions}
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
                          taskInstructions={activeTasks && activeTasks[0].perTaskInstructions}
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
                        {disabled && showMapChangesModal && (
                          <Popup
                            modal
                            open
                            closeOnEscape={true}
                            closeOnDocumentClick={true}
                            onClose={() => setShowMapChangesModal(null)}
                          >
                            {(close) => (
                              <UnsavedMapChangesModalContent
                                close={close}
                                action={showMapChangesModal}
                              />
                            )}
                          </Popup>
                        )}
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
                            onOpen={() => {
                              isPriorityAreaError &&
                                toast.error(
                                  <FormattedMessage {...messages.priorityAreasLoadingError} />,
                                );
                            }}
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
                                  priorityAreas={priorityArea}
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
                          <TaskHistory projectId={project.projectId} taskId={tasksIds[0]} />
                        </>
                      )}
                      {action === 'VALIDATION' && activeTasks.length > 1 && (
                        <MultipleTaskHistoriesAccordion
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
      {isJosmError && (
        <Popup
          modal
          open
          closeOnEscape={true}
          closeOnDocumentClick={true}
          onClose={() => setIsJosmError(false)}
        >
          {(close) => <LockedTaskModalContent project={project} error="JOSM" close={close} />}
        </Popup>
      )}
      <SessionAboutToExpire
        showSessionExpiringDialog={showSessionExpiringDialog}
        setShowSessionExpiryDialog={setShowSessionExpiringDialog}
        projectId={project.projectId}
        tasksIds={tasksIds}
        token={token}
        getTasks={getTasks}
        expiredTimeoutRef={expiredTimeoutRef}
      />
      <SessionExpired
        showSessionExpiredDialog={showSessionExpiredDialog}
        setShowSessionExpiredDialog={setSessionTimeExpiredDialog}
        projectId={project.projectId}
        tasksIds={tasksIds}
        token={token}
        action={action}
        getTasks={getTasks}
      />
    </>
  );
}
