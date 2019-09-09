import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';

export const MappingLevelMessage = props => {
  const { level, ...otherProps } = props;
  const message = ['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(level) ? (
    <FormattedMessage {...messages[`mappingLevel${level}`]} />
  ) : (
    level
  );
  return <span {...otherProps}>{message}</span>;
};
