import React from 'react';
import { useSelector } from 'react-redux';
import { Link, navigate, useLocation } from '@reach/router';
import ReactTooltip from 'react-tooltip';
import DOMPurify from 'dompurify';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import systemAvatar from '../../assets/img/logo-square.png';
import { EyeIcon } from '../svgIcons';
import { CheckBox } from '../formInputs';
import { UserAvatar } from '../user/avatar';
import { DeleteButton } from '../teamsAndOrgs/management';
import { RelativeTimeWithUnit } from '../../utils/formattedRelativeTime';
import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';

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
  selected,
  setSelected,
}: Object) {
  const token = useSelector((state) => state.auth.get('token'));
  const location = useLocation();
  const setMessageAsRead = (messageId) => {
    fetchLocalJSONAPI(`notifications/${messageId}/`, token).then(() => {
      retryFn();
    });
  };

  const deleteNotification = (id) => {
    fetchLocalJSONAPI(`notifications/${id}/`, token, 'DELETE')
      .then(() => {
        setSelected(selected.filter((i) => i !== id));
        retryFn();
      })
      .catch((e) => {
        console.log(e.message);
      });
  };

  const replacedSubject = subject.replace('task=', 'search=');
  const openMessage = () => {
    setMessageAsRead(messageId);
    navigate(`/inbox/message/${messageId}/${location.search}`);
  };

  return (
    <article
      onClick={openMessage}
      className="pointer db base-font w-100 mb1 mw8 bg-white blue-dark ba br1 b--grey-light"
    >
      <div className={`pv3 pr3 bl bw2 br2 ${read ? 'b--white' : 'b--red'}`}>
        <div className="ph2 pt1 fl">
          <CheckBox activeItems={selected} toggleFn={setSelected} itemId={messageId} />
        </div>
        <div className={`fl dib w2 h3 mr3`}>
          <MessageAvatar messageType={messageType} fromUsername={fromUsername} size={'medium'} />
        </div>

        <strong
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            if (e.target.href === undefined) {
              openMessage();
            } else {
              window.open(e.target.href);
            }
          }}
          className={`messageSubjectLinks`}
          dangerouslySetInnerHTML={rawHtmlNotification(replacedSubject)}
        ></strong>

        <div
          className={`dib fr w3`}
          onClick={(e) => {
            e.persist();
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {!read && (
            <>
              <FormattedMessage {...messages.markAsRead}>
                {(msg) => (
                  <EyeIcon
                    onClick={() => setMessageAsRead(messageId)}
                    style={{ width: '20px', height: '20px' }}
                    className={`fl dn dib-ns h1 w1 pr1 nr4 mv1 pv1 hover-red blue-grey`}
                    data-tip={msg}
                  />
                )}
              </FormattedMessage>
              <ReactTooltip />
            </>
          )}
          <DeleteButton
            className={`fr bg-transparent bw0 w2 h2 lh-copy overflow-hidden`}
            showText={false}
            onClick={() => deleteNotification(messageId)}
          />
        </div>
        {messageType !== null ? (
          <div className={`fr-l di-l dn f7 truncate w4 pa1 ma1`} title={messageType}>
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
      <article
        className="db base-font w-100 hover-red blue-dark"
        style={{ marginBottom: '1.5rem' }}
      >
        <div className="flex" style={{ gap: '1rem' }}>
          <div className="h2 v-top">
            <MessageAvatar messageType={messageType} fromUsername={fromUsername} size={'medium'} />
          </div>
          <div>
            <div
              className="f7 messageSubjectLinks"
              dangerouslySetInnerHTML={rawHtmlNotification(subject)}
            ></div>
            <div className="blue-grey f7 mt2">
              <RelativeTimeWithUnit date={sentDate} />
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
