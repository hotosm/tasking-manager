import React from 'react';
import { Link } from '@reach/router';
import ReactPlaceholder from 'react-placeholder';
import 'react-placeholder/lib/reactPlaceholder.css';

import {
  MessageAvatar,
  typesThatUseSystemAvatar,
  rawHtmlNotification,
  stripHtmlToText,
} from './notificationCard';
import { CloseIcon } from '../../components/svgIcons';
import { FormattedRelative, FormattedMessage } from 'react-intl';
import messages from './messages';
import { DeleteModal } from '../deleteModal';

export const NotificationBodyModal = props => {
  return (
    <div
      style={{
        inset: '0px',
        background: 'rgba(0, 0, 0, 0.5) none repeat scroll 0% 0%',
        display: 'flex',
        'z-index': '999',
      }}
      onClick={() => props.navigate('../../')}
      className="fixed top-0 left-0 right-0 bottom-0"
    >
      <div
        className={`relative shadow-3`}
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
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
          <Link className={`fr ml4 blue-dark`} to={`../../`}>
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
  const showASendingUser =
    fromUsername || (typesThatUseSystemAvatar.indexOf(messageType) !== -1 && 'System');
  return (
    <ReactPlaceholder ready={!loading} type="media" rows={6}>
      <article className={`db  base-font mb3 mh2 blue-dark mw8`}>
        <div className={`dib`}>
          <div className="fl pl2">
            <MessageAvatar fromUsername={fromUsername} messageType={messageType} size={'medium'} />
          </div>

          {showASendingUser && <div className={`pl5 f6 blue-dark fw5`}>{showASendingUser}</div>}
          <div className={`pl5 f6 blue-grey`}>
            <FormattedRelative value={(sentDate && new Date(sentDate + '+00:00')) || new Date()} />
          </div>
        </div>
        <div className="pv3 pr3 pl5">
          <strong
            className={`pv3 messageSubjectLinks bodyCard`}
            dangerouslySetInnerHTML={rawHtmlNotification(subject)}
          ></strong>
          <div
            className={`pv3 f6 messageBodyLinks bodyCard`}
            dangerouslySetInnerHTML={rawHtmlNotification(message)}
          />
        </div>
        <DeleteModal
          className={`fr bg-red b--grey-light white  ma2 ph4 pv2 `}
          id={messageId}
          name={"'" + stripHtmlToText(subject) + "'"}
          type="notifications"
        />
      </article>
    </ReactPlaceholder>
  );
}
