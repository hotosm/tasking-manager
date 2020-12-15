import { useState, useEffect } from 'react';

const useReadTaskComments = (history) => {
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

export default useReadTaskComments;
