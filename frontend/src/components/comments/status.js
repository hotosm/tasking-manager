import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { AlertIcon, CheckIcon, RefreshIcon } from '../svgIcons';

const Sending = () => (
  <div className="blue-grey">
    <RefreshIcon className="di h1 w1 pb1 pr2 v-mid" />
    <FormattedMessage {...messages.sendingMessage} />
  </div>
);

const Error = () => (
  <div className="red">
    <AlertIcon className="di h1 w1 pb1 pr2 v-mid" />
    <FormattedMessage {...messages.messageError} />
  </div>
);

const Success = () => (
  <div className="red">
    <CheckIcon className="di h1 w1 pb1 pr2 v-mid" />
    <FormattedMessage {...messages.messageSent} />
  </div>
);

export const MessageStatus = ({ status }: Object) => {
  switch (status) {
    case 'messageSent':
      return <Success />;
    case 'sending':
      return <Sending />;
    case 'error':
      return <Error />;
    default:
      return <></>;
  }
};
