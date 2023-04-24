import { FormattedMessage } from 'react-intl';

import { MAX_FILESIZE } from '../../config';
import messages from './messages';

export const getErrorMsg = (msg) => {
  let intlMessageExists = !!messages[msg];

  if (msg === 'fileSize') {
    return <FormattedMessage {...messages[msg]} values={{ fileSize: MAX_FILESIZE / 1000000 }} />;
  }
  if (msg.includes('unsupportedGeom')) {
    return (
      <FormattedMessage
        {...messages[msg.split('-')[0].trim()]}
        values={{ geometry: msg.split('-')[1].trim() }}
      />
    );
  }
  return intlMessageExists ? <FormattedMessage {...messages[msg]} /> : null;
};
