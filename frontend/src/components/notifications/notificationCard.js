import React, { useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Popup from 'reactjs-popup';
import { Tooltip } from 'react-tooltip';
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
import { NotificationBodyModal } from './notificationBodyCard';

import 'reactjs-popup/dist/index.css';

export const rawHtmlNotification = (notificationHtml) => ({
  __html: DOMPurify.sanitize(notificationHtml),
});
export const stripHtmlToText = (notificationHtml) =>
  DOMPurify.sanitize(notificationHtml, { ALLOWED_TAGS: [] });

export const typesThatUseSystemAvatar = ['SYSTEM', 'REQUEST_TEAM_NOTIFICATION'];

export const MessageAvatar = ({ messageType, fromUsername, displayPictureUrl, size }: Object) => {
  const checkIsSystem = typesThatUseSystemAvatar.indexOf(messageType) !== -1;

  if (!fromUsername && !checkIsSystem) {
    return null;
  }

  return (
    <>
      {fromUsername /*picture={null} does a fetch user profile to get pic url */ ? (
        <UserAvatar
          username={fromUsername}
          picture={displayPictureUrl}
          colorClasses="white bg-blue-grey"
          size={size}
          disableLink={false}
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
  displayPictureUrl,
  subject,
  read,
  sentDate,
  retryFn,
  selected,
  setSelected,
}: Object) {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const ref = useRef();
  const replacedSubject = subject.replace('task=', 'search=');

  const setMessageAsRead = () => {
    !read &&
      fetchLocalJSONAPI(`notifications/${messageId}/`, token).then(() => {
        retryFn();
        dispatch({
          type: 'DECREMENT_UNREAD_COUNT',
        });
      });
  };

  const deleteNotification = (id) => {
    fetchLocalJSONAPI(`notifications/${id}/`, token, 'DELETE')
      .then(() => {
        setSelected(selected.filter((i) => i !== id));
        retryFn();
        dispatch({
          type: 'DECREMENT_UNREAD_COUNT',
        });
      })
      .catch((e) => {
        console.log(e.message);
      });
  };

  return (
    <Popup
      modal
      ref={ref}
      closeOnDocumentClick={false}
      onOpen={setMessageAsRead}
      trigger={
        <article className="pointer db base-font w-100 mb2 mw8 bg-white blue-dark br1 shadow-1">
          <div className={`pv3 pr3 bl bw2 br2 ${read ? 'b--white' : 'b--red'} flex items-center`}>
            <div className="ph3 pt1">
              <CheckBox activeItems={selected} toggleFn={setSelected} itemId={messageId} />
            </div>
            <div className="flex-grow-1">
              <div className="flex">
                <div className={`mr3`}>
                  <MessageAvatar
                    messageType={messageType}
                    fromUsername={fromUsername}
                    displayPictureUrl={displayPictureUrl}
                    size={'medium'}
                  />
                </div>
                <div>
                  <p
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      // Navigate to links on markdown anchor elements click
                      if (e.target.href !== undefined) {
                        window.open(e.target.href);
                      } else {
                        ref.current.open();
                      }
                    }}
                    className={`messageSubjectLinks ma0 f6`}
                    dangerouslySetInnerHTML={rawHtmlNotification(replacedSubject)}
                  />
                  <div className={`pt2 blue-grey f6`}>
                    <RelativeTimeWithUnit date={sentDate} />
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`dib w3`}
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
                        role="button"
                        onClick={() => setMessageAsRead()}
                        style={{ width: '20px', height: '20px' }}
                        className={`dn dib-ns h1 w1 pr1 nr4 mv1 pv1 hover-red blue-light ml3`}
                        data-tooltip-id={'setMessageAsReadTooltip'}
                        data-tooltip-content={msg}
                        aria-label="Mark notification as read"
                      />
                    )}
                  </FormattedMessage>
                  <Tooltip id={'setMessageAsReadTooltip'} />
                </>
              )}
            </div>
            {messageType !== null && (
              <div className={`di-l dn f7 truncate w4 lh-solid`} title={messageType}>
                <FormattedMessage {...messages[messageType]} />
              </div>
            )}
            <DeleteButton
              className={`bg-transparent bw0 w2 h2 lh-copy overflow-hidden blue-light p0 mb1 hover-red`}
              showText={false}
              onClick={(e) => {
                e.stopPropagation();
                deleteNotification(messageId);
              }}
            />
          </div>
        </article>
      }
    >
      {(close) => <NotificationBodyModal id={messageId} close={close} retryFn={retryFn} />}
    </Popup>
  );
}

export function NotificationCardMini({
  messageId,
  messageType,
  fromUsername,
  displayPictureUrl,
  subject,
  sentDate,
  setPopoutFocus,
  retryFn,
  read,
}: Object) {
  const dispatch = useDispatch();

  const setMessageAsRead = () => {
    if (!read) {
      retryFn();
      dispatch({
        type: 'DECREMENT_UNREAD_COUNT',
      });
    }
  };

  return (
    <Popup
      modal
      nested
      onClose={setMessageAsRead}
      trigger={
        <article
          className="db base-font w-100 hover-red blue-dark pointer"
          style={{ marginBottom: '1.5rem', padding: '0 1.3rem' }}
        >
          <div className="flex" style={{ gap: '1rem' }}>
            <div className="h2 v-top">
              <MessageAvatar
                messageType={messageType}
                fromUsername={fromUsername}
                displayPictureUrl={displayPictureUrl}
                size={'medium'}
              />
            </div>
            <div>
              <div
                className="f7 messageSubjectLinks ws-normal"
                style={{ lineHeight: 1.21 }}
                dangerouslySetInnerHTML={rawHtmlNotification(subject)}
              />
              <div className="blue-grey f7 mt2">
                <RelativeTimeWithUnit date={sentDate} />
              </div>
            </div>
          </div>
        </article>
      }
    >
      {(close) => (
        <NotificationBodyModal
          id={messageId}
          close={close}
          setPopoutFocus={setPopoutFocus}
          retryFn={retryFn}
        />
      )}
    </Popup>
  );
}
