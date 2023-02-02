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
}) => {
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();

  const deleteMessages = (selected) => {
    const payload = JSON.stringify({ messageIds: selected });
    pushToLocalJSONAPI(`/api/v2/notifications/delete-multiple/`, payload, token, 'DELETE')
      .then((success) => {
        setSelected([]);
        retryFn();
        Array.from({ length: unreadCountInSelected }, () =>
          dispatch({ type: 'DECREMENT_UNREAD_COUNT' }),
        );
      })
      .catch((e) => {
        console.log(e.message);
      });
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
