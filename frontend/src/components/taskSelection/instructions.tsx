import { FormattedMessage } from 'react-intl';

import { htmlFromMarkdown } from '../../utils/htmlFromMarkdown';
import { Alert } from '../alert';
import messages from './messages';
import { useEffect, useState } from 'react';

export function ProjectInstructions({ instructions, isProjectArchived }: any) {
  const [htmlInstructionsHTML, setHtmlInstructionsHTML] = useState('');

  useEffect(() => {
    if (!instructions) return;
    (async () => {
      setHtmlInstructionsHTML(await htmlFromMarkdown(instructions));
    })();
  }, [instructions]);

  return (
    <>
      {isProjectArchived && (
        <Alert type="warning" compact={false}>
          <FormattedMessage {...messages.projectIsArchived} />
        </Alert>
      )}
      <div
        className="markdown-content base-font blue-dark"
        dangerouslySetInnerHTML={{
          __html: htmlInstructionsHTML
        }}
      />
    </>
  );
}
