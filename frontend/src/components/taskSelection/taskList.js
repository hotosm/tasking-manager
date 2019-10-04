import React from 'react';
import { FormattedMessage, FormattedRelative } from 'react-intl';
import ReactPlaceholder from 'react-placeholder';
import { useQueryParam, NumberParam } from 'use-query-params';

import messages from './messages';
import { useFetch } from '../../hooks/UseFetch';
import { compareTaskId } from '../../utils/sorting';
import { colours } from './map';
import { LockIcon } from '../svgIcons';
import { PaginatorLine, howManyPages } from '../paginator'

function TaskStatus({status}: Object) {
  const dotSize = ['READY', 'LOCKED_FOR_MAPPING'].includes(status) ? '7px': '10px';
  return (
    <span>
      <span className={`${['READY', 'LOCKED_FOR_MAPPING'].includes(status) && 'ba b--grey-light'} dib`}
        style={{height: dotSize, width: dotSize, borderWidth: "2px", backgroundColor: colours[status]}} >
      </span>
      {status.startsWith('LOCKED_FOR_') &&
        <LockIcon style={{width: "12px", height: "12px", paddingTop: "1px"}} className="v-mid pl1"/>
      }
      <span className="pl2">
        <FormattedMessage {...messages[`taskStatus_${status}`]} />
      </span>
    </span>
  );
}

function TaskItem({data, projectId, selectTask, selected=[]}: Object) {
  return (
    <div className={`cf db pv3 ba br1 mt2 ${selected.includes(data.taskId) ? 'b--blue-dark bw1' : 'b--tan bw1'}`}>
      <div className="w-60 fl dib pointer" onClick={() => selectTask(data.taskId, data.taskStatus)}>
        <span className="pl3 b">
          <FormattedMessage {...messages.taskId} values={{id: data.taskId}}/>
        </span>
        {data.actionDate &&
          <>
            <span className="ph2 blue-grey">&#183;</span>
            <span className="blue-grey">
            <FormattedMessage {...messages.taskLastUpdate} values={{user: <span className="b blue-grey">{data.actionBy}</span>}} />
            { ' ' }
            <FormattedRelative value={data.actionDate} />
            </span>
          </>
        }
      </div>
      <div className="w-30 fl blue-grey dib">
        <TaskStatus status={data.taskStatus} />
      </div>
      <div className="w-10 fl dib">

      </div>
    </div>
  );
}

export function TaskList({projectId, activeFilter, selectTask, selected}: Object) {
  const [error, loading, tasks] = useFetch(`projects/${projectId}/activities/latest/`);

  // to apply filter depending if action is map or validation
  // const activeStatus = ['MAPPED', 'VALIDATED', 'LOCKED_FOR_MAPPING', 'LOCKED_FOR_VALIDATION', 'INVALIDATED', 'BADIMAGERY'];
  // const mapStatus = ['READY', 'INVALIDATED'];
  return <div className="cf">
    <ReactPlaceholder
      showLoadingAnimation={true}
      rows={6}
      delay={500}
      ready={!loading}
    >
      {!error && !loading &&
        <PaginatedList
          pageSize={6}
          items={tasks.activity.sort(compareTaskId)}
          ItemComponent={TaskItem}
          selected={selected}
          selectTask={selectTask}
          projectId={projectId}
        />
      }
    </ReactPlaceholder>
  </div>;
}

function PaginatedList({items, ItemComponent, pageSize, projectId, selectTask, selected}: Object) {
  const [page, setPage] = useQueryParam('page', NumberParam);
  const lastPage = howManyPages(items.length, pageSize);
  // change page to 1 if the page number is not valid
  if (items && page > lastPage) {
    setPage(1);
  }
  return <>
    {items
      .slice(pageSize * ((page || 1) - 1), pageSize * (page || 1))
      .map((item, n) =>
        <ItemComponent key={n} data={item} projectId={projectId} selectTask={selectTask} selected={selected} />
    )}
    <PaginatorLine activePage={page || 1} setPageFn={setPage} lastPage={lastPage} />
  </>;
}
