import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import ReactPlaceholder from 'react-placeholder';
import 'react-placeholder/lib/reactPlaceholder.css';
import { FormattedMessage, FormattedNumber } from 'react-intl';

import messages from './messages';
import { NotificationCard, NotificationCardMini } from './notificationCard';
import { RefreshIcon } from '../svgIcons';
import { pushToLocalJSONAPI } from '../../network/genericJSONRequest';

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
        <ReactPlaceholder ready={!state.isFirstLoading} type="media" rows={10}>
          <NotificationCards
            pageOfCards={stateNotifications}
            useMiniCard={props.useMiniCard}
            retryFn={props.retryFn}
          />
        </ReactPlaceholder>
      </div>
      {showRefreshButton && (
        <div className="ph2 pt1 pb2 tc db mb2">
          <button className="pa2 pointer ba b--grey-light bg-tan" onClick={() => props.retryFn()}>
            <RefreshIcon height="15px" className="pt1" />
          </button>
        </div>
      )}
    </div>
  );
};

const NotificationCards = (props) => {
  const selectedState = useState([]);

  if (!props || !props.pageOfCards || props.pageOfCards.length === 0) {
    return (
      <div className="mb3 blue-grey">
        <FormattedMessage {...messages.noMessages} />
      </div>
    );
  }
  const filterFn = props.useMiniCard ? (n) => !n.read : (n) => n;
  const filteredCards = props.pageOfCards.filter(filterFn);

  if (filteredCards < 1) {
    return (
      <div className="mb3 blue-grey">
        <FormattedMessage {...messages.noUnreadMessages} />
      </div>
    );
  }

  const Buttons = ({ selectedState }) => {
    const selected = selectedState[0];
    const token = useSelector((state) => state.auth.get('token'));

    const deleteMessages = (selected) => {
      if (selected.length === 0 || !token) {
        return;
      }
      const payload = JSON.stringify({ messageIds: selected });
      pushToLocalJSONAPI(`/api/v2/notifications/delete-multiple/`, payload, token, 'DELETE')
        .then((success) => props.retryFn())
        .catch((e) => {
          console.log(e.message);
        });
    };

    let buttonClass = `${
      selected.length === 0 ? 'bg-blue-grey' : 'bg-red'
    } pv2 ph3 white f5 ba b--tan`;

    return (
      <div className="mb2">
        <button onClick={() => deleteMessages(selected)} className={buttonClass}>
          <FormattedMessage {...messages.delete} />
        </button>
      </div>
    );
  };

  return (
    <div>
      <Buttons selectedState={selectedState} />
      {filteredCards.map((card, n) =>
        props.useMiniCard ? (
          <NotificationCardMini {...card} key={n} />
        ) : (
          <NotificationCard
            {...card}
            key={n}
            retryFn={props.retryFn}
            selectedState={selectedState}
          />
        ),
      )}
    </div>
  );
};
