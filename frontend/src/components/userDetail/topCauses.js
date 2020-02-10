import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { DonutChart } from './editsByNumbers';

export const TopCauses = ({ userStats }) => {
  const sliceVal = 3;

  const classColors = ['fill-green', 'fill-yellow', 'fill-red', 'fill-blue'];

  let interests = userStats.ContributionsByInterest.slice(0, sliceVal).map((c, i) => {
    return { interest: c.name, count: c.countProjects, classColor: classColors[i] };
  });
  const otherInterestCount = userStats.ContributionsByInterest.slice(sliceVal)
    .map(c => c.countProjects)
    .reduce((a, b) => a + b, 0);

  interests.push({
    interest: 'Others',
    count: otherInterestCount,
    classColor: classColors[classColors.length - 1],
  });

  return (
    <div className="pb3 ph3 pt2 bg-white blue-dark shadow-4">
      <h3 className="f4 mt0 fw6 pt3">
        <FormattedMessage {...messages.topCausesTitle} />
      </h3>
      <DonutChart data={interests} oAccessor="interest" dynamicColumnWidth="count" />
    </div>
  );
};
