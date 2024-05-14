import { useEffect, useState } from 'react';

export function useComputeCompleteness(tasks) {
  const [percentMapped, setPercentMapped] = useState(0);
  const [percentValidated, setPercentValidated] = useState(0);
  const [percentBadImagery, setPercentBadImagery] = useState(0);
  useEffect(() => {
    if (tasks && tasks.features) {
      const totalTasks = tasks.features.length;
      const mapped = tasks.features.filter((task) =>
        ['MAPPED', 'LOCKED_FOR_VALIDATION'].includes(task.properties.taskStatus),
      ).length;
      const validated = getStatusCount(tasks, 'VALIDATED');
      const badImagery = getStatusCount(tasks, 'BADIMAGERY');
      setPercentMapped(parseInt(((mapped + validated) / (totalTasks - badImagery)) * 100));
      setPercentValidated(parseInt((validated / (totalTasks - badImagery)) * 100));
      setPercentBadImagery(parseInt((badImagery / totalTasks) * 100));
    }
  }, [tasks, setPercentMapped, setPercentValidated, setPercentBadImagery]);
  return { percentMapped, percentValidated, percentBadImagery };
}

function getStatusCount(tasks, status) {
  return tasks.features.filter((task) => task.properties.taskStatus === status).length;
}

export function useTasksByStatus(tasks) {
  const [stats, setStats] = useState({
    ready: 0,
    badImagery: 0,
    lockedForMapping: 0,
    mapped: 0,
    lockedForValidation: 0,
    validated: 0,
    invalidated: 0,
    totalTasks: 0,
  });
  useEffect(() => {
    if (tasks && tasks.features) {
      const totalTasks = tasks.features.length;
      const ready = getStatusCount(tasks, 'READY');
      const mapped = getStatusCount(tasks, 'MAPPED');
      const validated = getStatusCount(tasks, 'VALIDATED');
      const invalidated = getStatusCount(tasks, 'INVALIDATED');
      const badImagery = getStatusCount(tasks, 'BADIMAGERY');
      const lockedForMapping = getStatusCount(tasks, 'LOCKED_FOR_MAPPING');
      const lockedForValidation = getStatusCount(tasks, 'LOCKED_FOR_VALIDATION');
      setStats({
        ready: ready,
        badImagery: badImagery,
        lockedForMapping: lockedForMapping,
        mapped: mapped,
        lockedForValidation: lockedForValidation,
        validated: validated,
        invalidated: invalidated,
        totalTasks: totalTasks,
      });
    }
  }, [tasks]);
  return stats;
}
