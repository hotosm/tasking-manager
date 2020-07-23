import React, { useState, useRef } from 'react';
import { useSelector } from 'react-redux';

import { TopNavLink } from './NavLink';
import { BellIcon } from '../svgIcons';
import { NotificationPopout } from '../../views/notifications';
import { useFetch, useFetchIntervaled } from '../../hooks/UseFetch';
import { useOnClickOutside } from '../../hooks/UseOnClickOutside';
import useForceUpdate from '../../hooks/UseForceUpdate';
import { useInboxQueryAPI } from '../../hooks/UseInboxQueryAPI';
import { pushToLocalJSONAPI } from '../../network/genericJSONRequest';

export const NotificationBell = (props) => {
  const token = useSelector((state) => state.auth.get('token'));
  const trigger = token !== null;
  const [forceUpdated, forceUpdate] = useForceUpdate();

  /* these below make the references stable so hooks doesn't re-request forever */
  const notificationBellRef = useRef(null);
  const sortByRead = useRef({ sortBy: 'read' });
  const readNotifications = useRef(false);
  const [notificationState] = useInboxQueryAPI(
    notificationBellRef.current,
    sortByRead.current,
    forceUpdated,
  );

  const [isPopoutFocus, setPopoutFocus] = useState(false);
  /*TODO Replace this backend with websockets, eventsource or RESTSockets
    to save batteries and capacity*/
  const [unreadNotifsStartError, unreadNotifsStartLoading, unreadNotifsStart] = useFetch(
    `/api/v2/notifications/queries/own/count-unread/`,
    trigger,
  );
  const [unreadNotifsRepeatError, unreadNotifsRepeat] = useFetchIntervaled(
    `/api/v2/notifications/queries/own/count-unread/`,
    30000,
    trigger,
  );

  useOnClickOutside(notificationBellRef, () => setPopoutFocus(false));

  const isNotificationBellActive = ({ isCurrent }) => {
    return isCurrent
      ? { className: `link barlow-condensed blue-dark f4 ttu bb b--blue-dark bw1 pv2` }
      : { className: `link barlow-condensed blue-dark f4 ttu v-mid pt1` };
  };

  let lightTheBell =
    (!unreadNotifsStartLoading &&
      !unreadNotifsStartError &&
      unreadNotifsStart &&
      unreadNotifsStart.newMessages) ||
    (!unreadNotifsRepeatError && unreadNotifsRepeat && unreadNotifsRepeat.newMessages);
  const liveUnreadCount =
    (!unreadNotifsRepeatError && unreadNotifsRepeat && unreadNotifsRepeat.unread) ||
    (!unreadNotifsStartLoading &&
      !unreadNotifsStartError &&
      unreadNotifsStart &&
      unreadNotifsStart.unread);

  // When user clicks on the bell. Update notifications model in the backend.
  if (isPopoutFocus === true) {
    pushToLocalJSONAPI(`/api/v2/notifications/queries/own/post-unread/`, null, token);
    readNotifications.current = true;
  }

  // Do not light the bell when user has pressed the button previously and there is no notifications update.
  if (
    readNotifications.current === true &&
    unreadNotifsRepeat &&
    unreadNotifsRepeat.newMessages === true
  ) {
    readNotifications.current = false;
  }

  if (readNotifications.current === true) {
    lightTheBell = false;
  }

  return (
    <span ref={notificationBellRef}>
      <TopNavLink
        to={'inbox/'}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setPopoutFocus(!isPopoutFocus);
        }}
        isActive={isNotificationBellActive}
      >
        <div className="relative dib">
          <BellIcon aria-label="Notifications" />
          {lightTheBell && <div className="redicon"></div>}
        </div>
      </TopNavLink>
      <NotificationPopout
        state={notificationState}
        forceUpdate={forceUpdate}
        isPopoutFocus={isPopoutFocus}
        setPopoutFocus={setPopoutFocus}
        liveUnreadCount={liveUnreadCount}
      />
    </span>
  );
};
