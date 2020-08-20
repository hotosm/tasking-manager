import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';

const DropzoneUploadStatus = ({ uploadError, uploading }: Object) => {
  return (
    <>
      {uploadError && (
        <span className="red f6 pt3 db">
          <FormattedMessage {...messages.imageUploadFailed} />
        </span>
      )}
      {uploading && (
        <span className="blue-grey f6 pt3 db">
          <FormattedMessage {...messages.imageUploadOnProgress} />
        </span>
      )}
    </>
  );
};

export default DropzoneUploadStatus;
