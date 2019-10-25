import React, { useState, useEffect } from 'react';
import { FormattedMessage, FormattedRelative } from 'react-intl';
import { useSelector } from 'react-redux';
import ReactPlaceholder from 'react-placeholder';
import { useQueryParam, NumberParam, StringParam } from 'use-query-params';

import messages from './messages';
import { useFetch } from '../../hooks/UseFetch';
import { compareTaskId, compareLastUpdate } from '../../utils/sorting';
import { userCanValidate } from '../../utils/projectPermissions';
import { TASK_COLOURS } from '../../config';
import { LockIcon, ListIcon, EyeIcon } from '../svgIcons';
import { PaginatorLine, howManyPages } from '../paginator';
import { Dropdown } from '../dropdown';
import { Button } from '../button';

function TaskStatus({ status }: Object) {
  const dotSize = ['READY', 'LOCKED_FOR_MAPPING'].includes(status) ? '7px' : '10px';
  return (
    <span>
      <span
        className={`${['READY', 'LOCKED_FOR_MAPPING'].includes(status) && 'ba b--grey-light'} dib`}
        style={{
          height: dotSize,
          width: dotSize,
          borderWidth: '2px',
          backgroundColor: TASK_COLOURS[status],
        }}
      ></span>
      {status.startsWith('LOCKED_FOR_') && (
        <LockIcon
          style={{ width: '12px', height: '12px', paddingTop: '1px' }}
          className="v-mid pl1"
        />
      )}
      <span className="pl2">
        <FormattedMessage {...messages[`taskStatus_${status}`]} />
      </span>
    </span>
  );
}

function TaskItem({ data, projectId, selectTask, selected = [] }: Object) {
  return (
    <div
      className={`cf db ba br1 mt2 ${
        selected.includes(data.taskId) ? 'b--blue-dark bw1' : 'b--tan bw1'
      }`}
    >
      <div
        className="w-90-l w-80 pv3 fl cf pointer"
        onClick={() => selectTask(data.taskId, data.taskStatus)}
      >
        <div className="w-75-l w-40 fl dib truncate">
          <span className="pl3 b">
            <FormattedMessage {...messages.taskId} values={{ id: data.taskId }} />
          </span>
          {data.actionDate && (
            <div className="dn di-l">
              <span className="ph2 blue-grey">&#183;</span>
              <span className="blue-grey">
                <FormattedMessage
                  {...messages.taskLastUpdate}
                  values={{ user: <span className="b blue-grey">{data.actionBy}</span> }}
                />{' '}
                <FormattedRelative value={data.actionDate} />
              </span>
            </div>
          )}
        </div>
        <div className="w-25-l w-60 fl blue-grey dib truncate">
          <TaskStatus status={data.taskStatus} />
        </div>
      </div>
      <div className="w-10-l w-20 pv3 fl dib blue-light">
        <div className="dib v-mid">
          <ListIcon width="18px" height="18px" className="pointer hover-blue-grey" />
        </div>
        <div className="pl2 dib v-mid">
          <EyeIcon width="18px" height="18px" className="pointer hover-blue-grey" />
        </div>
      </div>
    </div>
  );
}

export function TaskFilter({ project, statusFilter, setStatusFn }: Object) {
  const user = useSelector(state => state.auth.get('userDetails'));
  const validationIsPossible = user && project ? userCanValidate(user, project) : false;
  const activeClass = 'bg-blue-grey white';
  const inactiveClass = 'bg-white blue-grey';

  if (user.expertMode || user.mappingLevel !== 'BEGINNER') {
    return (
      <div className="pt1">
        <Button
          onClick={() => setStatusFn('all')}
          className={`dbi ${!statusFilter || statusFilter === 'all' ? activeClass : inactiveClass}`}
        >
          <FormattedMessage {...messages.filterAll} />
        </Button>
        <Button
          onClick={() => setStatusFn('readyToMap')}
          className={`dbi ${statusFilter === 'readyToMap' ? activeClass : inactiveClass}`}
        >
          <FormattedMessage {...messages.filterReadyToMap} />
        </Button>
        {validationIsPossible && (
          <Button
            onClick={() => setStatusFn('readyToValidate')}
            className={`dbi ${statusFilter === 'readyToValidate' ? activeClass : inactiveClass}`}
          >
            <FormattedMessage {...messages.filterReadyToValidate} />
          </Button>
        )}
      </div>
    );
  }
  return <></>;
}

export function TaskList({ project, activeFilter, selectTask, selected }: Object) {
  const [tasksError, tasksLoading, tasks] = useFetch(
    `projects/${project.projectId}/activities/latest/`,
  );
  const user = useSelector(state => state.auth.get('userDetails'));
  const [readyTasks, setTasks] = useState([]);
  const [textSearch, setTextSearch] = useQueryParam('search', StringParam);
  const [sortBy, setSortingOption] = useQueryParam('sortBy', StringParam);
  const [statusFilter, setStatusFilter] = useQueryParam('filter', StringParam);

  useEffect(() => {
    if (tasks && tasks.activity) {
      let newTasks = tasks.activity;
      if (statusFilter === 'readyToMap') {
        newTasks = newTasks.filter(task => ['READY', 'INVALIDATED'].includes(task.taskStatus));
      }
      if (statusFilter === 'readyToValidate') {
        newTasks = newTasks.filter(task => ['MAPPED', 'BADIMAGERY'].includes(task.taskStatus));
      }
      if (textSearch) {
        newTasks = newTasks.filter(
          task =>
            task.taskId === Number(textSearch) ||
            (task.actionBy && task.actionBy.includes(textSearch)),
        );
      }
      setTasks(newTasks);
    }
  }, [textSearch, statusFilter, tasks]);

  function updateSortingOption(data: Object) {
    if (data) {
      setSortingOption(data[0].value);
    }
  }

  const sortingOptions = [
    { label: <FormattedMessage {...messages.sortById} />, value: 'id' },
    { label: <FormattedMessage {...messages.sortByLastUpdate} />, value: 'date' },
  ];

  return (
    <div className="cf">
      <div className="cf">
        {user.expertMode && (
          <div>
            <div className="w-50-l w-100 dib v-mid pr2 pv1">
              <input
                type="text"
                placeholder="Filter tasks by id or username"
                className="pa2 w-100"
                value={textSearch || ''}
                onChange={e => setTextSearch(e.target.value)}
              />
            </div>
            <div className="w-50-l w-100 dib pv1">
              <Dropdown
                onAdd={() => {}}
                onRemove={() => {}}
                onChange={updateSortingOption}
                value={sortBy || 'id'}
                options={sortingOptions}
                display={sortBy || <FormattedMessage {...messages.sortById} />}
                className="blue-dark bg-white mr1 v-mid pv2 ph2 ba b--grey-light"
              />
            </div>
          </div>
        )}
        <TaskFilter project={project} statusFilter={statusFilter} setStatusFn={setStatusFilter} />
      </div>
      <ReactPlaceholder showLoadingAnimation={true} rows={6} delay={500} ready={!tasksLoading}>
        {!tasksError && !tasksLoading && (
          <PaginatedList
            pageSize={6}
            items={
              sortBy === 'date'
                ? readyTasks.sort(compareLastUpdate)
                : readyTasks.sort(compareTaskId)
            }
            ItemComponent={TaskItem}
            selected={selected}
            selectTask={selectTask}
            projectId={project.projectId}
          />
        )}
      </ReactPlaceholder>
    </div>
  );
}

function PaginatedList({
  items,
  ItemComponent,
  pageSize,
  projectId,
  selectTask,
  selected,
}: Object) {
  const [page, setPage] = useQueryParam('page', NumberParam);
  const lastPage = howManyPages(items.length, pageSize);
  // change page to 1 if the page number is not valid
  if (items && page > lastPage) {
    setPage(1);
  }
  return (
    <>
      <div>
        {items.slice(pageSize * ((page || 1) - 1), pageSize * (page || 1)).map((item, n) => (
          <ItemComponent
            key={n}
            data={item}
            projectId={projectId}
            selectTask={selectTask}
            selected={selected}
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
