import React from 'react';
import { FormattedMessage } from 'react-intl';

import { htmlFromMarkdown } from '../../utils/htmlFromMarkdown';
import { Alert } from '../alert';
import messages from './messages';

export function ProjectInstructions({ instructions, isProjectArchived }: Object) {
  const htmlInstructions = instructions ? htmlFromMarkdown(instructions) : { __html: '' };

  return (
    <>
      {isProjectArchived && (
        <Alert type="warning" compact={false}>
          <FormattedMessage {...messages.projectIsArchived} />
        </Alert>
      )}
      <div
        className="markdown-content base-font blue-dark"
        dangerouslySetInnerHTML={htmlInstructions}
      />
    </>
  );
}
