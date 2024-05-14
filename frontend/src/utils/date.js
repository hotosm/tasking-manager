import {
  format,
  startOfWeek,
  startOfMonth,
  startOfYear,
  endOfWeek,
  endOfMonth,
  endOfYear,
} from 'date-fns';

export function getPastMonths(months) {
  let today = new Date();
  return today.setMonth(today.getMonth() - months);
}

const date = new Date();
const dateFormat = 'yyyy-MM-dd';
export const dateRanges = {
  thisWeek: {
    start: format(startOfWeek(date), dateFormat),
    end: format(date, dateFormat),
  },
  thisMonth: {
    start: format(startOfMonth(date), dateFormat),
    end: format(date, dateFormat),
  },
  thisYear: {
    start: format(startOfYear(date), dateFormat),
    end: format(date, dateFormat),
  },
  lastWeek: {
    start: format(startOfWeek(new Date().setDate(date.getDate() - 7)), dateFormat),
    end: format(endOfWeek(new Date().setDate(date.getDate() - 7)), dateFormat),
  },
  lastMonth: {
    start: format(startOfMonth(new Date().setMonth(date.getMonth() - 1)), dateFormat),
    end: format(endOfMonth(new Date().setMonth(date.getMonth() - 1)), dateFormat),
  },
  lastYear: {
    start: format(startOfYear(new Date().setFullYear(date.getFullYear() - 1)), dateFormat),
    end: format(endOfYear(new Date().setFullYear(date.getFullYear() - 1)), dateFormat),
  },
};
