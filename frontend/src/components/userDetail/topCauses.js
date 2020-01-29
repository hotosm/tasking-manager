import React from 'react';
import { DonutChart } from './editsByNumbers';
import { FormattedMessage } from 'react-intl';
import messages from './messages';

export const TopCauses = ({ user }) => {
  const stats = user.stats.read();
  const sliceVal = 3;

  const classColors = ['fill-green', 'fill-yellow', 'fill-red', 'fill-blue'];

  let interests = stats.ContributionsByInterest.slice(0, sliceVal).map((c, i) => {
    return { interest: c.name, count: c.countProjects, classColor: classColors[i] };
  });
  const otherInterestCount = stats.ContributionsByInterest.slice(sliceVal)
    .map(c => c.countProjects)
    .reduce((a, b) => a + b, 0);

  interests.push({
    interest: 'Others',
    count: otherInterestCount,
    classColor: classColors[classColors.length - 1],
  });

  return (
    <div>
      <h3 className="f4 blue-dark mt0 fw6 pt3 ttc">
        <FormattedMessage {...messages.topCausesTitle} />
      </h3>
      <DonutChart data={interests} oAccessor="interest" dynamicColumnWidth="count" />
    </div>
  );
};
