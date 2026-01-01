import { useMemo } from 'react';
import { getPastMonths } from '../utils/date';

export function useFilterContributors(contributors = [], levelList = [], level, username, sortBy) {
  return useMemo(() => {
    let users = contributors;

    if (levelList.includes(level)) {
      users =
        level === 'ALL'
          ? contributors
          : users.filter((user) => user.mappingLevel && user.mappingLevel === level);
    }

    if (level === 'NEWUSER') {
      const monthFiltered = getPastMonths(1);

      users = contributors
        .map((u) => ({ ...u, dateObj: new Date(u.dateRegistered) }))
        .filter((u) => u.dateObj > monthFiltered);
    }

    if (username) {
      users = users.filter((user) => user.username === username);
    }

    if (sortBy && users.length) {
      users = [...users].sort((a, b) => b?.[sortBy] - a?.[sortBy]);
    }

    return users;
  }, [contributors, levelList, level, username, sortBy]);
}
