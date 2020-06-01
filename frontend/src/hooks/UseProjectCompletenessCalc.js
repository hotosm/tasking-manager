import { useEffect, useState } from 'react';

export function useComputeCompleteness(tasks) {
  const [percentMapped, setPercentMapped] = useState(0);
  const [percentValidated, setPercentValidated] = useState(0);
  const [percentBadImagery, setPercentBadImagery] = useState(0);
  useEffect(() => {
    if (tasks && tasks.features) {
      const totalTasks = tasks.features.length;
      const mapped = tasks.features.filter((task) => task.properties.taskStatus === 'MAPPED')
        .length;
      const validated = tasks.features.filter((task) => task.properties.taskStatus === 'VALIDATED')
        .length;
      const badImagery = tasks.features.filter(
        (task) => task.properties.taskStatus === 'BADIMAGERY',
      ).length;
      setPercentMapped(parseInt(((mapped + validated) / (totalTasks - badImagery)) * 100));
      setPercentValidated(parseInt((validated / (totalTasks - badImagery)) * 100));
      setPercentBadImagery(parseInt((badImagery / totalTasks) * 100));
    }
  }, [tasks, setPercentMapped, setPercentValidated, setPercentBadImagery]);
  return { percentMapped, percentValidated, percentBadImagery };
}
