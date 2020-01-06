import React, { useState } from 'react';
import { Link } from '@reach/router';
import { FormattedRelative, FormattedMessage } from 'react-intl';
// import { FormattedRelativeTime } from 'react-intl';
// import {selectUnit} from '@formatjs/intl-utils';

import messages from './messages';
import { ListIcon, PlayIcon, ClockIcon } from '../svgIcons';
import { TaskStatus } from '../taskSelection/taskList';

export function TaskCard({
  taskId,
  projectId,
  taskStatus,
  lockHolder,
  title,
  taskHistory,
  taskAnnotation,
  isUndoable,
  autoUnlockSeconds,
  lastUpdated,
  lastUpdatedBy,
}: Object) {
  // const {value, unit} = selectUnit(new Date(sentDate));
  const [isHovered, setHovered] = useState(false);
  if (!title) {
    title = 'My Project';
  }
  if (!lastUpdatedBy) {
    lastUpdatedBy = 'user';
  }

  const timeToAutoUnlock =
    lastUpdated &&
    autoUnlockSeconds &&
    lockHolder &&
    new Date(+new Date(lastUpdated + '+00:00') + autoUnlockSeconds * 1000);

  return (
    <Link
      to={`/user/contributions/${projectId}/${taskId}`}
      className={`no-underline`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <article
        className={`db base-font bg-white w-75-l w-100 mb1 mh2 blue-dark mw8 ${
          isHovered ? 'shadow-4' : ''
        }`}
      >
        <div className="pv3 ph3 ba br1 b--grey-light cf">
          <div className="w-40-ns w-100 fl">
            <h4 className="mv0 fw6 f5">
              <FormattedMessage {...messages.projectTask} values={{task: taskId, project: projectId}}/>
            </h4>
            <div className={`pt2 blue-grey f6`} title={lastUpdated}>
              {/* <FormattedRelativeTime value={value} unit={unit}/> */}
              <span>
                <FormattedMessage
                  {...messages.lastUpdatedByUser}
                  values={{ time: <FormattedRelative value={new Date(lastUpdated + '+00:00')} /> }}
                />
              </span>
            </div>
          </div>
          <div className="w-40-ns w-100 fl">
            <div className={lockHolder ? '' : 'pv2 mv1'}>
              <div className="db">
                <TaskStatus status={taskStatus} lockHolder={lockHolder} />
              </div>
              {lockHolder &&
                <div className="dn dib-ns mv1 blue-grey bg-grey-light f7 pv1 ph2" title={timeToAutoUnlock} >
                  <ClockIcon className="pr2 v-mid" height="19px" width="13px" />
                  <span className="v-mid">
                    <FormattedMessage {...messages.unlock} values={{time: <FormattedRelative value={timeToAutoUnlock} />}}/>
                  </span>
                </div>
              }
            </div>
          </div>
          <div className="w-20-ns w-100 fr">
            <ListIcon className={`fr h1 w1 mv1 pv2 v-mid pr3 blue-light hover-blue-grey`} />
            {isHovered && ['READY', 'LOCKED_FOR_MAPPING', 'LOCKED_FOR_VALIDATION', 'INVALIDATED'].includes(taskStatus) &&
              <Link to={`/projects/${projectId}/tasks#task=${taskId}`}>
                <div className={`dn dib-l link pv2 ph3 mh3 mv1 bg-red white f7 fr`}>
                  <PlayIcon className={`ph1 dib-l dn`} />
                  <FormattedMessage {...messages.resumeTask} />
                </div>
              </Link>
            }
          </div>
        </div>
      </article>
    </Link>
  );
}
