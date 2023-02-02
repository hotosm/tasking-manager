import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { TopNavLink } from './NavLink';
import { BellIcon } from '../svgIcons';
import { NotificationPopout } from '../../views/notifications';
import { useFetchWithAbort, useFetchIntervaled } from '../../hooks/UseFetch';
import { useOnClickOutside } from '../../hooks/UseOnClickOutside';
import { pushToLocalJSONAPI } from '../../network/genericJSONRequest';
import { useOnResize } from '../../hooks/UseOnResize';

export const NotificationBell = () => {
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();
  const trigger = token !== null;

  const [bellPosition, setBellPosition] = useState(0);
  /* these below make the references stable so hooks doesn't re-request forever */
  const notificationBellRef = useRef(null);
  const [error, loading, notifications, refetch] = useFetchWithAbort(
    'notifications/?status=unread',
  );
  const [isPopoutFocus, setPopoutFocus] = useState(false);
  const [doesUnreadNotificationsExist, setDoesUnreadNotificationsExist] = useState(false);
  const [initialUnreadCountError, initialUnreadCountLoading, initialUnreadCount] =
    useFetchWithAbort('/api/v2/notifications/queries/own/count-unread/', trigger);
  const [unreadCountError, unreadCount] = useFetchIntervaled(
    '/api/v2/notifications/queries/own/count-unread/',
    30000,
    trigger,
  );

  useEffect(() => {
    dispatch({ type: 'SET_UNREAD_COUNT', payload: notifications.pagination?.total });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications.pagination?.total]);

  useEffect(() => {
    // unreadCount will receive a value only after 30 seconds,
    // so while it's undefined, we rely on initialUnreadCount
    if ((!unreadCount && initialUnreadCount?.newMessages) || unreadCount?.newMessages) {
      setDoesUnreadNotificationsExist(true);
    } else {
      setDoesUnreadNotificationsExist(false);
    }
  }, [initialUnreadCount, unreadCount]);

  const handleBellClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setBellPosition(e.target.getBoundingClientRect().left);
    setPopoutFocus(!isPopoutFocus);
    if (doesUnreadNotificationsExist) {
      pushToLocalJSONAPI('/api/v2/notifications/queries/own/post-unread/', null, token);
      setDoesUnreadNotificationsExist(false);
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
    (!unreadCountError && unreadCount?.unread) ||
    (!initialUnreadCountLoading && !initialUnreadCountError && initialUnreadCount?.unread);

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
          {doesUnreadNotificationsExist && <div className="redicon" />}
        </div>
      </TopNavLink>
      <NotificationPopout
        isPopoutFocus={isPopoutFocus}
        setPopoutFocus={setPopoutFocus}
        liveUnreadCount={liveUnreadCount}
        position={bellPosition}
        error={error}
        loading={loading}
        notifications={notifications}
        retryFn={refetch}
      />
    </span>
  );
};
