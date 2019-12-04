import React from 'react';
import { Link } from '@reach/router';
import DOMPurify from 'dompurify';
import { EyeIcon, ListIcon } from '../svgIcons';
import { UserAvatar } from '../user/avatar';
import systemAvatar from '../../assets/img/hot-system-avatar-square-opaque.png';
// import { FormattedRelativeTime } from 'react-intl';
// import {selectUnit} from '@formatjs/intl-utils';
import { FormattedRelative } from 'react-intl';
import { DeleteModal } from '../deleteModal';

export const rawHtmlNotification = notificationHtml => ({
  __html: DOMPurify.sanitize(notificationHtml),
});
export const stripHtmlToText = notificationHtml =>
  DOMPurify.sanitize(notificationHtml, { ALLOWED_TAGS: [] });

const ReadLink = props => (
  <Link to={`/inbox/message/${props.messageId}/read`} className={`hover-red blue-dark`}>
    <EyeIcon className={`fr dn dib-ns h1 w1 pr1 pr3-l mv1 pv1`} />
  </Link>
);

const ListLink = props => (
  <Link to={`/inbox/message/${props.messageId}/list`} className={`hover-red blue-dark`}>
    <ListIcon className={`fr dn dib-ns h1 w1 pr1 pr3-l mv1 pv1`} />
  </Link>
);
export const typesThatUseSystemAvatar = ['SYSTEM', 'REQUEST_TEAM_NOTIFICATION'];
const typesThatAreMessages = ['SYSTEM', 'REQUEST_TEAM_NOTIFICATION', 'INVITATION_NOTIFICATION'];

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
        />
      ) : (
        checkIsSystem && (
          <UserAvatar
            username={'System'}
            picture={systemAvatar}
            size={size}
            colorClasses="white bg-blue-grey"
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
}: Object) {
  const readOrListLink =
    messageType && typesThatAreMessages.indexOf(messageType) === -1 ? (
      <ListLink messageId={messageId} />
    ) : (
      <ReadLink messageId={messageId} />
    );

  const readStyle = read ? '' : 'bl bw2 br2 b2 b--red ';
  // const {value, unit} = selectUnit(new Date(sentDate));

  return (
    <Link to={`/inbox/message/${messageId}`} className={`no-underline `}>
      <article className={`db base-font bg-white w-100 mb1 mh2 blue-dark mw8 ${readStyle}`}>
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
            onClick={e => {
              e.persist();
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {' '}
            <DeleteModal
              className={`fr bg-transparent bw0 w2 h2 lh-copy overflow-hidden `}
              id={messageId}
              name={"'" + stripHtmlToText(subject) + "'"}
              type="notifications"
            />
          </div>
          <div
            className={`fr-l di-l dn f7 truncate ttc w4 pa1 ma1`}
            title={messageType.toLowerCase().replace(/_/g, ' ')}
          >
            {messageType.toLowerCase().replace(/_/g, ' ')}
          </div>

          {readOrListLink}
          {messageType === 'MENTION_NOTIFICATION' && (
            <div className="dn dib-ns fr ma1 ttu b--red ba red f7 pa1">1 mention</div>
          )}
          <div className={`pl5 pt2 blue-grey f6`}>
            {/* <FormattedRelativeTime value={value} unit={unit}/> */}
            <FormattedRelative value={new Date(sentDate)} />
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
  // const {value, unit} = selectUnit(new Date(sentDate));

  return (
    <Link to={`/inbox/message/${messageId}`} className={`no-underline hover-red`}>
      <article className={`db base-font w-100 mb3 hover-red blue-dark`}>
        <div className="h2 pr3">
          <div style={{ width: '1.5rem' }} className={`fl dib h2 ml2 mr3 v-top`}>
            <MessageAvatar messageType={messageType} fromUsername={fromUsername} size={'small'} />
          </div>
          <div
            className="dib f7 w-75 messageSubjectLinks"
            dangerouslySetInnerHTML={rawHtmlNotification(subject)}
          ></div>
          <div className={`pl2 blue-grey f7`}>
            {/* <FormattedRelativeTime value={value} unit={unit}/> */}
            <FormattedRelative value={new Date(sentDate + '+00:00')} />
          </div>
        </div>
      </article>
    </Link>
  );
}
