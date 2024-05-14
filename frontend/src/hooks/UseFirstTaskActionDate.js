import { useEffect, useState } from 'react';

import { compareHistoryLastUpdate } from '../utils/sorting';

const useFirstTaskActionDate = (history) => {
  const [firstDate, setFirstDate] = useState(null);
  useEffect(() => {
    if (history && history.taskHistory && history.taskHistory.length) {
      const fistTaskAction =
        history.taskHistory.sort(compareHistoryLastUpdate)[history.taskHistory.length - 1];
      if (fistTaskAction.actionDate) setFirstDate(fistTaskAction.actionDate);
    }
  }, [history]);
  return firstDate;
};

export default useFirstTaskActionDate;
