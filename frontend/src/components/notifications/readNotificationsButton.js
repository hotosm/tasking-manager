import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { EyeIcon } from '../svgIcons';
import { Button } from '../button';
import { pushToLocalJSONAPI } from '../../network/genericJSONRequest';

export const ReadNotificationsButton = ({
  selected,
  setSelected,
  retryFn,
  unreadCountInSelected,
  isAllSelected,
  inboxQuery,
  updateUnreadCount,
}) => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  const markNotificationsAsRead = (selected) => {
    const param = inboxQuery.types ? `?messageType=${inboxQuery.types?.join(',')}` : '';
    const payload = JSON.stringify({ messageIds: selected });

    if (isAllSelected) {
      pushToLocalJSONAPI(`/api/v2/notifications/mark-as-read-all/${param}`, null, token, 'POST')
        .then(() => {
          setSelected([]);
          retryFn();
          updateUnreadCount();
        })
        .catch((e) => {
          console.log(e.message);
        });
    } else {
      pushToLocalJSONAPI(`/api/v2/notifications/mark-as-read-multiple/`, payload, token, 'POST')
        .then(() => {
          setSelected([]);
          retryFn();
          // The decrement count is readily available; deducting count from selected
          Array.from({ length: unreadCountInSelected }, () =>
            dispatch({ type: 'DECREMENT_UNREAD_COUNT' }),
          );
        })
        .catch((e) => {
          console.log(e.message);
        });
    }
  };

  return (
    <div className="pl2 dib">
      {selected.length ? (
        <Button
          onClick={() => markNotificationsAsRead(selected)}
          className="bg-red white"
          disabled={!token}
        >
          <EyeIcon className="w1 h1 pr2 v-mid white" />
          <FormattedMessage {...messages.markAsRead} />
        </Button>
      ) : (
        <></>
      )}
    </div>
  );
};
