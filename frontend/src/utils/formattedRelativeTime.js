import React from 'react';
import { selectUnit } from '@formatjs/intl-utils';
import { FormattedRelativeTime } from 'react-intl';

export const RelativeTimeWithUnit = ({ date }: Object) => {
  const { value, unit } = selectUnit(new Date(date));

  return <FormattedRelativeTime value={value} unit={unit} />;
};
