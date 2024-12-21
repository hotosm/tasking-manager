import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { TopNavLink } from './NavLink';
import { BellIcon } from '../svgIcons';
import { NotificationPopout } from '../../views/notifications';
import { useOnClickOutside } from '../../hooks/UseOnClickOutside';
import { pushToLocalJSONAPI } from '../../network/genericJSONRequest';
import { useOnResize } from '../../hooks/UseOnResize';
import { useNotificationsQuery, useUnreadNotificationsCountQuery } from '../../api/notifications';

export const NotificationBell = () => {
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();

  const [bellPosition, setBellPosition] = useState(0);
  /* these below make the references stable so hooks doesn't re-request forever */
  const notificationBellRef = useRef(null);
  const {
    data: notifications,
    isError,
    isLoading,
    refetch,
  } = useNotificationsQuery({ status: 'unread' });

  const [isPopoutFocus, setPopoutFocus] = useState(false);
  const [doesUnreadNotificationsExist, setDoesUnreadNotificationsExist] = useState(false);

  const { data: unreadNotification } = useUnreadNotificationsCountQuery();
  const liveUnreadCount = unreadNotification?.unread;

  useEffect(() => {
    dispatch({ type: 'SET_UNREAD_COUNT', payload: notifications.pagination?.total });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications.pagination?.total]);

  useEffect(() => {
    if (unreadNotification?.newMessages) {
      setDoesUnreadNotificationsExist(true);
      refetch();
    } else {
      setDoesUnreadNotificationsExist(false);
    }
  }, [refetch, unreadNotification?.newMessages]);

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

  return (
    <span ref={notificationBellRef} className="mr3">
      <TopNavLink
        to={'inbox/'}
        onClick={handleBellClick}
        onKeyPress={handleBellClick}
        isActive={isNotificationBellActive}
      >
        <div className="relative dib pt1">
          <BellIcon aria-label="Notifications" role="button" />
          {doesUnreadNotificationsExist && <div className="redicon" />}
        </div>
      </TopNavLink>
      <NotificationPopout
        isPopoutFocus={isPopoutFocus}
        setPopoutFocus={setPopoutFocus}
        liveUnreadCount={liveUnreadCount}
        position={bellPosition}
        isError={isError}
        isLoading={isLoading}
        notifications={notifications}
        retryFn={refetch}
      />
    </span>
  );
};
