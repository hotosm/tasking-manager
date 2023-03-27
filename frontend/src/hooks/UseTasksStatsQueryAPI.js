import { useEffect, useReducer } from 'react';
import { useSelector } from 'react-redux';
import {
  useQueryParams,
  encodeQueryParams,
  StringParam,
  NumberParam,
  withDefault,
} from 'use-query-params';
import queryString from 'query-string';
import axios from 'axios';
import { format, startOfYear } from 'date-fns';

import { CommaArrayParam } from '../utils/CommaArrayParam';
import { useThrottle } from '../hooks/UseThrottle';
import { remapParamsToAPI } from '../utils/remapParamsToAPI';
import { API_URL } from '../config';

/* See also moreFiltersForm, the useQueryParams are duplicated there for specific modular usage */
/* This one is e.g. used for updating the URL when returning to /contribute
 *  and directly submitting the query to the API */
const statsQueryAllSpecification = {
  startDate: withDefault(StringParam, format(startOfYear(Date.now()), 'yyyy-MM-dd')),
  endDate: StringParam,
  campaign: StringParam,
  location: StringParam,
  project: CommaArrayParam,
  organisationName: StringParam,
  organisationId: NumberParam,
};

export const useTasksStatsQueryParams = () => {
  const uqp = useQueryParams(statsQueryAllSpecification);
  return uqp;
};

/* The API uses slightly different JSON keys than the queryParams,
   this fn takes an object with queryparam keys and outputs JSON keys
   while maintaining the same values */
/* TODO support full text search and change text=>project for that */
const backendToQueryConversion = {
  startDate: 'startDate',
  endDate: 'endDate',
  campaign: 'campaign',
  location: 'country',
  project: 'projectId',
  organisationName: 'organisationName',
  organisationId: 'organisationId',
};

const defaultInitialData = {
  taskStats: [],
};

const dataFetchReducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_INIT':
      return {
        ...state,
        isLoading: true,
        isError: false,
      };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isError: false,
        stats: action.payload.taskStats,
      };
    case 'FETCH_FAILURE':
      return {
        ...state,
        isLoading: false,
        isError: true,
      };
    default:
      console.log(action);
      throw new Error();
  }
};

export const useTasksStatsQueryAPI = (
  initialData = defaultInitialData,
  ExternalQueryParamsState,
  extraQuery = '',
) => {
  const throttledExternalQueryParamsState = useThrottle(ExternalQueryParamsState, 1500);
  const token = useSelector((state) => state.auth.token);
  const controller = new AbortController();

  const [state, dispatch] = useReducer(dataFetchReducer, {
    isLoading: true,
    isError: false,
    stats: initialData.taskStats,
    queryParamsState: ExternalQueryParamsState[0],
  });

  const fetchData = async () => {
    dispatch({
      type: 'FETCH_INIT',
    });

    let headers = {
      'Content-Type': 'application/json',
      Authorization: `Token ${token}`,
    };
    const paramsRemapped = remapParamsToAPI(
      throttledExternalQueryParamsState,
      backendToQueryConversion,
    );
    extraQuery.split(',').forEach((query) => {
      const [key, value] = query.trim().split('=');
      paramsRemapped[key] = value;
    });

    await axios({
      url: `${API_URL}tasks/statistics/`,
      method: 'GET',
      headers: headers,
      params: paramsRemapped,
      signal: controller.signal,
    })
      .then((result) => {
        if (result?.headers && result.headers['content-type'].indexOf('json') !== -1) {
          dispatch({ type: 'FETCH_SUCCESS', payload: result.data });
        } else {
          dispatch({ type: 'FETCH_FAILURE' });
        }
      })
      .catch((error) => {
        if (!axios.isCancel(error)) {
          dispatch({ type: 'FETCH_FAILURE' });
        }
        if (error.response?.data?.Error === 'No statistics found') {
          const zeroPayload = Object.assign(defaultInitialData, { pagination: { total: 0 } });
          dispatch({ type: 'FETCH_SUCCESS', payload: zeroPayload });
        }
      });
  };

  useEffect(() => {
    fetchData();
    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [throttledExternalQueryParamsState, token, extraQuery]);

  return [state, fetchData];
};

export const stringify = (obj) => {
  const encodedQuery = encodeQueryParams(statsQueryAllSpecification, obj);
  return queryString.stringify(encodedQuery);
};
