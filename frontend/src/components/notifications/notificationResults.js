import React, { useState } from 'react';
import ReactPlaceholder from 'react-placeholder';
import 'react-placeholder/lib/reactPlaceholder.css';
import { FormattedMessage, FormattedNumber } from 'react-intl';

import messages from './messages';
import { NotificationCard, NotificationCardMini } from './notificationCard';
import { DeleteNotificationsButton } from './deleteNotificationsButton';
import { RefreshIcon } from '../svgIcons';
import { SelectAll } from '../formInputs';

export const NotificationResultsMini = (props) => {
  return <NotificationResults {...props} useMiniCard={true} />;
};

export const NotificationResults = (props) => {
  const state = props.state;
  const stateNotifications = !props.useMiniCard
    ? props.state.notifications
    : props.state.unreadNotificationsMini;
  const showRefreshButton =
    !state.isError &&
    props.useMiniCard &&
    props.state.unreadNotificationsMini &&
    props.liveUnreadCount !== props.state.unreadNotificationsMini.filter((n) => !n.read).length;
  return (
    <div className={props.className || ''}>
      {!stateNotifications ? (
        <span>&nbsp;</span>
      ) : (
        !state.isError &&
        !props.useMiniCard && (
          <p className="blue-grey ml3 pt2 f7">
            <FormattedMessage
              {...messages.paginationCount}
              values={{
                number: stateNotifications && stateNotifications.length,
                total: (
                  <FormattedNumber
                    value={
                      state.pagination && !isNaN(state.pagination.total) && state.pagination.total
                    }
                  />
                ),
              }}
            />
          </p>
        )
      )}

      {state.isError ? (
        <div className="bg-tan pa4 mt3">
          <FormattedMessage
            {...messages.errorLoadingTheXForY}
            values={{
              xWord: <FormattedMessage {...messages.projects} />,
              yWord: 'Notifications',
            }}
          />
          <div className="pa2">
            <button className="pa1" onClick={() => props.retryFn()}>
              <FormattedMessage {...messages.notificationsRetry} />
            </button>
          </div>
        </div>
      ) : null}
      <div className={`cf ${!props.useMiniCard ? 'ml1 db' : 'dib'}`}>
        <ReactPlaceholder
          ready={!state.isFirstLoading && stateNotifications}
          type="media"
          rows={10}
        >
          <NotificationCards
            pageOfCards={stateNotifications}
            useMiniCard={props.useMiniCard}
            retryFn={props.retryFn}
          />
        </ReactPlaceholder>
      </div>
      {showRefreshButton && (
        <div className="ph2 pt1 pb2 tc db mb2">
          <button
            className="pv1 ph2 pointer ba b--grey-light bg-tan"
            onClick={() => props.retryFn()}
          >
            <RefreshIcon height="15px" className="pt1" />
          </button>
        </div>
      )}
    </div>
  );
};

const NotificationCards = ({ pageOfCards, useMiniCard, retryFn }) => {
  const [selected, setSelected] = useState([]);

  if (pageOfCards.length === 0) {
    return (
      <div className="mb3 blue-grey">
        <FormattedMessage {...messages[useMiniCard ? 'noUnreadMessages' : 'noMessages']} />
      </div>
    );
  }

  return (
    <div>
      {!useMiniCard && (
        <div className="mb2">
          <SelectAll
            allItems={pageOfCards.map((message) => message.messageId)}
            setSelected={setSelected}
            selected={selected}
            className="dib v-mid mv3 ml3"
          />
          <DeleteNotificationsButton
            selected={selected}
            setSelected={setSelected}
            retryFn={retryFn}
          />
        </div>
      )}
      {useMiniCard
        ? // show only 5 messages when on miniCard
          pageOfCards.slice(0, 5).map((card, n) => <NotificationCardMini {...card} key={n} />)
        : pageOfCards.map((card, n) => (
            <NotificationCard
              {...card}
              key={n}
              retryFn={retryFn}
              selected={selected}
              setSelected={setSelected}
            />
          ))}
    </div>
  );
};
