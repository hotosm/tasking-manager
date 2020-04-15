import React from 'react';
import { Link } from '@reach/router';
import DOMPurify from 'dompurify';

import { EyeIcon } from '../svgIcons';
import { UserAvatar } from '../user/avatar';
import systemAvatar from '../../assets/img/hot-system-avatar-square-opaque.png';
import { DeleteModal } from '../deleteModal';
import { RelativeTimeWithUnit } from '../../utils/formattedRelativeTime';
import { useSelector } from 'react-redux';
import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';
import { FormattedMessage } from 'react-intl';
import messages from './messages';

export const rawHtmlNotification = (notificationHtml) => ({
  __html: DOMPurify.sanitize(notificationHtml),
});
export const stripHtmlToText = (notificationHtml) =>
  DOMPurify.sanitize(notificationHtml, { ALLOWED_TAGS: [] });

export const typesThatUseSystemAvatar = ['SYSTEM', 'REQUEST_TEAM_NOTIFICATION'];

export const MessageAvatar = ({ messageType, fromUsername, size }: Object) => {
  const checkIsSystem = typesThatUseSystemAvatar.indexOf(messageType) !== -1;

  if (!fromUsername && !checkIsSystem) {
    return <div>&nbsp;</div>;
  }

  return (
    <>
      {fromUsername /*picture={null} does a fetch user profile to get pic url */ ? (
        <UserAvatar
          username={fromUsername}
          picture={null}
          colorClasses="white bg-blue-grey"
          size={size}
          disableLink={true}
        />
      ) : (
        checkIsSystem && (
          <UserAvatar
            username={'System'}
            picture={systemAvatar}
            size={size}
            colorClasses="white bg-blue-grey"
            disableLink={true}
          />
        )
      )}
    </>
  );
};

export function NotificationCard({
  messageId,
  messageType,
  fromUsername,
  subject,
  read,
  sentDate,
  retryFn,
}: Object) {
  const readStyle = read ? '' : 'bl bw2 br2 b2 b--red ';
  const token = useSelector((state) => state.auth.get('token'));
  const setMessageAsRead = (messageId) => {
    fetchLocalJSONAPI(`notifications/${messageId}/`, token).then(() => retryFn());
  };

  return (
    <Link to={`/inbox/message/${messageId}`} className={`no-underline `}>
      <article className={`db base-font bg-white w-100 mb1 blue-dark mw8 ${readStyle}`}>
        <div className="pv3 pr3 ba br1 b--grey-light">
          <div className={`fl dib w2 h3 mh3`}>
            <MessageAvatar messageType={messageType} fromUsername={fromUsername} size={'medium'} />
          </div>

          <strong
            className={`messageSubjectLinks`}
            dangerouslySetInnerHTML={rawHtmlNotification(subject)}
          ></strong>

          <div
            className={`dib fr`}
            onClick={(e) => {
              e.persist();
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <EyeIcon
              onClick={() => setMessageAsRead(messageId)}
              style={{ width: '20px', height: '20px' }}
              className={`fl dn dib-ns h1 w1 pr1 pr3-l nr4 ml4 mv1 pv1 hover-red blue-dark`}
            />
            <DeleteModal
              className={`fr bg-transparent bw0 w2 h2 lh-copy overflow-hidden `}
              id={messageId}
              name={"'" + stripHtmlToText(subject) + "'"}
              type="notifications"
            />
          </div>
          {messageType !== null ? (
            <div className={`fr-l di-l dn f7 truncate ttc w4 pa1 ma1`} title={messageType}>
              <FormattedMessage {...messages[messageType]} />
            </div>
          ) : null}
          {messageType === 'MENTION_NOTIFICATION' && (
            <div className="dn dib-ns fr ma1 ttu b--red ba red f7 pa1">1 mention</div>
          )}
          <div className={`pl5 pt2 blue-grey f6`}>
            <RelativeTimeWithUnit date={sentDate} />
          </div>
        </div>
      </article>
    </Link>
  );
}

export function NotificationCardMini({
  messageId,
  messageType,
  fromUsername,
  subject,
  sentDate,
}: Object) {
  return (
    <Link to={`/inbox/message/${messageId}`} className="no-underline hover-red">
      <article className="db base-font w-100 mb3 hover-red blue-dark">
        <div className="h2 pr3">
          <div style={{ width: '1.5rem' }} className="fl w-25 dib h2 ml2 mr3 v-top">
            <MessageAvatar messageType={messageType} fromUsername={fromUsername} size={'small'} />
          </div>
          <div
            className="dib f7 w-75 fl messageSubjectLinks"
            dangerouslySetInnerHTML={rawHtmlNotification(subject)}
          ></div>
          <div className="blue-grey f7 cf dib">
            <RelativeTimeWithUnit date={sentDate} />
          </div>
        </div>
      </article>
    </Link>
  );
}
