import { useState, useEffect } from 'react';

// return true if a task was previously marked as BADIMAGERY and reverted to READY
export const useDisableBadImagery = (history) => {
  const [disableBadImagery, setDisableBadImagery] = useState(false);

  useEffect(() => {
    if (history && history.taskHistory && history.taskHistory.length > 1) {
      const wasSetAsBadImagery = history.taskHistory.filter(
        (task) => task.actionText === 'BADIMAGERY',
      ).length;
      const wasRevertedToReady = history.taskHistory.filter(
        (task) => task.actionText === 'Undo state from BADIMAGERY to READY',
      ).length;

      if (wasSetAsBadImagery && wasRevertedToReady) {
        setDisableBadImagery(true);
      }
    }
  }, [history]);
  return disableBadImagery;
};
