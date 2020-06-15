import React from 'react';

import { htmlFromMarkdown } from '../../utils/htmlFromMarkdown';

export function ProjectMetrics({ metrics }: Object) {
  const htmlMetrics = metrics ? htmlFromMarkdown(metrics) : { __html: '' };
  return (
    <div
      className="markdown-content base-font blue-dark"
      dangerouslySetInnerHTML={htmlMetrics}
    />
  );
}
