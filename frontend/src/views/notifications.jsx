import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { useInboxQueryParams } from '../hooks/UseInboxQueryAPI';
import { InboxNav, InboxNavMini, InboxNavMiniBottom } from '../components/notifications/inboxNav';
import {
  NotificationResults,
  NotificationResultsMini,
} from '../components/notifications/notificationResults';
import { useSetTitleTag } from '../hooks/UseMetaTags';
import Paginator from '../components/notifications/paginator';
import { useNotificationsQuery } from '../api/notifications';

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
        <InboxNavMini
          unreadNotificationCount={props.notifications.pagination?.total}
          setPopoutFocus={props.setPopoutFocus}
        />
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

export const NotificationsPage = () => {
  useSetTitleTag('Notifications');
  const navigate = useNavigate();
  const location = useLocation();
  const userToken = useSelector((state) => state.auth.token);
  const [inboxQuery, setInboxQuery] = useInboxQueryParams();
  const { data: notifications, isError, isLoading, refetch } = useNotificationsQuery(inboxQuery);

  useEffect(() => {
    if (!userToken) {
      navigate('/login', {
        state: {
          from: location.pathname,
        },
      });
    }
  }, [location.pathname, navigate, userToken]);

  return (
    <div className="pb5 ph6-l ph2 pt180 pull-center bg-washed-blue notifications-container">
      <section>
        <InboxNav />
        <NotificationResults
          isError={isError}
          isLoading={isLoading}
          notifications={notifications}
          inboxQuery={inboxQuery}
          retryFn={refetch}
          setInboxQuery={setInboxQuery}
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
