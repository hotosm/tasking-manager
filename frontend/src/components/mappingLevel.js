import { FormattedMessage } from 'react-intl';

import messages from './messages';

const appendMapperSuffix = (level) => {
  if (!level) return '';
  const formattedLevel = level?.trim();
  return formattedLevel?.toLowerCase()?.endsWith('mapper') ? level : `${level} mapper`;
};

export const MappingLevelMessage = (props) => {
  const { level, ...otherProps } = props;
  const message = ['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(level) ? (
    <FormattedMessage {...messages[`mappingLevel${level}`]} />
  ) : (
    appendMapperSuffix(level)
  );
  return (
    <span className="ttc" {...otherProps}>
      {message}
    </span>
  );
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
