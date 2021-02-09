import { useEffect, useState } from 'react';

function getStatusCount(stats, status) {
  return stats.reduce((total, entry) => total + entry[status], 0);
}

export function useTotalTasksStats(stats) {
  const [totalStats, setTotalStats] = useState({
    mapped: 0,
    validated: 0,
  });
  useEffect(() => {
    if (stats && stats.length) {
      setTotalStats({
        mapped: getStatusCount(stats, 'mapped'),
        validated: getStatusCount(stats, 'validated'),
      });
    }
  }, [stats]);
  return totalStats;
}
