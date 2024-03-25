import { useState } from 'react';
import { Link } from 'react-router-dom';
import Popup from 'reactjs-popup';
import { FormattedMessage, useIntl } from 'react-intl';

import messages from './messages';
import { RelativeTimeWithUnit } from '../../utils/formattedRelativeTime';
import { ListIcon, ResumeIcon, ClockIcon, CommentIcon } from '../svgIcons';
import { TaskStatus } from '../taskSelection/taskList';
import { TaskActivity } from '../taskSelection/taskActivity';

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
  numberOfComments,
}: Object) {
  const [isHovered, setHovered] = useState(false);
  const taskLink = `/projects/${projectId}/tasks?search=${taskId}`;
  const intl = useIntl();

  const timeToAutoUnlock =
    lastUpdated &&
    autoUnlockSeconds &&
    lockHolder &&
    new Date(+new Date(lastUpdated) + autoUnlockSeconds * 1000);

  return (
    <article
      className={`db base-font bg-white w-75-l w-100 mb1 mh2 blue-dark mw8 ${
        isHovered ? 'shadow-4' : ''
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="pv3 ph3 ba br1 b--grey-light cf">
        <div className="w-third-ns w-100 fl">
          <Link to={taskLink} className="no-underline link blue-dark dib">
            <h4 className="mv0 fw6 f5">
              <FormattedMessage
                {...messages.projectTask}
                values={{ task: taskId, project: projectId }}
              />
            </h4>
          </Link>
          <div className={`pt2 blue-grey f6`} title={lastUpdated}>
            <span>
              <FormattedMessage
                {...messages.lastUpdatedByUser}
                values={{ time: <RelativeTimeWithUnit date={lastUpdated} /> }}
              />
            </span>
          </div>
        </div>
        <div className="w-third-ns w-100 fl">
          <div className={lockHolder ? '' : 'pv2 mv1'}>
            <div className="db">
              <TaskStatus status={taskStatus} lockHolder={lockHolder} />
            </div>
            {lockHolder && (
              <div
                className="dn dib-ns mv1 blue-grey bg-grey-light f7 pv1 ph2"
                title={timeToAutoUnlock}
              >
                <ClockIcon className="pr2 v-mid" height="19px" width="13px" />
                <span className="v-mid">
                  <FormattedMessage
                    {...messages.unlock}
                    values={{ time: <RelativeTimeWithUnit date={timeToAutoUnlock} /> }}
                  />
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="w-third-ns w-100 fr">
          {numberOfComments ? (
            <span
              className="w-auto tr fl mv1 pv2 f6 blue-grey"
              title={intl.formatMessage(messages.commentsNumber, { number: numberOfComments })}
            >
              <CommentIcon className="pr2 v-mid" height="19px" width="13px" />
              {numberOfComments}
            </span>
          ) : (
            ''
          )}
          <Popup
            trigger={
              <ListIcon className="pointer fr h1 w1 mv1 pv2 v-mid pr3 blue-light hover-blue-grey" />
            }
            modal
            closeOnDocumentClick
            nested
          >
            {(close) => (
              <TaskActivity taskId={taskId} project={{ projectId: projectId }} close={close} />
            )}
          </Popup>
          {isHovered &&
            ['READY', 'LOCKED_FOR_MAPPING', 'LOCKED_FOR_VALIDATION', 'INVALIDATED'].includes(
              taskStatus,
            ) && (
              <Link to={taskLink}>
                <div className={`dn dib-l link pv2 ph3 mh3 mv1 bg-red white f7 fr`}>
                  <ResumeIcon className={`ph1 dib-l dn`} />
                  <FormattedMessage {...messages.resumeTask} />
                </div>
              </Link>
            )}
        </div>
      </div>
    </article>
  );
}
