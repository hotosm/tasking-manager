import React, { useEffect, useState } from 'react';
import ReactPlaceholder from 'react-placeholder';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import 'react-placeholder/lib/reactPlaceholder.css';

import messages from './messages';
import { NotificationCard, NotificationCardMini } from './notificationCard';
import NotificationPlaceholder from './notificationPlaceholder';
import { RefreshIcon } from '../svgIcons';
import { SelectAll } from '../formInputs';
import { SelectAllNotifications } from './selectAllNotifications';
import { ActionButtons } from './actionButtons';

export const NotificationResultsMini = (props) => {
  return <NotificationResults {...props} useMiniCard={true} />;
};

export const NotificationResults = ({
  className,
  isError,
  isLoading,
  notifications,
  retryFn,
  useMiniCard,
  liveUnreadCount,
  setPopoutFocus,
  inboxQuery,
  setInboxQuery,
}) => {
  const stateNotifications = notifications.userMessages;

  const showRefreshButton =
    useMiniCard &&
    !isError &&
    notifications.userMessages &&
    liveUnreadCount !== notifications.userMessages.filter((n) => !n.read).length;

  return (
    <div className={className || ''}>
      {!stateNotifications && <span>&nbsp;</span>}
      {notifications?.userMessages && !isError && !useMiniCard && (
        <p className="blue-grey pt2 f7">
          <FormattedMessage
            {...messages.paginationCount}
            values={{
              number: stateNotifications?.length,
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

      {isError && (
        <div className="bg-tan pa4 mt3">
          <FormattedMessage {...messages.errorLoadingNotifications} />
          <div className="pa2">
            <button className="pa1" onClick={() => retryFn()}>
              <FormattedMessage {...messages.notificationsRetry} />
            </button>
          </div>
        </div>
      )}
      <div className={`cf`}>
        <ReactPlaceholder
          ready={!isLoading && stateNotifications}
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
            totalPages={notifications.pagination?.pages}
            inboxQuery={inboxQuery}
            setInboxQuery={setInboxQuery}
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
  totalPages,
  inboxQuery,
  setInboxQuery,
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
      <div className={`mb3 ${useMiniCard ? 'ph3 ml2' : ''} blue-grey`}>
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
            <ActionButtons
              selected={selected}
              setSelected={setSelected}
              retryFn={retryFn}
              unreadCountInSelected={unreadCountInSelected}
              isAllSelected={isAllSelected}
              inboxQuery={inboxQuery}
              setInboxQuery={setInboxQuery}
              pageOfCards={pageOfCards}
              totalPages={totalPages}
            />
          </div>
          {selected.length === 10 && totalNotifications > 10 && !inboxQuery.project && (
            <SelectAllNotifications
              inboxQuery={inboxQuery}
              totalNotifications={totalNotifications}
              setSelected={setSelected}
              isAllSelected={isAllSelected}
              setIsAllSelected={setIsAllSelected}
            />
          )}
          {pageOfCards.map((card) => (
            <NotificationCard
              {...card}
              key={card.messageId}
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
              key={card.messageId}
              setPopoutFocus={setPopoutFocus}
              retryFn={retryFn}
            />
          ))}
    </>
  );
};
