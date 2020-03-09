import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import Popup from 'reactjs-popup';
import { useQueryParam, NumberParam, StringParam } from 'use-query-params';
import ReactPlaceholder from 'react-placeholder';
import bbox from '@turf/bbox';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { RelativeTimeWithUnit } from '../../utils/formattedRelativeTime';
import { TaskActivity } from './taskActivity';
import { compareTaskId, compareLastUpdate } from '../../utils/sorting';
import { userCanValidate } from '../../utils/projectPermissions';
import { TASK_COLOURS } from '../../config';
import { LockIcon, ListIcon, ZoomPlusIcon, CloseIcon } from '../svgIcons';
import { PaginatorLine, howManyPages } from '../paginator';
import { Dropdown } from '../dropdown';
import { Button } from '../button';

export function TaskStatus({ status, lockHolder }: Object) {
  const dotSize = ['READY', 'LOCKED_FOR_MAPPING'].includes(status) ? '0.875rem' : '1rem';
  return (
    <span>
      <span
        className={`${['READY', 'LOCKED_FOR_MAPPING'].includes(status) &&
          'ba bw1 b--grey-light'} dib v-mid`}
        style={{
          height: dotSize,
          width: dotSize,
          backgroundColor: TASK_COLOURS[status],
        }}
      ></span>
      {status.startsWith('LOCKED_FOR_') && (
        <LockIcon style={{ paddingTop: '1px' }} className="v-mid pl1 h1 w1" />
      )}
      <span className="pl2 v-mid">
        {status.startsWith('LOCKED_FOR_') && lockHolder ? (
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
    </span>
  );
}

function TaskItem({
  data,
  projectId,
  setZoomedTaskId,
  selectTask,
  selected = [],
  geometry,
  projectName,
  changesetComment,
}: Object) {
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
        <div className="w-25-l w-60 fl blue-grey dib truncate">
          <TaskStatus status={data.taskStatus} />
        </div>
      </div>
      <div className="w-10-l w-20 pv3 fl dib blue-light">
        <div className="dib v-mid">
          <Popup
            trigger={<ListIcon width="18px" height="18px" className="pointer hover-blue-grey" />}
            modal
            closeOnDocumentClick
          >
            {close => (
              <TaskActivity
                taskId={data.taskId}
                projectName={projectName}
                projectId={projectId}
                changesetComment={changesetComment}
                bbox={bbox(geometry)}
                close={close}
              />
            )}
          </Popup>
        </div>
        <div className="pl2 dib v-mid">
          <ZoomPlusIcon
            width="18px"
            height="18px"
            className="pointer hover-blue-grey"
            onClick={() => setZoomedTaskId(data.taskId)}
          />
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

  if (user.isExpert || user.mappingLevel !== 'BEGINNER') {
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

export function TaskList({
  project,
  tasks,
  activeFilter,
  selectTask,
  setZoomedTaskId,
  selected,
  userContributions,
}: Object) {
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
        if (Number(textSearch)) {
          newTasks = newTasks.filter(
            task =>
              task.taskId === Number(textSearch) ||
              (task.actionBy && task.actionBy.includes(textSearch)),
          );
        } else {
          const usersTaskIds = userContributions
            .filter(user => user.username.includes(textSearch))
            .map(user => user.taskIds)
            .flat();
          newTasks = newTasks.filter(task => usersTaskIds.includes(task.taskId));
        }
      }
      setTasks(newTasks);
    }
  }, [textSearch, statusFilter, tasks, userContributions]);

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
        {user.isExpert && (
          <div>
            <div className="w-50-l w-100 dib v-mid pr2 pv1 relative">
              <FormattedMessage {...messages.filterPlaceholder}>
                {msg => {
                  return (
                    <input
                      type="text"
                      placeholder={msg}
                      className="pa2 w-100"
                      value={textSearch || ''}
                      onChange={e => setTextSearch(e.target.value)}
                    />
                  );
                }}
              </FormattedMessage>
              <CloseIcon
                onClick={() => {
                  setTextSearch('');
                }}
                className={`absolute w1 h1 top-0 red pt3 pointer pr3 right-0 ${
                  textSearch ? 'dib' : 'dn'
                }`}
              />
            </div>
            <div className="w-50-l w-100 dib pv1">
              <Dropdown
                onAdd={() => {}}
                onRemove={() => {}}
                onChange={updateSortingOption}
                value={sortBy || 'date'}
                options={sortingOptions}
                display={sortBy || <FormattedMessage {...messages.sortById} />}
                className="blue-dark bg-white mr1 v-mid pv2 ph2 ba b--grey-light"
              />
            </div>
          </div>
        )}
        <TaskFilter project={project} statusFilter={statusFilter} setStatusFn={setStatusFilter} />
      </div>
      <ReactPlaceholder
        showLoadingAnimation={true}
        rows={6}
        delay={50}
        ready={tasks && tasks.activity && tasks.activity.length}
      >
        {readyTasks && (
          <PaginatedList
            pageSize={6}
            items={
              sortBy === 'id' ? readyTasks.sort(compareTaskId) : readyTasks.sort(compareLastUpdate)
            }
            ItemComponent={TaskItem}
            setZoomedTaskId={setZoomedTaskId}
            selected={selected}
            selectTask={selectTask}
            projectId={project.projectId}
            tasksGeoJSON={project.tasks}
            projectName={project.projectInfo.name}
            changesetComment={project.changesetComment}
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
  setZoomedTaskId,
  selectTask,
  tasksGeoJSON,
  selected,
  projectName,
  changesetComment,
}: Object) {
  const [page, setPage] = useQueryParam('page', NumberParam);
  const lastPage = howManyPages(items.length, pageSize);
  // change page to 1 if the page number is not valid
  if (items && page > lastPage) {
    setPage(1);
  }

  const latestItems = useRef(items);
  useEffect(() => {
    latestItems.current = items;
  });
  // the useEffect above avoids the next one to run everytime the items change
  useEffect(() => {
    // switch the taskList page to always show the selected task.
    // Only do it if there is only one task selected
    if (selected.length === 1) {
      setPage(
        Math.ceil(
          (latestItems.current.findIndex(task => task.taskId === selected[0]) + 1) / pageSize,
        ),
      );
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
            data={item}
            projectId={projectId}
            selectTask={selectTask}
            selected={selected}
            geometry={
              tasksGeoJSON.features.filter(task => task.properties.taskId === item.taskId)[0]
                .geometry
            }
            changesetComment={changesetComment}
            setZoomedTaskId={setZoomedTaskId}
            projectName={projectName}
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
