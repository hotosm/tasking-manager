import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';

import { TopNavLink } from './NavLink';
import { BellIcon } from '../svgIcons';
import { NotificationPopout } from '../../views/notifications';
import { useFetch, useFetchIntervaled } from '../../hooks/UseFetch';
import { useOnClickOutside } from '../../hooks/UseOnClickOutside';
import useForceUpdate from '../../hooks/UseForceUpdate';
import { useInboxQueryAPI } from '../../hooks/UseInboxQueryAPI';
import { pushToLocalJSONAPI } from '../../network/genericJSONRequest';
import { useOnResize } from '../../hooks/UseOnResize';

export const NotificationBell = (props) => {
  const token = useSelector((state) => state.auth.get('token'));
  const trigger = token !== null;
  const [forceUpdated, forceUpdate] = useForceUpdate();
  const [bellPosition, setBellPosition] = useState(0);
  /* these below make the references stable so hooks doesn't re-request forever */
  const notificationBellRef = useRef(null);
  const params = useRef({ status: 'unread' });
  const [notificationState] = useInboxQueryAPI(
    notificationBellRef.current,
    params.current,
    forceUpdated,
  );

  const [isPopoutFocus, setPopoutFocus] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(false);
  const [initialUnreadCountError, initialUnreadCountLoading, initialUnreadCount] = useFetch(
    '/api/v2/notifications/queries/own/count-unread/',
    trigger,
  );
  const [unreadCountError, unreadCount] = useFetchIntervaled(
    '/api/v2/notifications/queries/own/count-unread/',
    30000,
    trigger,
  );

  useEffect(() => {
    // unreadCount will receive a value only after 30 seconds,
    //so while it's undefined, we rely on initialUnreadCount
    if (
      (!unreadCount && initialUnreadCount && initialUnreadCount.newMessages) ||
      (unreadCount && unreadCount.newMessages)
    ) {
      setUnreadNotifications(true);
    } else {
      setUnreadNotifications(false);
    }
  }, [initialUnreadCount, unreadCount]);

  const handleBellClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setBellPosition(e.target.getBoundingClientRect().left);
    setPopoutFocus(!isPopoutFocus);
    if (unreadNotifications) {
      forceUpdate(); // update the notifications when user clicks and there are unread messages
      pushToLocalJSONAPI('/api/v2/notifications/queries/own/post-unread/', null, token);
      setUnreadNotifications(false);
    }
  };

  const handleResizeCallback = useCallback(() => {
    if (isPopoutFocus) {
      setBellPosition(notificationBellRef.current.getBoundingClientRect().left);
    }
  }, [isPopoutFocus]);

  useOnResize(notificationBellRef, handleResizeCallback);
  useOnClickOutside(notificationBellRef, () => setPopoutFocus(false));

  const isNotificationBellActive = ({ isCurrent }) => {
    return isCurrent
      ? { className: `link barlow-condensed blue-dark f4 ttu bb b--blue-dark bw1 pv2` }
      : { className: `link barlow-condensed blue-dark f4 ttu v-mid pt1` };
  };

  const liveUnreadCount =
    (!unreadCountError && unreadCount && unreadCount.unread) ||
    (!initialUnreadCountLoading &&
      !initialUnreadCountError &&
      initialUnreadCount &&
      initialUnreadCount.unread);

  return (
    <span ref={notificationBellRef}>
      <TopNavLink
        to={'inbox/'}
        onClick={handleBellClick}
        onKeyPress={handleBellClick}
        isActive={isNotificationBellActive}
      >
        <div className="relative dib">
          <BellIcon aria-label="Notifications" role="button" />
          {unreadNotifications && <div className="redicon" />}
        </div>
      </TopNavLink>
      <NotificationPopout
        state={notificationState}
        forceUpdate={forceUpdate}
        isPopoutFocus={isPopoutFocus}
        setPopoutFocus={setPopoutFocus}
        liveUnreadCount={liveUnreadCount}
        position={bellPosition}
      />
    </span>
  );
};
