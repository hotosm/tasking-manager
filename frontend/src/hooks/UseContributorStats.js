import { useEffect, useState } from 'react';
import { getPastMonths } from '../utils/date';

export function useContributorStats(contributions) {
  const [stats, setStats] = useState({
    validators: 0,
    mappers: 0,
    usersByLevel: {},
    lessThan1MonthExp: 0,
    lessThan3MonthExp: 0,
    lessThan6MonthExp: 0,
    lessThan12MonthExp: 0,
    moreThan1YearExp: 0,
  });

  useEffect(() => {
    if (contributions !== undefined) {
      const data = {
        validators: contributions.filter((i) => i.validated > 0).length,
        mappers: contributions.filter((i) => i.mapped > 0).length,
        usersByLevel: contributions.reduce((prev, curr) => {
          if (!Object.hasOwnProperty.call(prev, curr.mappingLevel)) {
            prev[curr.mappingLevel] = 0;
          }

          prev[curr.mappingLevel]++;

          return prev;
        }, {}),
      };
      const monthRanges = [
        [0, 1],
        [1, 3],
        [3, 6],
        [6, 12],
      ];
      monthRanges.forEach(
        (months) =>
          (data[`lessThan${months[1]}MonthExp`] = contributions.filter(
            (i) =>
              new Date(i.dateRegistered) > getPastMonths(months[1]) &&
              new Date(i.dateRegistered) <= getPastMonths(months[0]),
          ).length),
      );
      data.moreThan1YearExp = contributions.filter(
        (i) => new Date(i.dateRegistered) <= getPastMonths(12),
      ).length;
      setStats(data);
    }
  }, [contributions]);

  return stats;
}
