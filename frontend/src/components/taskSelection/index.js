import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Popup from 'reactjs-popup';
import ReactPlaceholder from 'react-placeholder';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { useFetch, useFetchIntervaled } from '../../hooks/UseFetch';
import { useMemoCompare } from '../../hooks/UseMemoCompare';
import { useSetProjectPageTitleTag } from '../../hooks/UseMetaTags';
import { getTaskAction } from '../../utils/projectPermissions';
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
  const lockedTasks = useSelector((state) => state.lockedTasks);
  const dispatch = useDispatch();
  const [tasks, setTasks] = useState();
  const [zoomedTaskId, setZoomedTaskId] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const [selected, setSelectedTasks] = useState([]);
  const [mapInit, setMapInit] = useState(false);
  const [randomTask, setRandomTask] = useState([]);
  const [taskAction, setTaskAction] = useState('mapATask');
  const [activeStatus, setActiveStatus] = useState(null);
  const [activeUser, setActiveUser] = useState(null);
  useSetProjectPageTitleTag(project);

  /* eslint-disable-next-line */
  const [tasksActivitiesError, tasksActivitiesLoading, initialActivities] = useFetch(
    `projects/${project.projectId}/activities/latest/`,
    project.projectId !== undefined,
  );
  // refresh activities each 60 seconds
  /* eslint-disable-next-line */
  const [activitiesError, activities] = useFetchIntervaled(
    `projects/${project.projectId}/activities/latest/`,
    60000,
  );

  // get teams the user is part of
  /* eslint-disable-next-line */
  const [userTeamsError, userTeamsLoading, userTeams] = useFetch(
    `teams/?member=${user.id}`,
    user.id !== undefined,
  );

  /* eslint-disable-next-line */
  const [contributionsError, contributionsLoading, contributions] = useFetch(
    `projects/${project.projectId}/contributions/`,
    project.projectId !== undefined,
  );
  const [priorityAreasError, priorityAreasLoading, priorityAreas] = useFetch(
    `projects/${project.projectId}/queries/priority-areas/`,
    project.projectId !== undefined,
  );

  // initialize the tasks with the project data and the initialActivities
  useEffect(() => {
    if (project && project.tasks && initialActivities && initialActivities.activity) {
      setTasks(updateTasksStatus(project.tasks, initialActivities));
    }
  }, [project, initialActivities]);

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
  // to the project. If no, show the intructions tab.
  useEffect(() => {
    if (contributions && contributions.userContributions) {
      const currentUserContributions = contributions.userContributions.filter(
        (u) => u.username === user.username,
      );
      if (user.isExpert && currentUserContributions.length > 0) {
        setActiveSection('tasks');
      } else {
        setActiveSection('instructions');
      }
    }
  }, [contributions, user.username, user]);

  useEffect(() => {
    // run it only when the component is initialized
    // it checks if the user has tasks locked on the project and suggests to resume them
    if (!mapInit && initialActivities.activity && user.username) {
      const lockedByCurrentUser = initialActivities.activity
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
        // otherwise we check if the user can map or validate the project
        setTaskAction(getTaskAction(user, project, null, userTeams.teams));
      }
      setMapInit(true);
    }
  }, [
    lockedTasks,
    dispatch,
    initialActivities,
    user.username,
    mapInit,
    project,
    user,
    userTeams.teams,
  ]);

  // chooses a random task to the user
  useEffect(() => {
    if (!activities && initialActivities && initialActivities.activity) {
      setRandomTask([getRandomTaskByAction(initialActivities.activity, taskAction)]);
    }
    if (activities && activities.activity) {
      setRandomTask([getRandomTaskByAction(activities.activity, taskAction)]);
    }
  }, [activities, initialActivities, taskAction]);

  function selectTask(selection, status = null, selectedUser = null) {
    // if selection is an array, just update the state
    if (typeof selection === 'object') {
      setSelectedTasks(selection);
      setTaskAction(getTaskAction(user, project, status));
    } else {
      // unselecting tasks
      if (selected.includes(selection)) {
        setSelectedTasks([]);
        setTaskAction(getTaskAction(user, project, null, userTeams.teams));
      } else {
        setSelectedTasks([selection]);
        if (lockedTasks.get('tasks').includes(selection)) {
          setTaskAction(
            lockedTasks.get('status') === 'LOCKED_FOR_MAPPING'
              ? 'resumeMapping'
              : 'resumeValidation',
          );
        } else {
          setTaskAction(getTaskAction(user, project, status, userTeams.teams));
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
        {['mappingIsComplete', 'selectAnotherProject'].includes(taskAction) && (
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
                    onClick={() => setActiveSection('contributions')}
                  >
                    <FormattedMessage {...messages.contributions} />
                  </span>
                </div>
                <div className="pt3">
                  {activeSection === 'tasks' ? (
                    <TaskList
                      project={project}
                      tasks={tasks}
                      selectTask={selectTask}
                      selected={selected}
                      setZoomedTaskId={setZoomedTaskId}
                      userContributions={contributions.userContributions}
                    />
                  ) : null}
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
            ready={typeof project === 'object' && mapInit}
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
              priorityAreas={!priorityAreasError && !priorityAreasLoading && priorityAreas}
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
