import React, { useState } from 'react';
import { Link } from '@reach/router';
import { ListIcon, PlayIcon } from '../svgIcons';
// import { FormattedRelativeTime } from 'react-intl';
// import {selectUnit} from '@formatjs/intl-utils';
import { TASK_COLOURS } from '../../config';
import { FormattedRelative, FormattedMessage } from 'react-intl';
import messages from './messages';

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
      to={`/user/contribution/${projectId}/${taskId}`}
      className={`no-underline`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <article
        className={`db base-font bg-white w-75-m w-100 mb0 mh2 blue-dark mw8 ${
          isHovered ? 'shadow-2' : ''
        }`}
      >
        <div className="pv3 ph3 ba br1 b--grey-light">
          <strong className={`messageSubjectLinks`}>
            #{projectId} · {title}
          </strong>

          {isHovered ? (
            <Link to={`/projects/${projectId}/tasks#task=${taskId}`}>
              <div className={`dn dib-l link pv2 ph3 mh3 mv2 bg-red white f7 fr`}>
                <PlayIcon className={`ph1 dib-l dn`} />
                <FormattedMessage {...messages.resumeTask} />
              </div>
            </Link>
          ) : (
            <div className={`fr dn dib-l w4 pv1 mh2 `}>&nbsp;</div>
          )}

          <Link to={`/user/contribution/`} className={`hover-red blue-dark`}>
            <ListIcon className={`fr h1 w1 mv1 pv1 pr3`} />
          </Link>

          <div className={`fr di f6 w5 ttc pa1 ma1`} title={taskStatus}>
            <div className={`dib pl2 p0-l relative`}>
              <div
                style={{ 'background-color': TASK_COLOURS[taskStatus] }}
                className={`ba b--grey-light absolute bottom-0 dib whalf hhalf br-100`}
              >
                &nbsp;
              </div>{' '}
            </div>
            <div className={`dib pl3 `}>{taskStatus.toLowerCase().replace(/_/g, ' ')}</div>
          </div>

          {lockHolder && (
            <>
              <div className="dn dib-ns fr ma1 ttu b--grey-blue ba grey-blue f7 pa1">
                <FormattedMessage
                  {...messages.lockedByLockholder}
                  values={{ lockholder: lockHolder }}
                />
              </div>
              <div
                className={`dn dib-ns fr ma1 ttu b--grey-blue ba grey-blue f7 pa1`}
                title={timeToAutoUnlock}
              >
                <FormattedRelative value={timeToAutoUnlock} />
                &nbsp;
                <FormattedMessage {...messages.unlock} />
              </div>
            </>
          )}

          <div className={`pl3 pt2 blue-grey f6`} title={lastUpdated}>
            {/* <FormattedRelativeTime value={value} unit={unit}/> */}
            <span>
              <FormattedMessage
                {...messages.lastUpdatedByUser}
                values={{ user: <Link to={'/user'}>{lastUpdatedBy}</Link> }}
              />
              &nbsp;&nbsp;
            </span>
            <FormattedRelative value={new Date(lastUpdated + '+00:00')} />
          </div>
        </div>
      </article>
    </Link>
  );
}
