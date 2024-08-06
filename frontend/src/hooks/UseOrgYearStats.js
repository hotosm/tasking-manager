import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { startOfYear, format, startOfToday, parse } from 'date-fns';

import { fetchLocalJSONAPI } from '../network/genericJSONRequest';

// check if query is correspondent only to the current year period and don't apply
// any other filter
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

// if the query is relative to the current year period, return the received stats
// case not, fetch the api to get the stats of the current year
export function useCurrentYearStats(organisationId, query, stats) {
  const isOrgYearQuery = useIsOrgYearQuery(query);
  const [yearStats, setYearStats] = useState([]);
  const token = useSelector((state) => state.auth.token);

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

  useEffect(() => {
    if (isOrgYearQuery) setYearStats(stats);
  }, [isOrgYearQuery, stats]);
  return yearStats;
}
