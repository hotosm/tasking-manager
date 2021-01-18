import { useState, useEffect } from 'react';

export const useDisableBadImagery = (history) => {
  const [disableBadImagery, setDisableBadImagery] = useState(false);

  useEffect(() => {
    if (history && history.taskHistory && history.taskHistory.length > 1) {
      const wasSetAsBadImagery = history.taskHistory.filter(
        (task) => task.actionText === 'BADIMAGERY',
      ).length;
      console.log(wasSetAsBadImagery);
      const wasRevertedToReady = history.taskHistory.filter(
        (task) => task.actionText === 'Undo state from BADIMAGERY to READY',
      ).length;
      console.log(wasRevertedToReady);

      if (wasSetAsBadImagery && wasRevertedToReady) {
        setDisableBadImagery(true);
      }
    }
  }, [history]);
  return disableBadImagery;
};
