import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FormattedMessage } from 'react-intl';

import messages from '../deleteModal/messages';
import { WasteIcon } from '../svgIcons';
import { Button } from '../button';
import { pushToLocalJSONAPI } from '../../network/genericJSONRequest';

export const DeleteNotificationsButton = ({
  selected,
  setSelected,
  retryFn,
  unreadCountInSelected,
  isAllSelected,
  inboxQuery,
  updateUnreadCount,
}) => {
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();

  const deleteMessages = (selected) => {
    const param = inboxQuery.types ? `?messageType=${inboxQuery.types?.join(',')}` : '';
    const payload = JSON.stringify({ messageIds: selected });

    if (isAllSelected) {
      pushToLocalJSONAPI(`/api/v2/notifications/delete-all/${param}`, null, token, 'DELETE')
        .then(() => {
          setSelected([]);
          retryFn();
          updateUnreadCount();
        })
        .catch((e) => {
          console.log(e.message);
        });
    } else {
      pushToLocalJSONAPI(`/api/v2/notifications/delete-multiple/`, payload, token, 'DELETE')
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
        <Button onClick={() => deleteMessages(selected)} className="bg-red white" disabled={!token}>
          <WasteIcon className="w1 h1 pr2 v-mid white" />
          <FormattedMessage {...messages.delete} />
        </Button>
      ) : (
        <></>
      )}
    </div>
  );
};
