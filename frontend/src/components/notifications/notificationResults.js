import React, { useEffect, useState } from 'react';
import ReactPlaceholder from 'react-placeholder';
import 'react-placeholder/lib/reactPlaceholder.css';
import { FormattedMessage, FormattedNumber } from 'react-intl';

import messages from './messages';
import { NotificationCard, NotificationCardMini } from './notificationCard';
import NotificationPlaceholder from './notificationPlaceholder';
import { DeleteNotificationsButton } from './deleteNotificationsButton';
import { RefreshIcon } from '../svgIcons';
import { SelectAll } from '../formInputs';
import { ReadNotificationsButton } from './readNotificationsButton';
import { SelectAllNotifications } from './selectAllNotifications';

export const NotificationResultsMini = (props) => {
  return <NotificationResults {...props} useMiniCard={true} />;
};

export const NotificationResults = ({
  className,
  error,
  loading,
  state,
  notifications,
  retryFn,
  useMiniCard,
  liveUnreadCount,
  setPopoutFocus,
  inboxQuery,
}) => {
  const stateNotifications = notifications.userMessages;

  const showRefreshButton =
    useMiniCard &&
    !error &&
    notifications.userMessages &&
    liveUnreadCount !== notifications.userMessages.filter((n) => !n.read).length;

  return (
    <div className={className || ''}>
      {!stateNotifications && <span>&nbsp;</span>}
      {notifications?.userMessages && !error && !useMiniCard && (
        <p className="blue-grey pt2 f7">
          <FormattedMessage
            {...messages.paginationCount}
            values={{
              number: stateNotifications && stateNotifications.length,
              total: (
                <FormattedNumber
                  value={
                    notifications.pagination &&
                    !isNaN(notifications.pagination.total) &&
                    notifications.pagination.total
                  }
                />
              ),
            }}
          />
        </p>
      )}

      {error && (
        <div className="bg-tan pa4 mt3">
          <FormattedMessage
            {...messages.errorLoadingTheXForY}
            values={{
              xWord: <FormattedMessage {...messages.projects} />,
              yWord: 'Notifications',
            }}
          />
          <div className="pa2">
            <button className="pa1" onClick={() => retryFn()}>
              <FormattedMessage {...messages.notificationsRetry} />
            </button>
          </div>
        </div>
      )}
      <div className={`cf`}>
        <ReactPlaceholder
          ready={!loading && stateNotifications}
          customPlaceholder={<NotificationPlaceholder />}
          type="media"
          rows={10}
        >
          <NotificationCards
            pageOfCards={stateNotifications}
            useMiniCard={useMiniCard}
            retryFn={retryFn}
            setPopoutFocus={setPopoutFocus}
            totalNotifications={notifications.pagination?.total}
            inboxQuery={inboxQuery}
          />
        </ReactPlaceholder>
      </div>
      {showRefreshButton && (
        <div className="ph2 pt1 pb2 tc db mb2">
          <button className="pv1 ph2 pointer ba b--grey-light bg-tan" onClick={() => retryFn()}>
            <RefreshIcon height="15px" className="pt1" />
          </button>
        </div>
      )}
    </div>
  );
};

const NotificationCards = ({
  pageOfCards,
  useMiniCard,
  retryFn,
  setPopoutFocus,
  totalNotifications,
  inboxQuery,
}) => {
  const [selected, setSelected] = useState([]);
  const [isAllSelected, setIsAllSelected] = useState(false);

  useEffect(() => {
    setSelected([]);
    setIsAllSelected(false);
  }, [inboxQuery?.types]);

  useEffect(() => {
    if (selected.length !== 10) {
      setIsAllSelected(false);
    }
  }, [selected]);

  if (pageOfCards.length === 0) {
    return (
      <div className="mb3 blue-grey">
        <FormattedMessage {...messages[useMiniCard ? 'noUnreadMessages' : 'noMessages']} />
      </div>
    );
  }

  const unreadCountInSelected = pageOfCards.reduce((acc, msg) => {
    return !msg.read && selected.includes(msg.messageId) ? acc + 1 : acc;
  }, 0);

  return (
    <>
      {!useMiniCard && (
        <>
          <div className="mb2 ph3 flex gap-1 items-center">
            <SelectAll
              allItems={pageOfCards.map((message) => message.messageId)}
              setSelected={setSelected}
              selected={selected}
              className="dib v-mid mv3 ml2"
            />
            <DeleteNotificationsButton
              selected={selected}
              setSelected={setSelected}
              retryFn={retryFn}
              unreadCountInSelected={unreadCountInSelected}
            />
            <ReadNotificationsButton
              selected={selected}
              setSelected={setSelected}
              retryFn={retryFn}
              unreadCountInSelected={unreadCountInSelected}
            />
          </div>
          {selected.length === 10 && totalNotifications > 10 && (
            <SelectAllNotifications
              inboxQuery={inboxQuery}
              totalNotifications={totalNotifications}
              setSelected={setSelected}
              isAllSelected={isAllSelected}
              setIsAllSelected={setIsAllSelected}
            />
          )}
            <NotificationCard
              {...card}
              key={n}
              retryFn={retryFn}
              selected={selected}
              setSelected={setSelected}
            />
          ))}
        </>
      )}
      {useMiniCard &&
        pageOfCards
          .slice(0, 5)
          .map((card, n) => (
            <NotificationCardMini
              {...card}
              key={n}
              setPopoutFocus={setPopoutFocus}
              retryFn={retryFn}
            />
          ))}
    </>
  );
};
