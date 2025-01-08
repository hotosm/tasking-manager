import { FormattedMessage } from 'react-intl';

import messages from './messages';

export const MappingLevelMessage = (props) => {
  const { level, ...otherProps } = props;
  const message = ['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(level) ? (
    <FormattedMessage {...messages[`mappingLevel${level}`]} />
  ) : (
    level
  );
  return <span {...otherProps}>{message}</span>;
};

export const DifficultyMessage = (props) => {
  const { level, ...otherProps } = props;
  const message = ['ALL', 'EASY', 'MODERATE', 'CHALLENGING'].includes(level) ? (
    <FormattedMessage {...messages[`difficulty${level}`]} />
  ) : (
    level
  );
  return <span {...otherProps}>{message}</span>;
};
