import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { Alert } from '../alert';

export const MessageStatus = ({ status, comment }) => {
  if (status === 'success' && !comment) {
    return (
      <Alert type="success" inline={true} compact={true}>
        <FormattedMessage {...messages.messageSent} />
      </Alert>
    );
  }
  if (status === 'error') {
    return (
      <Alert type="error" inline={true} compact={true}>
        <FormattedMessage {...messages.messageError} />
      </Alert>
    );
  }
  return null;
};
