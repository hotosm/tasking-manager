import React from 'react';

import { htmlFromMarkdown } from '../../utils/htmlFromMarkdown';

export function ProjectInstructions({ instructions }: Object) {
  const htmlInstructions = { __html: '' } || (instructions && htmlFromMarkdown(instructions));
  return (
    <div
      className="markdown-content base-font blue-dark"
      dangerouslySetInnerHTML={htmlInstructions}
    />
  );
}
