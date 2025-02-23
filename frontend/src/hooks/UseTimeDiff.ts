import type { TimeUnit } from 'chart.js';
import { differenceInDays } from 'date-fns';
import { useState, useEffect } from 'react';

export function useTimeDiff(tasksByDay: { date: string }[]) {
  const [unit, setUnit] = useState<TimeUnit>('day');
  useEffect(() => {
    if (tasksByDay && tasksByDay.length >= 2) {
      const timeDiff = differenceInDays(tasksByDay[tasksByDay.length - 1].date, new Date(tasksByDay[0].date))
      // If the time difference is greater than 16 weeks, set the unit to month
      if (timeDiff > 16 * 7) {
        setUnit('month');
      } else if (timeDiff > 16) { // If the time difference is greater than 16 days, set the unit to week
        setUnit('week');
      }
    }
  }, [tasksByDay]);
  return unit;
}
