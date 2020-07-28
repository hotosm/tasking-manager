import { useState, useEffect } from 'react';

export function useTimeDiff(tasksByDay) {
  const [unit, setUnit] = useState('day');
  const day = 86400000;
  useEffect(() => {
    if (tasksByDay && tasksByDay.length >= 2) {
      const timeDiff =
        (new Date(tasksByDay[tasksByDay.length - 1].date) - new Date(tasksByDay[0].date)) / day;
      if (timeDiff > 16 * 7) {
        setUnit('month');
      } else if (timeDiff > 16) {
        setUnit('week');
      }
    }
  }, [tasksByDay]);
  return unit;
}
