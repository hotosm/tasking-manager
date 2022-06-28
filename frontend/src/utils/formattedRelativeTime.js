import React from 'react';
import { FormattedRelativeTime } from 'react-intl';

import { selectUnit } from './selectUnit';

export const RelativeTimeWithUnit = ({ date }) => {
  const { value, unit } = selectUnit(new Date(date));

  return <FormattedRelativeTime value={value} unit={unit} />;
};
