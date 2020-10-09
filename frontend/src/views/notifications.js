import React from 'react';
import { useSelector } from 'react-redux';

import { useInboxQueryAPI, useInboxQueryParams } from '../hooks/UseInboxQueryAPI';
import useForceUpdate from '../hooks/UseForceUpdate';
import { InboxNav, InboxNavMini, InboxNavMiniBottom } from '../components/notifications/inboxNav';
import {
  NotificationResults,
  NotificationResultsMini,
} from '../components/notifications/notificationResults';
import { NotificationBodyModal } from '../components/notifications/notificationBodyCard';
import { ProjectCardPaginator } from '../components/projects/projectCardPaginator';
import { useFetch } from '../hooks/UseFetch';
import { useSetTitleTag } from '../hooks/UseMetaTags';
import { Login } from './login';

export const NotificationPopout = (props) => {
  // Small screen size, as defined by tachyons
  let smallScreenSize = !window.matchMedia('(min-width: 30em)').matches;
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
          ...popoutPosition,
        }}
        className={`fr ${props.isPopoutFocus ? '' : 'dn '}br2 absolute shadow-2 ph4 pb3 bg-white`}
      >
        <InboxNavMini
          newMsgCount={
            props.state &&
            props.state.notifications &&
            props.state.notifications.filter((n) => !n.read).length
          }
        />
        <NotificationResultsMini
          liveUnreadCount={props.liveUnreadCount}
          retryFn={props.forceUpdate}
          state={props.state}
          className="tl"
        />
        <InboxNavMiniBottom
          className="tl"
          setPopoutFocus={props.setPopoutFocus}
          msgCount={props.state && props.state.notifications && props.state.notifications.length}
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
  const initialData = {
    mapResults: {
      features: [],
      type: 'FeatureCollection',
    },
    results: [],
    pagination: { hasNext: false, hasPrev: false, page: 1 },
  };
  const userToken = useSelector((state) => state.auth.get('token'));
  const [inboxQuery, setInboxQuery] = useInboxQueryParams();
  const [forceUpdated, forceUpdate] = useForceUpdate();
  const [state] = useInboxQueryAPI(initialData, inboxQuery, forceUpdated);

  if (!userToken) {
    return <Login redirectTo={window.location.pathname} />;
  }
  // const [isPopoutFocus, setPopoutFocus] = useState(true);

  return (
    <>
      <div className="pt4-l pb5 ph5-l ph2 pt180 pull-center bg-tan">
        {
          props.children
          /* This is where the full notification body component is rendered using the router, as a child route. */
        }
        <section className="cf">
          <InboxNav />
          <NotificationResults retryFn={forceUpdate} state={state} />
          <ProjectCardPaginator projectAPIstate={state} setQueryParam={setInboxQuery} />

          {/* delete me! TDK */}
          <code className={`dn`}>{JSON.stringify(state)}</code>
        </section>
      </div>
    </>
  );
};

export const NotificationPageIndex = (props) => {
  return null;
};

export const NotificationDetail = (props) => {
  const [thisNotificationError, thisNotificationLoading, thisNotification] = useFetch(
    `notifications/${props.id}/`,
  );

  /* Inside, this loads a NotificationBodyCard */
  return (
    <NotificationBodyModal
      thisNotificationError={thisNotificationError}
      thisNotificationLoading={thisNotificationLoading}
      thisNotification={thisNotification}
    />
  );
};
