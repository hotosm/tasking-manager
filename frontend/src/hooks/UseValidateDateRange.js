import { useEffect, useState } from 'react';
import { startOfTomorrow, startOfToday, parse, differenceInDays } from 'date-fns';

export function useValidateDateRange(query) {
  const [validation, setValidation] = useState();

  useEffect(() => {
    setValidation({ error: false, detail: '' });
    if (query.startDate) {
      const startDate = parse(query.startDate, 'yyyy-MM-dd', new Date());
      const endDate = query.endDate
        ? parse(query.endDate, 'yyyy-MM-dd', new Date())
        : startOfToday();
      if (startDate > startOfTomorrow() || startDate > endDate) {
        setValidation({ error: true, detail: 'badStartDate' });
      }
      if (differenceInDays(endDate, startDate) > 366) {
        setValidation({ error: true, detail: 'longDateRange' });
      }
    }
  }, [query.startDate, query.endDate]);
  return validation;
}
