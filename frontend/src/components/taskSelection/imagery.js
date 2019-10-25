import React from 'react';
import { FormattedMessage } from 'react-intl';
import { useCopyClipboard } from '@lokibai/react-use-copy-clipboard';

import messages from './messages';
import { ClipboardIcon } from '../svgIcons';

export function Imagery({ value = '' }: Object) {
  //eslint-disable-next-line
  const [isCopied, setCopied] = useCopyClipboard();

  const handleClick = () => {
    setCopied(value);
  };
  let content = <span>{value}</span>;
  let copyButton;
  let messageId;
  if (value) {
    if (value.startsWith('tms[')) {
      messageId = 'customTMSLayer';
    }
    if (value.startsWith('wms[')) {
      messageId = 'customWMSLayer';
    }
    if (value.startsWith('wmts[')) {
      messageId = 'customWMTSLayer';
    }
    if (value.startsWith('http') || value.startsWith('https')) {
      messageId = 'customLayer';
    }
    if (messageId) {
      content = (
        <span title={value}>
          <FormattedMessage {...messages[messageId]} />
        </span>
      );
      copyButton = (
        <span className="pointer pl2 blue-light hover-blue-dark" title="Copy imagery URL">
          <ClipboardIcon width="16px" height="16px" onClick={handleClick} />
        </span>
      );
    }
  } else {
    content = <FormattedMessage {...messages.noImageryDefined} />;
  }
  return (
    <p className={`f5 fw6 pt1 ma0 ${value ? 'blue-dark' : 'blue-light'}`}>
      {content}
      {copyButton}
    </p>
  );
}
