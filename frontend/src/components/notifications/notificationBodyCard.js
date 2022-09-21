import React from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation, navigate } from '@reach/router';
import ReactPlaceholder from 'react-placeholder';
import 'react-placeholder/lib/reactPlaceholder.css';
import { selectUnit } from '../../utils/selectUnit';
import { FormattedRelativeTime, FormattedMessage } from 'react-intl';

import messages from './messages';
import { MessageAvatar, typesThatUseSystemAvatar, rawHtmlNotification } from './notificationCard';
import { CloseIcon } from '../svgIcons';
import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';
import { DeleteButton } from '../teamsAndOrgs/management';
import './styles.scss';

export const NotificationBodyModal = (props) => {
  const location = useLocation();

  return (
    <div
      onClick={() => navigate(`../../${location.search}`)}
      className="fixed top-0 left-0 right-0 bottom-0 notification-ctr"
    >
      <div
        className={`relative shadow-3 flex flex-column notification`}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();

          if (e.target.href !== undefined) {
            window.open(e.target.href);
          }
        }}
      >
        <div className={`di fl f125 tl pa3 w-100 fw7 bb b--tan header`}>
          <FormattedMessage {...messages.message} />
          <Link className={`fr ml4 blue-dark`} to={`../../${location.search}`}>
            <CloseIcon className={`h1 w1 blue-dark`} />
          </Link>
        </div>
        {!props.thisNotificationError && (
          <NotificationBodyCard
            loading={props.thisNotificationLoading}
            card={props.thisNotification}
          />
        )}
        {props.thisNotificationError && !props.thisNotificationLoading && (
          <div>
            <FormattedMessage
              {...messages.errorLoadingTheX}
              values={{
                xWord: <FormattedMessage {...messages.message} />,
              }}
            />
          </div>
        )}
        {props.children}
      </div>
    </div>
  );
};

export function NotificationBodyCard({
  loading,
  card: {
    messageId,
    name,
    messageType,
    fromUsername,
    displayPictureUrl,
    subject,
    message,
    sentDate,
  },
}: Object) {
  const token = useSelector((state) => state.auth.token);
  const location = useLocation();
  const { value, unit } = selectUnit(new Date((sentDate && new Date(sentDate)) || new Date()));
  const showASendingUser =
    fromUsername || (typesThatUseSystemAvatar.indexOf(messageType) !== -1 && 'System');

  let replacedSubject;
  let replacedMessage;

  if (subject !== undefined) {
    replacedSubject = subject.replace('task=', 'search=');
  }

  if (message !== undefined) {
    replacedMessage = message.replace('task=', 'search=');
  }
  const deleteNotification = (id) => {
    fetchLocalJSONAPI(`notifications/${id}/`, token, 'DELETE')
      .then((success) => navigate(`../../${location.search}`))
      .catch((e) => {
        console.log(e.message);
      });
  };

  return (
    <ReactPlaceholder ready={!loading} type="media" rows={6}>
      <article className={`db  base-font mb3 mh2 blue-dark mw8`}>
        <div className={`dib`}>
          <div className="fl pl2">
            <MessageAvatar
              fromUsername={fromUsername}
              displayPictureUrl={displayPictureUrl}
              messageType={messageType}
              size={'medium'}
            />
          </div>

          {showASendingUser && <div className={`pl5 f6 blue-dark fw5`}>{showASendingUser}</div>}
          <div className={`pl5 f6 blue-grey`}>
            <FormattedRelativeTime value={value} unit={unit} />
          </div>
        </div>
        <div className="pv3 pr3 pl5">
          <strong
            className={`pv3 messageSubjectLinks bodyCard`}
            dangerouslySetInnerHTML={rawHtmlNotification(replacedSubject)}
          ></strong>
          <div
            className={`pv3 f6 lh-title messageBodyLinks bodyCard`}
            dangerouslySetInnerHTML={rawHtmlNotification(replacedMessage)}
          />
        </div>
        <DeleteButton
          className={`fr bg-red br1 white ma2 ph4 pv2`}
          onClick={() => deleteNotification(messageId)}
        />
      </article>
    </ReactPlaceholder>
  );
}
