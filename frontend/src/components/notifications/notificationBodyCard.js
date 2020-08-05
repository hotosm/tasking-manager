import React from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation, navigate } from '@reach/router';
import ReactPlaceholder from 'react-placeholder';
import 'react-placeholder/lib/reactPlaceholder.css';
import { selectUnit } from '@formatjs/intl-utils';
import { FormattedRelativeTime, FormattedMessage } from 'react-intl';

import messages from './messages';
import { MessageAvatar, typesThatUseSystemAvatar, rawHtmlNotification } from './notificationCard';
import { CloseIcon } from '../svgIcons';
import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';
import { DeleteButton } from '../teamsAndOrgs/management';

export const NotificationBodyModal = (props) => {
  const location = useLocation();

  return (
    <div
      style={{
        inset: '0px',
        background: 'rgba(0, 0, 0, 0.5) none repeat scroll 0% 0%',
        display: 'flex',
        'z-index': '999',
      }}
      onClick={() => navigate(`../../${location.search}`)}
      className="fixed top-0 left-0 right-0 bottom-0"
    >
      <div
        className={`relative shadow-3`}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();

          if (e.target.href !== undefined) {
            window.open(e.target.href);
          }
        }}
        style={{
          background: 'rgb(255, 255, 255) none repeat scroll 0% 0%',
          width: '55%',
          margin: '5em auto auto',
          border: '1px solid rgb(187, 187, 187)',
          padding: '5px',
        }}
      >
        <div className={`di fl tl pa3 mb3 w-100 fw5 bb b--tan`}>
          <FormattedMessage {...messages.message} />
          <Link className={`fr ml4 blue-dark`} to={`../../${location.search}`}>
            <CloseIcon className={`h1 w1 blue-dark`} />
          </Link>
        </div>
        {!props.thisNotificationError ? (
          <NotificationBodyCard
            loading={props.thisNotificationLoading}
            card={props.thisNotification}
          />
        ) : (
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
  card: { messageId, name, messageType, fromUsername, subject, message, sentDate },
}: Object) {
  const token = useSelector((state) => state.auth.get('token'));
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
            <MessageAvatar fromUsername={fromUsername} messageType={messageType} size={'medium'} />
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
