import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { backendToQueryConversion, useInboxQueryParams } from '../hooks/UseInboxQueryAPI';
import { InboxNav, InboxNavMini, InboxNavMiniBottom } from '../components/notifications/inboxNav';
import {
  NotificationResults,
  NotificationResultsMini,
} from '../components/notifications/notificationResults';
import { useSetTitleTag } from '../hooks/UseMetaTags';
import { Login } from './login';
import { remapParamsToAPI } from '../utils/remapParamsToAPI';
import Paginator from '../components/notifications/paginator';
import { fetchLocalJSONAPI } from '../network/genericJSONRequest';

function serializeParams(queryState) {
  const obj = remapParamsToAPI(queryState, backendToQueryConversion);

  Object.keys(obj).forEach((key) => {
    if (obj[key] === undefined) {
      delete obj[key];
    }
  });

  return Object.entries(obj)
    .map(([key, val]) => `${key}=${val}`)
    .join('&');
}

export const NotificationPopout = (props) => {
  // Small screen size, as defined by tachyons
  let smallScreenSize = !window.matchMedia('(min-width: 30em)')?.matches;
  // Notification popout position and margin. The popout is anchored outside of the screen and centered on small screens.
  const popoutPosition = {
    left: `${smallScreenSize ? '-2rem' : Math.max(0, props.position - 320).toString() + 'px'}`,
    right: `${smallScreenSize ? '-2rem' : 'auto'}`,
    margin: `${smallScreenSize ? '.5rem auto 0' : '.5rem 0 0'}`,
  };

  return (
    <>
      <div
        style={{
          minWidth: '390px',
          width: '390px',
          zIndex: '100',
          filter: 'drop-shadow(0px 2px 24px rgba(0, 0, 0, 0.5))',
          ...popoutPosition,
        }}
        className={`fr ${props.isPopoutFocus ? '' : 'dn '}br2 absolute bg-white`}
      >
        <InboxNavMini unreadNotificationCount={props.notifications.pagination?.total} />
        <NotificationResultsMini {...props} className="tl" />
        <InboxNavMiniBottom
          className="tl"
          setPopoutFocus={props.setPopoutFocus}
          msgCount={props.notifications.userMessages?.length}
        />
      </div>
      <div
        style={{ zIndex: '100', left: `${props.position}px` }}
        className={`${
          props.isPopoutFocus ? '' : 'dn '
        }absolute w1 h1 bg-white bl bt b--grey-light rotate-45`}
      />
    </>
  );
};

export const NotificationsPage = (props) => {
  useSetTitleTag('Notifications');
  const userToken = useSelector((state) => state.auth.token);
  const [inboxQuery, setInboxQuery] = useInboxQueryParams();
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  console.log('inboxQuery', inboxQuery);

  const fetchNotifications = () => {
    return fetchLocalJSONAPI(`notifications/?${serializeParams(inboxQuery)}`, userToken)
      .then((result) => setNotifications(result))
      .catch((e) => setError(e));
  };

  useEffect(() => {
    fetchNotifications().then(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inboxQuery]);

  if (!userToken) {
    return <Login redirectTo={window.location.pathname} />;
  }

  return (
    <div className="pb5 ph6-l ph2 pt180 pull-center bg-washed-blue notifications-container">
      {
        props.children
        /* This is where the full notification body component is rendered using the router, as a child route. */
      }
      <section>
        <InboxNav />
        <NotificationResults
          error={error}
          loading={loading}
          notifications={notifications}
          retryFn={fetchNotifications}
        />
        <div className="flex justify-end mw8">
          <Paginator
            inboxQuery={inboxQuery}
            notifications={notifications}
            setInboxQuery={setInboxQuery}
          />
        </div>
      </section>
    </div>
  );
};

export const NotificationPageIndex = () => {
  return null;
};
