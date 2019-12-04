import React, { useState, useRef } from 'react';

import { TopNavLink } from './NavLink';
import { BellIcon } from '../svgIcons';
import { useFetch, useFetchIntervaled } from '../../hooks/UseFetch';

import { NotificationPopout } from '../../views/notifications';
import useForceUpdate from '../../hooks/UseForceUpdate';
import { useInboxQueryAPI } from '../../hooks/UseInboxQueryAPI';

export const NotificationBell = props => {
  const [forceUpdated, forceUpdate] = useForceUpdate();

  /* these below make the references stable so hooks doesn't re-request forever */
  const nothing = useRef(null);
  const sortByRead = useRef({ sortBy: 'read' });
  const [notificationState] = useInboxQueryAPI(nothing.current, sortByRead.current, forceUpdated);

  const [isPopoutFocus, setPopoutFocus] = useState(false);

  /*TODO Replace this backend with websockets, eventsource or RESTSockets 
    to save batteries and capacity*/
  const [unreadNotifsStartError, unreadNotifsStartLoading, unreadNotifsStart] = useFetch(
    `/api/v2/notifications/queries/myself/count-unread/`,
  );
  const [unreadNotifsRepeatError, unreadNotifsRepeat] = useFetchIntervaled(
    `/api/v2/notifications/queries/myself/count-unread/`,
    30000,
  );

  const isNotificationBellActive = ({ isCurrent }) => {
    return isCurrent
      ? { className: `link barlow-condensed blue-dark f4 ttu bb b--blue-dark bw1 pv2` }
      : { className: `link barlow-condensed blue-dark f4 ttu` };
  };

  const lightTheBell =
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

  return (
    <>
      <TopNavLink
        to={'inbox/'}
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          setPopoutFocus(true);
        }}
        isActive={isNotificationBellActive}
      >
        <div className="relative dib">
          <BellIcon />
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
    </>
  );
};
