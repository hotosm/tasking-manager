import { useState, useEffect } from 'react';

// return true if a task was previously invalidated and received comments
export const useReadTaskComments = (history) => {
  const [readTaskComments, setReadTaskComments] = useState(false);

  useEffect(() => {
    if (history && history.taskHistory && history.taskHistory.length > 1) {
      const invalidatedTaskHistory = history.taskHistory.filter(
        (task) => task.actionText === 'INVALIDATED',
      );
      const taskComments = history.taskHistory.filter((task) => task.action === 'COMMENT');

      if (invalidatedTaskHistory.length > 0 && taskComments.length > 0) {
        setReadTaskComments(true);
      }
    }
  }, [history]);
  return readTaskComments;
};
