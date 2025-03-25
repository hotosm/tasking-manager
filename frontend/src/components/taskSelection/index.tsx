import { lazy, useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useTypedDispatch, useTypedSelector } from '@Store/hooks';
import { useQueryParam, StringParam } from 'use-query-params';
import Popup from 'reactjs-popup';
import ReactPlaceholder from 'react-placeholder';
import { FormattedMessage } from 'react-intl';
import { toast } from 'react-hot-toast';

import { useGetLockedTasks } from '../../hooks/UseLockedTasks';
import { useSetProjectPageTitleTag } from '../../hooks/UseMetaTags';
import { getTaskAction, userCanValidate } from '../../utils/projectPermissions';
import { getRandomArrayItem } from '../../utils/random';
import { updateTasksStatus } from '../../utils/updateTasksStatus';
import { TasksMap } from './map';
import { TabSelector } from './tabSelector';
import { TaskList } from './taskList';
import { TasksMapLegend } from './legend';
import { ProjectInstructions } from './instructions';
import { ChangesetCommentTags } from './changesetComment';
import { ProjectHeader } from '../projectDetail/header';
import { ProjectDetailMap } from '../projectDetail';
import Contributions from './contributions';
import { UserPermissionErrorContent } from './permissionErrorModal';
import { Alert } from '../alert';
import messages from './messages';

import {
  usePriorityAreasQuery,
  useActivitiesQuery,
  useProjectContributionsQuery,
  useTasksQuery,
} from '../../api/projects';
import { useTeamsQuery } from '../../api/teams';

const TaskSelectionFooter = lazy(() => import('./footer'));

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

export function TaskSelection({
  project,
}: {
  // TODO: Fix this - big type
  project: any;
}) {
  useSetProjectPageTitleTag(project);
  const { projectId } = project;
  const { tabname: activeSection } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useTypedDispatch();
  const token = useTypedSelector((state) => state.auth.token);
  const user = useTypedSelector((state) => state.auth.userDetails);
  const userOrgs = useTypedSelector((state) => state.auth.organisations);
  const lockedTasks = useGetLockedTasks();
  const [zoomedTaskId, setZoomedTaskId] = useState(null);
  const [selected, setSelectedTasks] = useState([]);
  const [mapInit, setMapInit] = useState(false);
  const [taskAction, setTaskAction] = useState('mapATask');
  const [activeStatus, setActiveStatus] = useState(null);
  const [activeUser, setActiveUser] = useState(null);
  const [textSearch, setTextSearch] = useQueryParam('search', StringParam);
  const isFirstRender = useRef(true); // to check if component is rendered first time

  const { data: userTeams, isLoading: isUserTeamsLoading } = useTeamsQuery(
    {
      omitMemberList: true,
      member: user?.id,
    },
    {
      useErrorBoundary: true,
      enabled: !!token,
    },
  );
  const { data: activities, refetch: getActivities } = useActivitiesQuery(projectId);
  const { data: contributions } = useProjectContributionsQuery(projectId, {
    throwOnError: true,
    refetchOnWindowFocus: true,
    refetchInterval: activeSection === 'contributions' ? 1000 * 60 : false,
  });
  const { data: tasksData, refetch: refetchTasks } = useTasksQuery(projectId, {
    throwOnError: true,
    // Task status on the map were not being updated when coming from the action page,
    // so added this as a workaround.
    cacheTime: 0,
    enabled: false,
  });
  const {
    data: priorityAreas,
    isLoading: isPriorityAreasLoading,
    isLoadingError: isPriorityAreasLoadingError,
  } = usePriorityAreasQuery(projectId);

  const tasks = tasksData && activities && updateTasksStatus(tasksData, activities);
  const randomTask = activities && [getRandomTaskByAction(activities.activity, taskAction)];
  const isValidationAllowed = user && userTeams && userCanValidate(user, project, userTeams.teams);

  useEffect(() => {
    isPriorityAreasLoadingError &&
      toast.error(<FormattedMessage {...messages.priorityAreasLoadingError} />);
  }, [isPriorityAreasLoadingError]);

  useEffect(() => {
    const { lastLockedTasksIds, lastLockedProjectId } = location.state || {};
    if (lastLockedTasksIds && lastLockedProjectId === project.projectId) {
      setZoomedTaskId(lastLockedTasksIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project]);

  // update tasks geometry if there are new tasks (caused by task splits)
  // update tasks state (when activities have changed)
  useEffect(() => {
    if (tasksData?.features.length !== activities?.activity.length && token) {
      refetchTasks();
    }
  }, [tasksData, activities, refetchTasks, token]);

  // use route instead of local state for active tab states
  const setActiveSection = useCallback(
    (section) => {
      //eslint-disable-next-line no-extra-boolean-cast
      if (!!textSearch) return; // if search param not present, do not set active section
      navigate(`/projects/${projectId}/${section}`);
    },
    [navigate, projectId, textSearch],
  );

  // remove history location state since react-router-dom persists state on reload
  useEffect(() => {
    function onBeforeUnload() {
      window.history.replaceState({}, '');
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, []);

  // show the tasks tab when the page loads if the user has already contributed
  // to the project. If no, show the instructions tab.
  useEffect(() => {
    // do not redirect if user is not from project detail page
    if (location?.state?.from !== `/projects/${projectId}`) return;
    if (contributions && isFirstRender.current) {
      const currentUserContributions = contributions.filter((u) => u.username === user?.username);
      if (textSearch || (user?.isExpert && currentUserContributions.length > 0)) {
        setActiveSection('tasks');
      } else {
        setActiveSection('instructions');
      }
      isFirstRender.current = false;
    }
  }, [contributions, user?.username, user, textSearch, setActiveSection, location, projectId]);

  useEffect(() => {
    // run it only when the component is initialized
    // it checks if the user has tasks locked on the project and suggests to resume them
    if (!mapInit && activities && activities.activity && user?.username && !isUserTeamsLoading) {
      const lockedByCurrentUser = activities.activity
        .filter((i) => i.taskStatus.startsWith('LOCKED_FOR_'))
        .filter((i) => i.actionBy === user?.username);
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
        const isTextSearchValid = activities.activity
          .map((i) => i.taskId)
          .includes(Number(textSearch));
        if (isTextSearchValid) {
          setSelectedTasks([Number(textSearch)]);
          const currentStatus = activities.activity.find(
            (i) => i.taskId === Number(textSearch),
          ).taskStatus;
          setTaskAction(getTaskAction(user, project, currentStatus, userTeams.teams, userOrgs));
        } else {
          // otherwise we check if the user can map or validate the project
          setTaskAction(getTaskAction(user, project, null, userTeams.teams, userOrgs));
        }
      }
      setMapInit(true);
    }
  }, [
    dispatch,
    activities,
    mapInit,
    project,
    user,
    userTeams,
    isUserTeamsLoading,
    userOrgs,
    textSearch,
  ]);

  function selectTask(selection, status = null, selectedUser = null) {
    // if selection is an array, just update the state
    // Becomes truthy when user selects tasks worked on by a specific user
    // from the Contributions tab
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
          const selectedTasksTemp = selected.filter((i) => i !== selection);
          setSelectedTasks(selectedTasksTemp);
          selectedTasksTemp.length === 0 &&
            setTaskAction(getTaskAction(user, project, null, userTeams.teams, userOrgs));
        }
      } else {
        // if there is some task selected to validation and the user selects
        //  another MAPPED task, add the new task to the selected array
        if (taskAction === 'validateSelectedTask' && status === 'MAPPED') {
          setSelectedTasks(selected.concat([selection]));
        } else {
          setSelectedTasks([selection]);
          if (lockedTasks.tasks.includes(selection)) {
            setTaskAction(
              lockedTasks.status === 'LOCKED_FOR_MAPPING' ? 'resumeMapping' : 'resumeValidation',
            );
          } else {
            if (project.enforceRandomTaskSelection && status === 'READY') {
              setTaskAction(getTaskAction(user, project, null, userTeams.teams, userOrgs));
            } else {
              setTaskAction(getTaskAction(user, project, status, userTeams.teams, userOrgs));
            }
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

  const curatedSelectedTasks =
    project.enforceRandomTaskSelection && taskAction !== 'validateSelectedTask'
      ? randomTask
      : selected.length && !taskAction.endsWith('AnotherTask')
        ? selected
        : randomTask;

  return (
    <div>
      <div className="cf vh-minus-200-ns">
        {!isUserTeamsLoading &&
          ['mappingIsComplete', 'selectAnotherProject'].includes(taskAction) && (
            <Popup modal open closeOnEscape={true} closeOnDocumentClick={true}>
              {(close) => (
                <UserPermissionErrorContent
                  project={project}
                  userLevel={user?.mappingLevel}
                  close={close}
                />
              )}
            </Popup>
          )}
        <div className="w-100 w-50-ns fl pt3 overflow-y-auto-ns vh-minus-200-ns h-100">
          <div className="pl4-l pl2 pr4">
            <ProjectHeader project={project} showEditLink />
            <div className="mt3">
              <TabSelector activeSection={activeSection} setActiveSection={setActiveSection} />
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
                    userContributions={contributions}
                  />
                </div>
                {activeSection === 'instructions' ? (
                  <>
                    {project.enforceRandomTaskSelection && (
                      <Alert type="info">
                        <FormattedMessage {...messages.enforcedRandomTaskSelection} />
                      </Alert>
                    )}
                    <ProjectInstructions
                      instructions={project.projectInfo?.instructions}
                      isProjectArchived={project.status === 'ARCHIVED'}
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
          </div>
        </div>
        <div className="w-100 w-50-ns fl h-100 relative">
          {!token ? (
            <ProjectDetailMap
              project={project}
              projectLoading={false}
              tasksError={false}
              tasks={project.tasks}
              navigate={navigate}
              type="detail"
              taskBordersOnly={false}
            />
          ) : (
            <ReactPlaceholder
              showLoadingAnimation={true}
              type={'media'}
              rows={26}
              delay={200}
              ready={typeof tasks === 'object' && mapInit && !isPriorityAreasLoading}
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
          )}
        </div>
      </div>
      <div className="cf w-100 bt b--grey-light fixed bottom-0 left-0 z-4">
        <Suspense fallback={<div>Loading...</div>}>
          <TaskSelectionFooter
            defaultUserEditor={user ? user?.defaultEditor : 'iD'}
            project={project}
            tasks={tasks}
            taskAction={taskAction}
            selectedTasks={curatedSelectedTasks}
            setSelectedTasks={setSelectedTasks}
          />
        </Suspense>
      </div>
    </div>
  );
}
