import { useEffect, useState } from 'react';

import { getPastMonths } from '../utils/date';

export function useFilterContributors(contributors, level, username, sortBy) {
  const [filteredContributors, setFilter] = useState([]);

  useEffect(() => {
    let users = contributors || [];
    if (['ADVANCED', 'INTERMEDIATE', 'BEGINNER'].includes(level)) {
      users = users.filter(
        (user) => user.mappingLevel && user.mappingLevel.toUpperCase().includes(level),
      );
    }
    if (level === 'NEWUSER') {
      const monthFiltered = getPastMonths(1);
      users = users
        .map((u) => ({ ...u, dateObj: new Date(u.dateRegistered) }))
        .filter((u) => u.dateObj > monthFiltered);
    }
    if (username) {
      users = users.filter((user) => user.username === username);
    }
    if (sortBy && users?.length) {
      users = [...users]?.sort((a, b) => b?.[sortBy] - a?.[sortBy]);
    }

    setFilter(users);
  }, [contributors, level, username, sortBy]);

  return filteredContributors;
}
