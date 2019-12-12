import React from 'react';

import { htmlFromMarkdown } from '../../utils/htmlFromMarkdown';

export function ProjectInstructions({instructions}: Object) {
  const htmlInstructions = instructions && htmlFromMarkdown(instructions);

  return <div
    className="markdown-content base-font blue-dark"
    dangerouslySetInnerHTML={htmlInstructions}
  />
}
