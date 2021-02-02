import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { startOfYear, format, startOfToday, parse } from 'date-fns';

import { fetchLocalJSONAPI } from '../network/genericJSONRequest';

export function useIsOrgYearQuery(query) {
  const [isOrgYearQuery, setIsOrgYearQuery] = useState(true);
  useEffect(() => {
    if (query) {
      if (
        query.startDate !== format(startOfYear(new Date()), 'yyyy-MM-dd') ||
        (query.endDate && parse(query.endDate, 'yyyy-MM-dd', new Date()) < startOfToday()) ||
        query.location ||
        query.campaign
      )
        setIsOrgYearQuery(false);
    }
  }, [query]);
  return isOrgYearQuery;
}

export function useCurrentYearStats(organisationId, query, stats) {
  const isOrgYearQuery = useIsOrgYearQuery(query);
  const [yearStats, setYearStats] = useState(stats);
  const token = useSelector((state) => state.auth.get('token'));
  useEffect(() => {
    if (!isOrgYearQuery) {
      const startDate = format(startOfYear(new Date()), 'yyyy-MM-dd');
      fetchLocalJSONAPI(
        `tasks/statistics/?startDate=${startDate}&organisationId=${organisationId}`,
        token,
      )
        .then((res) => setYearStats(res.taskStats))
        .catch((e) => console.log(e));
    }
  }, [isOrgYearQuery, organisationId, token]);
  return yearStats;
}
