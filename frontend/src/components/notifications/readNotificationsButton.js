import React from 'react';
import { useSelector } from 'react-redux';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { EyeIcon } from '../svgIcons';
import { Button } from '../button';

export const ReadNotificationsButton = ({
  selected,
  setSelected,
  retryFn,
  unreadCountInSelected,
}) => {
  const token = useSelector((state) => state.auth.token);

  const markNotificationsAsRead = (selected) => {
    // TODO: handle markNotificationsAsRead
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
