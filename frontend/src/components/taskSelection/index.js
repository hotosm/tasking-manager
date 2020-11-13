import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useQueryParam, StringParam } from 'use-query-params';
import Popup from 'reactjs-popup';
import ReactPlaceholder from 'react-placeholder';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { useFetch } from '../../hooks/UseFetch';
import { useInterval } from '../../hooks/UseInterval';
import { useGetLockedTasks } from '../../hooks/UseLockedTasks';
import { useMemoCompare } from '../../hooks/UseMemoCompare';
import { useSetProjectPageTitleTag } from '../../hooks/UseMetaTags';
import { getTaskAction, userCanValidate } from '../../utils/projectPermissions';
import { getRandomArrayItem } from '../../utils/random';
import { updateTasksStatus } from '../../utils/updateTasksStatus';
import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';
import { TasksMap } from './map.js';
import { TaskList } from './taskList';
import { TasksMapLegend } from './legend';
import { ProjectInstructions } from './instructions';
import { ChangesetCommentTags } from './changesetComment';
import { ProjectHeader } from '../projectDetail/header';
import Contributions from './contributions';
import { UserPermissionErrorContent } from './permissionErrorModal';

const TaskSelectionFooter = React.lazy(() => import('./footer'));

const getRandomTaskByAction = (activities, taskAction) => {
  if (['validateATask', 'validateAnotherTask'].includes(taskAction)) {
    return getRandomArrayItem(
      activities
        .filter((task) => ['MAPPED', 'BADIMAGERY'].includes(task.taskStatus))
        .map((task) => task.taskId),
    );
  }
  if (['mapATask', 'mapAnotherTask'].includes(taskAction)) {
    return getRandomArrayItem(
      activities
        .filter((task) => ['READY', 'INVALIDATED'].includes(task.taskStatus))
        .map((task) => task.taskId),
    );
  }
};

export function TaskSelection({ project, type, loading }: Object) {
  const user = useSelector((state) => state.auth.get('userDetails'));
  const userOrgs = useSelector((state) => state.auth.get('organisations'));
  const lockedTasks = useGetLockedTasks();
  const dispatch = useDispatch();
  const [tasks, setTasks] = useState();
  const [activities, setActivities] = useState();
  const [contributions, setContributions] = useState();
  const [isValidationAllowed, setIsValidationAllowed] = useState(undefined);
  const [zoomedTaskId, setZoomedTaskId] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const [selected, setSelectedTasks] = useState([]);
  const [mapInit, setMapInit] = useState(false);
  const [randomTask, setRandomTask] = useState([]);
  const [taskAction, setTaskAction] = useState('mapATask');
  const [activeStatus, setActiveStatus] = useState(null);
  const [activeUser, setActiveUser] = useState(null);
  const [textSearch, setTextSearch] = useQueryParam('search', StringParam);
  const defaultUpdateInterval = 60000;
  const [updateInterval, setUpdateInterval] = useState(defaultUpdateInterval);
  useSetProjectPageTitleTag(project);

  // get teams the user is part of
  const [userTeamsError, userTeamsLoading, userTeams] = useFetch(
    `teams/?omitMemberList=true&member=${user.id}`,
    user.id !== undefined,
  );
  //eslint-disable-next-line
  const [priorityAreasError, priorityAreasLoading, priorityAreas] = useFetch(
    `/api/v2/projects/${project.projectId}/queries/priority-areas/`,
    project.projectId !== undefined,
  );

  const getActivities = useCallback((id) => {
    if (id) {
      fetchLocalJSONAPI(`projects/${id}/activities/latest/`)
        .then((res) => setActivities(res))
        .catch((e) => console.log(e));
    }
  }, []);

  const getContributions = useCallback((id) => {
    if (id) {
      fetchLocalJSONAPI(`projects/${id}/contributions/`)
        .then((res) => setContributions(res))
        .catch((e) => console.log(e));
    }
  }, []);

  // fetch activities and contributions when the component is started
  useEffect(() => {
    getActivities(project.projectId);
    getContributions(project.projectId);
  }, [getActivities, getContributions, project.projectId]);
  // refresh activities each 60 seconds if page is visible to user
  useInterval(() => {
    if (document.visibilityState === 'visible') {
      getActivities(project.projectId);
      if (activeSection === 'contributions') {
        getContributions(project.projectId);
      }
      if (updateInterval !== defaultUpdateInterval) setUpdateInterval(defaultUpdateInterval);
    } else {
      if (updateInterval !== 1000) setUpdateInterval(1000);
    }
  }, updateInterval);

  const latestTasks = useRef(tasks);
  // it's needed to avoid the following useEffect to be triggered every time the tasks change
  useEffect(() => {
    latestTasks.current = tasks;
  });
  // refresh the task status on the map each time the activities are updated
  useEffect(() => {
    if (latestTasks.current && activities) {
      setTasks(updateTasksStatus(latestTasks.current, activities));
    }
  }, [latestTasks, activities]);

  // we use this in order to only trigger the following useEffect if there are
  // new tasks on activities endpoint data
  const latestActivities = useMemoCompare(
    activities,
    (prev) => prev && prev.activity.length === activities.activity.length,
  );

  // update tasks geometry if there are new tasks (caused by task splits)
  useEffect(() => {
    if (latestActivities && latestActivities.activity) {
      fetchLocalJSONAPI(`projects/${project.projectId}/tasks/`).then((res) =>
        setTasks(updateTasksStatus(res, latestActivities)),
      );
    }
  }, [latestActivities, project.projectId]);

  // show the tasks tab when the page loads if the user has already contributed
  // to the project. If no, show the instructions tab.
  useEffect(() => {
    if (contributions && contributions.userContributions && activeSection === null) {
      const currentUserContributions = contributions.userContributions.filter(
        (u) => u.username === user.username,
      );
      if (textSearch || (user.isExpert && currentUserContributions.length > 0)) {
        setActiveSection('tasks');
      } else {
        setActiveSection('instructions');
      }
    }
  }, [contributions, user.username, user, activeSection, textSearch]);

  useEffect(() => {
    if (
      project.hasOwnProperty('teams') &&
      !userTeamsError &&
      !userTeamsLoading &&
      userTeams !== undefined
    ) {
      setIsValidationAllowed(userCanValidate(user, project, userTeams.teams));
    }
  }, [userTeams, userTeamsError, userTeamsLoading, project, user]);

  useEffect(() => {
    // run it only when the component is initialized
    // it checks if the user has tasks locked on the project and suggests to resume them
    if (!mapInit && activities && activities.activity && user.username && !userTeamsLoading) {
      const lockedByCurrentUser = activities.activity
        .filter((i) => i.taskStatus.startsWith('LOCKED_FOR_'))
        .filter((i) => i.actionBy === user.username);
      if (lockedByCurrentUser.length) {
        const userLockedTasks = lockedByCurrentUser.map((i) => i.taskId);
        setSelectedTasks(userLockedTasks);
        setTaskAction(
          lockedByCurrentUser[0].taskStatus === 'LOCKED_FOR_MAPPING'
            ? 'resumeMapping'
            : 'resumeValidation',
        );
        dispatch({ type: 'SET_LOCKED_TASKS', tasks: userLockedTasks });
        dispatch({ type: 'SET_PROJECT', project: project.projectId });
        dispatch({ type: 'SET_TASKS_STATUS', status: lockedByCurrentUser[0].taskStatus });
      } else {
        // select task if the textSearch query param is a valid taskId
        if (
          textSearch &&
          Number(textSearch) &&
          activities.activity.map((i) => i.taskId).includes(Number(textSearch))
        ) {
          setSelectedTasks([Number(textSearch)]);
          const currentStatus = activities.activity.filter(
            (i) => i.taskId === Number(textSearch),
          )[0].taskStatus;
          setTaskAction(getTaskAction(user, project, currentStatus, userTeams.teams, userOrgs));
        } else {
          // otherwise we check if the user can map or validate the project
          setTaskAction(getTaskAction(user, project, null, userTeams.teams, userOrgs));
        }
      }
      setMapInit(true);
    }
  }, [
    lockedTasks,
    dispatch,
    activities,
    user.username,
    mapInit,
    project,
    user,
    userTeams.teams,
    userTeamsLoading,
    userOrgs,
    textSearch,
  ]);

  // chooses a random task to the user
  useEffect(() => {
    if (activities && activities.activity) {
      setRandomTask([getRandomTaskByAction(activities.activity, taskAction)]);
    }
  }, [activities, taskAction]);

  function selectTask(selection, status = null, selectedUser = null) {
    // if selection is an array, just update the state
    if (typeof selection === 'object') {
      setSelectedTasks(selection);
      setTaskAction(getTaskAction(user, project, status, userTeams.teams, userOrgs));
    } else {
      // unselecting tasks
      if (selected.includes(selection)) {
        // if there is only one task selected, just clear the selection
        if (selection.length === 1) {
          setSelectedTasks([]);
          setTaskAction(getTaskAction(user, project, null, userTeams.teams, userOrgs));
        } else {
          // if there are multiple tasks selected, remove the clicked one
          setSelectedTasks(selected.filter((i) => i !== selection));
        }
      } else {
        // if there is some task selected to validation and the user selects
        //  another MAPPED task, add the new task to the selected array
        if (taskAction === 'validateSelectedTask' && status === 'MAPPED') {
          setSelectedTasks(selected.concat([selection]));
        } else {
          setSelectedTasks([selection]);
          if (lockedTasks.get('tasks').includes(selection)) {
            setTaskAction(
              lockedTasks.get('status') === 'LOCKED_FOR_MAPPING'
                ? 'resumeMapping'
                : 'resumeValidation',
            );
          } else {
            setTaskAction(getTaskAction(user, project, status, userTeams.teams, userOrgs));
          }
        }
      }
    }
    if (selectedUser === null) {
      // when a task is selected directly on the map or in the task list,
      // reset the activeUser and activeStatus in order to disable the user highlight
      // on contributions tab
      setActiveUser(null);
      setActiveStatus(null);
    } else {
      // when a user is selected in the contributions tab, update the activeUser,
      // so we can highlight it there
      setActiveUser(selectedUser);
      setActiveStatus(status);
    }
  }

  return (
    <div>
      <div className="cf vh-minus-200-ns">
        {!userTeamsLoading && ['mappingIsComplete', 'selectAnotherProject'].includes(taskAction) && (
          <Popup modal open closeOnEscape={true} closeOnDocumentClick={true}>
            {(close) => (
              <UserPermissionErrorContent
                project={project}
                userLevel={user.mappingLevel}
                close={close}
              />
            )}
          </Popup>
        )}
        <div className="w-100 w-50-ns fl pt3 overflow-y-scroll-ns vh-minus-200-ns h-100">
          <div className="pl4-l pl2 pr2">
            <ReactPlaceholder
              showLoadingAnimation={true}
              rows={3}
              ready={typeof project.projectId === 'number' && project.projectId > 0}
            >
              <ProjectHeader project={project} />
              <div className="cf">
                <div className="cf ttu barlow-condensed f4 pv2 blue-dark">
                  <span
                    className={`mr4 pb2 pointer ${activeSection === 'tasks' && 'bb b--blue-dark'}`}
                    onClick={() => setActiveSection('tasks')}
                  >
                    <FormattedMessage {...messages.tasks} />
                  </span>
                  <span
                    className={`mr4 pb2 pointer ${
                      activeSection === 'instructions' && 'bb b--blue-dark'
                    }`}
                    onClick={() => setActiveSection('instructions')}
                  >
                    <FormattedMessage {...messages.instructions} />
                  </span>
                  <span
                    className={`mr4 pb2 pointer ${
                      activeSection === 'contributions' && 'bb b--blue-dark'
                    }`}
                    onClick={() => {
                      getContributions(project.projectId);
                      setActiveSection('contributions');
                    }}
                  >
                    <FormattedMessage {...messages.contributions} />
                  </span>
                </div>
                <div className="pt3">
                  <div className={`${activeSection !== 'tasks' ? 'dn' : ''}`}>
                    <TaskList
                      project={project}
                      tasks={tasks}
                      userCanValidate={isValidationAllowed}
                      updateActivities={getActivities}
                      selectTask={selectTask}
                      selected={selected}
                      textSearch={textSearch}
                      setTextSearch={setTextSearch}
                      setZoomedTaskId={setZoomedTaskId}
                      userContributions={contributions && contributions.userContributions}
                    />
                  </div>
                  {activeSection === 'instructions' ? (
                    <>
                      <ProjectInstructions
                        instructions={project.projectInfo && project.projectInfo.instructions}
                      />
                      <ChangesetCommentTags tags={project.changesetComment} />
                    </>
                  ) : null}
                  {activeSection === 'contributions' ? (
                    <Contributions
                      project={project}
                      selectTask={selectTask}
                      tasks={tasks}
                      contribsData={contributions}
                      activeUser={activeUser}
                      activeStatus={activeStatus}
                    />
                  ) : null}
                </div>
              </div>
            </ReactPlaceholder>
          </div>
        </div>
        <div className="w-100 w-50-ns fl h-100 relative">
          <ReactPlaceholder
            showLoadingAnimation={true}
            type={'media'}
            rows={26}
            delay={200}
            ready={
              typeof project === 'object' &&
              typeof tasks === 'object' &&
              mapInit &&
              !priorityAreasLoading
            }
          >
            <TasksMap
              mapResults={tasks}
              projectId={project.projectId}
              error={typeof project !== 'object'}
              loading={typeof project !== 'object'}
              className="dib w-100 fl h-100-ns vh-75"
              zoomedTaskId={zoomedTaskId}
              selectTask={selectTask}
              selected={selected}
              taskBordersOnly={false}
              priorityAreas={priorityAreas}
              animateZoom={false}
            />
            <TasksMapLegend />
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
          <Suspense fallback={<div>Loading...</div>}>
            <TaskSelectionFooter
              defaultUserEditor={user ? user.defaultEditor : 'iD'}
              project={project}
              tasks={tasks}
              taskAction={taskAction}
              selectedTasks={
                selected.length && !taskAction.endsWith('AnotherTask') ? selected : randomTask
              }
            />
          </Suspense>
        </ReactPlaceholder>
      </div>
    </div>
  );
}
