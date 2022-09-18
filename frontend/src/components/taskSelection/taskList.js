import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from '@reach/router';
import Popup from 'reactjs-popup';
import { useQueryParam, NumberParam, StringParam } from 'use-query-params';
import ReactPlaceholder from 'react-placeholder';
import bbox from '@turf/bbox';
import { useCopyClipboard } from '@lokibai/react-use-copy-clipboard';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { RelativeTimeWithUnit } from '../../utils/formattedRelativeTime';
import { TaskActivity } from './taskActivity';
import { compareTaskId, compareLastUpdate } from '../../utils/sorting';
import { getItem, setItem } from '../../utils/safe_storage';
import { TASK_COLOURS } from '../../config';
import { LockIcon, ListIcon, ZoomPlusIcon, CloseIcon, InternalLinkIcon } from '../svgIcons';
import { PaginatorLine, howManyPages } from '../paginator';
import { Dropdown } from '../dropdown';

export function TaskStatus({ status, lockHolder }: Object) {
  const isReadyOrLockedForMapping = ['READY', 'LOCKED_FOR_MAPPING'].includes(status);
  const dotSize = isReadyOrLockedForMapping ? '0.875rem' : '1rem';
  const isLockedStatus = ['LOCKED_FOR_VALIDATION', 'LOCKED_FOR_MAPPING'].includes(status);
  return (
    <>
      <span
        className={`${isReadyOrLockedForMapping ? 'ba bw1 b--grey-light' : ''} dib v-mid`}
        style={{
          height: dotSize,
          width: dotSize,
          backgroundColor: TASK_COLOURS[status],
        }}
      ></span>
      {isLockedStatus && <LockIcon style={{ paddingTop: '1px' }} className="v-mid pl1 h1 w1" />}
      <span className="pl2 v-mid">
        {isLockedStatus && lockHolder ? (
          <FormattedMessage
            {...messages.lockedBy}
            values={{
              user: lockHolder,
              lockStatus: <FormattedMessage {...messages[`taskStatus_${status}`]} />,
            }}
          />
        ) : (
          <FormattedMessage {...messages[`taskStatus_${status}`]} />
        )}
      </span>
    </>
  );
}

function TaskItem({
  data,
  project,
  setZoomedTaskId,
  setActiveTaskModal,
  selectTask,
  selected = [],
}: Object) {
  const [isCopied, setCopied] = useCopyClipboard();
  const location = useLocation();

  return (
    <div
      className={`cf db ba br1 mt2 ${
        selected.includes(data.taskId) ? 'b--blue-dark bw1' : 'b--tan bw1'
      }`}
    >
      <div
        className="w-80 pv3 fl cf pointer"
        onClick={() => selectTask(data.taskId, data.taskStatus)}
      >
        <div className="w-70-l w-40 fl dib truncate">
          <span className="pl3 b">
            <FormattedMessage {...messages.taskId} values={{ id: data.taskId }} />
          </span>
          {data.actionDate && (
            <div title={data.actionDate} className="dn di-l">
              <span className="ph2 blue-grey">&#183;</span>
              <span className="blue-grey">
                <FormattedMessage
                  {...messages.taskLastUpdate}
                  values={{ user: <span className="b blue-grey">{data.actionBy}</span> }}
                />{' '}
                <RelativeTimeWithUnit date={data.actionDate} />
              </span>
            </div>
          )}
        </div>
        <div className="w-30-l w-60 fl blue-grey dib truncate">
          <TaskStatus status={data.taskStatus} />
        </div>
      </div>
      <div className="w-20 pv3 fr tr dib blue-light truncate overflow-empty">
        <FormattedMessage {...messages.seeTaskHistory}>
          {(msg) => (
            <div className="pr2 dib v-mid" title={msg}>
              <ListIcon
                width="18px"
                height="18px"
                className="pointer hover-blue-grey"
                onClick={() => setActiveTaskModal(data.taskId)}
              />
            </div>
          )}
        </FormattedMessage>
        <FormattedMessage {...messages.zoomToTask}>
          {(msg) => (
            <div className="pl2 pr1 dib v-mid" title={msg}>
              <ZoomPlusIcon
                width="18px"
                height="18px"
                className="pointer hover-blue-grey"
                onClick={() => setZoomedTaskId(data.taskId)}
              />
            </div>
          )}
        </FormattedMessage>
        <FormattedMessage {...messages[isCopied ? 'taskLinkCopied' : 'copyTaskLink']}>
          {(msg) => (
            <div className={`ph2 dib v-mid ${isCopied ? 'grey-light' : ''}`} title={msg}>
              <InternalLinkIcon
                width="18px"
                height="18px"
                className={`pointer ${isCopied ? '' : 'hover-blue-grey'}`}
                onClick={() =>
                  setCopied(`${location.origin}${location.pathname}?search=${data.taskId}`)
                }
              />
            </div>
          )}
        </FormattedMessage>
      </div>
    </div>
  );
}

export function TaskFilter({ userCanValidate, statusFilter, setStatusFn }: Object) {
  const options = [
    { label: <FormattedMessage {...messages.filterAll} />, value: 'ALL' },
    { label: <FormattedMessage {...messages.filterReadyToMap} />, value: 'READY' },
    ...(userCanValidate
      ? [
          {
            label: <FormattedMessage {...messages.filterReadyToValidate} />,
            value: 'MAPPED',
          },
        ]
      : []),
    {
      label: <FormattedMessage {...messages.taskStatus_INVALIDATED} />,
      value: 'INVALIDATED',
    },
    {
      label: <FormattedMessage {...messages.taskStatus_VALIDATED} />,
      value: 'VALIDATED',
    },
    { label: <FormattedMessage {...messages.taskStatus_BADIMAGERY} />, value: 'BADIMAGERY' },
    { label: <FormattedMessage {...messages.taskStatus_LOCKED} />, value: 'LOCKED' },
  ];

  return (
    <Dropdown
      onChange={(e) => setStatusFn(e[0].value)}
      value={statusFilter || 'ALL'}
      options={options}
      display={statusFilter || <FormattedMessage {...messages.filterAll} />}
      className="blue-dark bg-white pv2 ph2 ba b--grey-light"
    />
  );
}

export function TaskList({
  project,
  tasks,
  userCanValidate,
  activeFilter,
  selectTask,
  setZoomedTaskId,
  selected,
  userContributions,
  updateActivities,
  textSearch,
  setTextSearch,
}: Object) {
  const [readyTasks, setTasks] = useState([]);
  const [activeTaskModal, setActiveTaskModal] = useState(null);
  const [sortBy, setSortingOption] = useQueryParam('sortBy', StringParam);
  const [statusFilter, setStatusFilter] = useQueryParam('filter', StringParam);

  const orderedTasks = useCallback(
    (criteria) => {
      if (criteria === 'id') return readyTasks.sort(compareTaskId);
      if (criteria === '-date') return readyTasks.sort(compareLastUpdate).reverse();
      // default option is to order by date
      return readyTasks.sort(compareLastUpdate);
    },
    [readyTasks],
  );

  useEffect(() => {
    const tasksSortOrder = getItem('tasksSortOrder');
    tasksSortOrder && setSortingOption(tasksSortOrder);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getTasksByStatus = (tasks, filter) => {
    switch (filter) {
      case 'ALL':
        return tasks;
      case 'LOCKED':
        return tasks.filter((task) =>
          ['LOCKED_FOR_MAPPING', 'LOCKED_FOR_VALIDATION'].includes(task.properties.taskStatus),
        );
      default:
        return tasks.filter((task) => task.properties.taskStatus === filter);
    }
  };

  useEffect(() => {
    if (tasks && tasks.features) {
      let newTasks = tasks.features;
      newTasks = getTasksByStatus(newTasks, statusFilter || 'ALL');

      if (textSearch) {
        if (Number(textSearch)) {
          newTasks = newTasks.filter(
            (task) =>
              task.properties.taskId === Number(textSearch) ||
              (task.properties.actionBy && task.properties.actionBy.includes(textSearch)),
          );
        } else {
          const usersTaskIds = userContributions
            .filter((user) => user.username.toLowerCase().includes(textSearch.toLowerCase()))
            .map((user) => user.taskIds)
            .flat();
          newTasks = newTasks.filter(
            (task) =>
              usersTaskIds.includes(task.properties.taskId) ||
              (task.properties.actionBy &&
                task.properties.actionBy.toLowerCase().includes(textSearch.toLowerCase())),
          );
        }
      }
      setTasks(newTasks);
    }
  }, [textSearch, statusFilter, tasks, userContributions]);

  function updateSortingOption(data: Object) {
    if (data) {
      setSortingOption(data[0].value);
      setItem('tasksSortOrder', data[0].value);
    }
  }

  const sortingOptions = [
    { label: <FormattedMessage {...messages.sortById} />, value: 'id' },
    { label: <FormattedMessage {...messages.sortByMostRecentlyUpdate} />, value: 'date' },
    { label: <FormattedMessage {...messages.sortByLeastRecentlyUpdate} />, value: '-date' },
  ];

  return (
    <div className="cf">
      <div className="flex items-center flex-wrap" style={{ gap: '0.5rem' }}>
        <div className="w-40-l w-50-m w-100 relative">
          <FormattedMessage {...messages.filterPlaceholder}>
            {(msg) => {
              return (
                <input
                  type="text"
                  placeholder={msg}
                  className="pa2 w-100"
                  value={textSearch || ''}
                  onChange={(e) => setTextSearch(e.target.value)}
                />
              );
            }}
          </FormattedMessage>
          <CloseIcon
            onClick={() => {
              setTextSearch('');
            }}
            className={`absolute top-0 right-0 w1 h1 red pointer pr2 ${textSearch ? 'dib' : 'dn'}`}
            style={{ top: '12px' }}
          />
        </div>
        <TaskFilter
          userCanValidate={userCanValidate}
          statusFilter={statusFilter}
          setStatusFn={setStatusFilter}
        />
        <Dropdown
          onChange={updateSortingOption}
          value={sortBy || 'date'}
          options={sortingOptions}
          display={sortBy || <FormattedMessage {...messages.sortById} />}
          className="blue-dark bg-white pv2 ph2 ba b--grey-light"
        />
      </div>
      <ReactPlaceholder
        showLoadingAnimation={true}
        rows={6}
        delay={50}
        ready={tasks && tasks.features && tasks.features.length}
      >
        {readyTasks && (
          <PaginatedList
            pageSize={6}
            items={orderedTasks(sortBy)}
            ItemComponent={TaskItem}
            setZoomedTaskId={setZoomedTaskId}
            setActiveTaskModal={setActiveTaskModal}
            selected={selected}
            selectTask={selectTask}
            project={project}
          />
        )}
      </ReactPlaceholder>
      {activeTaskModal && (
        <TaskActivityModal
          project={project}
          tasks={readyTasks}
          taskId={activeTaskModal}
          setActiveTaskModal={setActiveTaskModal}
          updateActivities={updateActivities}
          userCanValidate={userCanValidate}
        />
      )}
    </div>
  );
}

function TaskActivityModal({
  taskId,
  setActiveTaskModal,
  tasks,
  project,
  updateActivities,
  userCanValidate,
}: Object) {
  const [taskData, setActiveTaskData] = useState();
  useEffect(() => {
    const filteredTasks = tasks.filter((task) => task.properties.taskId === taskId);
    setActiveTaskData(filteredTasks.length ? filteredTasks[0] : null);
  }, [tasks, taskId]);
  return (
    <Popup open modal closeOnDocumentClick onClose={() => setActiveTaskModal(null)}>
      {(close) => (
        <>
          {taskData ? (
            <TaskActivity
              taskId={taskId}
              project={project}
              status={taskData ? taskData.properties.taskStatus : 'READY'}
              bbox={taskData ? bbox(taskData.geometry) : ''}
              close={close}
              updateActivities={updateActivities}
              userCanValidate={userCanValidate}
            />
          ) : (
            <div className="w-100 pa4 blue-dark bg-white">
              <CloseIcon className="h1 w1 fr pointer" onClick={() => close()} />
              <h3 className="ttu f3 pa0 ma0 barlow-condensed b mb4">
                <FormattedMessage {...messages.taskUnavailable} />
              </h3>
              <p className="pb0">
                <FormattedMessage
                  {...messages.taskSplitDescription}
                  values={{ id: <b>#{taskId}</b> }}
                />
              </p>
            </div>
          )}
        </>
      )}
    </Popup>
  );
}

function PaginatedList({
  items,
  ItemComponent,
  pageSize,
  project,
  setZoomedTaskId,
  setActiveTaskModal,
  selectTask,
  selected,
}: Object) {
  const [page, setPage] = useQueryParam('page', NumberParam);
  const lastPage = howManyPages(items.length, pageSize);
  // reset page number to 1 if it is not valid any more
  useEffect(() => {
    if (items && page > 1 && page > lastPage) {
      setPage(1);
    }
  }, [items, page, lastPage, setPage]);

  const latestItems = useRef(items);
  useEffect(() => {
    latestItems.current = items;
  });
  // the useEffect above avoids the next one to run every time the items change
  useEffect(() => {
    // switch the taskList page to always show the selected task.
    // Only do it if there is only one task selected
    if (selected.length === 1) {
      const newPage =
        (latestItems.current.findIndex((task) => task.properties.taskId === selected[0]) + 1) /
        pageSize;
      if (newPage) setPage(Math.ceil(newPage));
    }
  }, [selected, latestItems, setPage, pageSize]);

  return (
    <>
      <div>
        {(!items || !items.length) && (
          <div className="tc mt5 mb3">
            <FormattedMessage {...messages.noTasksFound} />
          </div>
        )}
        {items.slice(pageSize * ((page || 1) - 1), pageSize * (page || 1)).map((item, n) => (
          <ItemComponent
            key={n}
            data={item.properties}
            project={project}
            selectTask={selectTask}
            selected={selected}
            setZoomedTaskId={setZoomedTaskId}
            setActiveTaskModal={setActiveTaskModal}
          />
        ))}
      </div>
      <div className="fr">
        <PaginatorLine
          activePage={page || 1}
          setPageFn={setPage}
          lastPage={lastPage}
          className="flex items-center pt2"
        />
      </div>
    </>
  );
}
