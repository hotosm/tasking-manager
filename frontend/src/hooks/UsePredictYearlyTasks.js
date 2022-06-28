import { useCallback } from 'react';
import { getDayOfYear, isLeapYear } from 'date-fns';

export function usePredictYearlyTasks(completedActions, currentDate) {
  const prediction = useCallback(() => {
    const dayNumber = getDayOfYear(currentDate);
    const totalDays = isLeapYear(currentDate) ? 366 : 365;
    return Math.round((completedActions * totalDays) / dayNumber);
  }, [completedActions, currentDate]);

  return prediction();
}
