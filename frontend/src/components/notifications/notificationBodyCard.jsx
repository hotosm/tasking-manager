import { useEffect } from 'react';
import { useTypedSelector } from '@Store/hooks';
import ReactPlaceholder from 'react-placeholder';
import 'react-placeholder/lib/reactPlaceholder.css';
import { selectUnit } from '../../utils/selectUnit';
import { FormattedRelativeTime, FormattedMessage } from 'react-intl';

import messages from './messages';
import { MessageAvatar, typesThatUseSystemAvatar, rawHtmlNotification } from './notificationCard';
import { useFetch } from '../../hooks/UseFetch';
import { CloseIcon } from '../svgIcons';
import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';
import { DeleteButton } from '../teamsAndOrgs/management';
import { ORG_NAME } from '../../config';
import './styles.scss';
import { useState } from 'react';

export const NotificationBodyModal = (props) => {
  const [thisNotificationError, thisNotificationLoading, thisNotification] = useFetch(
    `notifications/${props.id}/`,
  );

  useEffect(() => {
    // Close the mini notification popover if it's open
    props.setPopoutFocus && props.setPopoutFocus(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`relative shadow-3 flex flex-column notification`}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();

        // Navigate to links on markdown anchor elements click
        if (e.target.href !== undefined) {
          window.open(e.target.href);
        }
      }}
    >
      <div
        className={`di fl f125 tl pa3 w-100 fw7 bb b--tan header base-font`}
        style={{ letterSpacing: '0.114546px' }}
      >
        <FormattedMessage {...messages.message} />
        <CloseIcon
          role="button"
          className={`fr ml4 blue-dark h1 w1 blue-dark pointer`}
          onClick={props.close}
          aria-label="Close"
        />
      </div>
      {!thisNotificationError && (
        <NotificationBodyCard
          loading={thisNotificationLoading}
          card={thisNotification}
          retryFn={props.retryFn}
          closeModal={props.close}
        />
      )}
      {thisNotificationError && !thisNotificationLoading && (
        <div>
          <FormattedMessage
            {...messages.errorLoadingTheX}
            values={{
              xWord: <FormattedMessage {...messages.notification} />,
            }}
          />
        </div>
      )}
      {props.children}
    </div>
  );
};

export function NotificationBodyCard({
  loading,
  retryFn,
  closeModal,
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
}) {
  const token = useTypedSelector((state) => state.auth.token);
  const { value, unit } = selectUnit(new Date((sentDate && new Date(sentDate)) || new Date()));
  const showASendingUser =
    fromUsername || (typesThatUseSystemAvatar.indexOf(messageType) !== -1 && ORG_NAME);
  const [replacedSubjectHTML, setReplacedSubjectHTML] = useState('');
  const [replacedMessageHTML, setReplacedMessageHTML] = useState("");
  const deleteNotification = (id) => {
    fetchLocalJSONAPI(`notifications/${id}/`, token, 'DELETE')
      .then(() => {
        retryFn();
        closeModal();
      })
      .catch((e) => {
        console.log(e.message);
      });
  };

  useEffect(() => {
    const replacedSubject = subject ? subject.replace('task=', 'search=') : '';
    const replacedMessage = message ? message.replace('task=', 'search=') : '';
    setReplacedSubjectHTML(rawHtmlNotification(replacedSubject).__html);
    setReplacedMessageHTML(rawHtmlNotification(replacedMessage).__html);
  }, [messageId, token, subject, message]);

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
            dangerouslySetInnerHTML={{
              __html: replacedSubjectHTML
            }}
          ></strong>
          <div
            className={`pv3 f6 lh-title messageBodyLinks bodyCard`}
            dangerouslySetInnerHTML={{
              __html: replacedMessageHTML
            }}
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
