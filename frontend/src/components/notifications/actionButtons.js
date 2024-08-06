import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FormattedMessage } from 'react-intl';

import deletionMessages from '../deleteModal/messages';
import messages from './messages';
import { EyeIcon, WasteIcon } from '../svgIcons';
import { Button } from '../button';
import { fetchLocalJSONAPI, pushToLocalJSONAPI } from '../../network/genericJSONRequest';

export const ActionButtons = ({
  selected,
  setSelected,
  retryFn,
  unreadCountInSelected,
  isAllSelected,
  inboxQuery,
  setInboxQuery,
  pageOfCards,
  totalPages,
}) => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const param = inboxQuery.types ? `?messageType=${inboxQuery.types?.join(',')}` : '';
  const payload = JSON.stringify({ messageIds: selected });

  const updateUnreadCount = () => {
    fetchLocalJSONAPI(`notifications/?status=unread`, token)
      .then((notifications) =>
        dispatch({ type: 'SET_UNREAD_COUNT', payload: notifications.pagination?.total }),
      )
      .catch((e) => console.log(e));
  };

  const deleteMessages = () => {
    if (isAllSelected) {
      pushToLocalJSONAPI(`/api/v2/notifications/delete-all/${param}`, null, token, 'DELETE')
        .then(() => handleSuccess())
        .catch((e) => {
          console.log(e.message);
        });
    } else {
      pushToLocalJSONAPI(`/api/v2/notifications/delete-multiple/`, payload, token, 'DELETE')
        .then(() => {
          // Decrement the page query if the user deleted all notifications in the last page
          if (inboxQuery.page === totalPages && selected.length === pageOfCards.length) {
            setInboxQuery(
              {
                ...inboxQuery,
                page: inboxQuery.page - 1 || undefined,
              },
              'pushIn',
            );
            handleSuccess(false);
            return;
          }
          handleSuccess();
        })
        .catch((e) => {
          console.log(e.message);
        });
    }
  };

  const markNotificationsAsRead = () => {
    if (isAllSelected) {
      pushToLocalJSONAPI(`/api/v2/notifications/mark-as-read-all/${param}`, null, token, 'POST')
        .then(() => handleSuccess())
        .catch((e) => {
          console.log(e.message);
        });
    } else {
      pushToLocalJSONAPI(`/api/v2/notifications/mark-as-read-multiple/`, payload, token, 'POST')
        .then(() => handleSuccess())
        .catch((e) => {
          console.log(e.message);
        });
    }
  };

  function handleSuccess(shouldRetry = true) {
    setSelected([]);
    shouldRetry && retryFn();
    isAllSelected
      ? updateUnreadCount()
      : // The decrement count is readily available; deducting count from selected
        Array.from({ length: unreadCountInSelected }, () =>
          dispatch({ type: 'DECREMENT_UNREAD_COUNT' }),
        );
  }

  if (selected.length) {
    return (
      <div className="pl2 dib">
        <Button
          onClick={() => markNotificationsAsRead()}
          className="bg-red white"
          disabled={!token}
        >
          <EyeIcon className="w1 h1 pr2 v-mid white" />
          <FormattedMessage {...messages.markAsRead} />
        </Button>
        <Button onClick={() => deleteMessages()} className="bg-red white ml3" disabled={!token}>
          <WasteIcon className="w1 h1 pr2 v-mid white" />
          <FormattedMessage {...deletionMessages.delete} />
        </Button>
      </div>
    );
  } else {
    return null;
  }
};
