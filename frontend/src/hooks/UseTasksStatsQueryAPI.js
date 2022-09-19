import { useEffect, useReducer } from 'react';
import { useSelector } from 'react-redux';
import { useQueryParams, encodeQueryParams, StringParam, NumberParam } from 'use-query-params';
import { stringify as stringifyUQP } from 'query-string';
import axios from 'axios';

import { CommaArrayParam } from '../utils/CommaArrayParam';
import { useThrottle } from '../hooks/UseThrottle';
import { remapParamsToAPI } from '../utils/remapParamsToAPI';
import { API_URL } from '../config';

/* See also moreFiltersForm, the useQueryParams are duplicated there for specific modular usage */
/* This one is e.g. used for updating the URL when returning to /contribute
 *  and directly submitting the query to the API */
const statsQueryAllSpecification = {
  startDate: StringParam,
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
  forceUpdate = null,
  extraQuery = '',
) => {
  const throttledExternalQueryParamsState = useThrottle(ExternalQueryParamsState, 1500);
  const token = useSelector((state) => state.auth.token);

  const [state, dispatch] = useReducer(dataFetchReducer, {
    isLoading: true,
    isError: false,
    stats: initialData.taskStats,
    queryParamsState: ExternalQueryParamsState[0],
  });

  useEffect(() => {
    let didCancel = false;
    let cancel;
    const fetchData = async () => {
      const CancelToken = axios.CancelToken;

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

      try {
        const result = await axios({
          url: `${API_URL}tasks/statistics/`,
          method: 'GET',
          headers: headers,
          params: paramsRemapped,
          cancelToken: new CancelToken(function executor(c) {
            // An executor function receives a cancel function as a parameter
            cancel = { end: c, params: throttledExternalQueryParamsState };
          }),
        });

        if (!didCancel) {
          if (result && result.headers && result.headers['content-type'].indexOf('json') !== -1) {
            dispatch({ type: 'FETCH_SUCCESS', payload: result.data });
          } else {
            console.error('Invalid return type for project search');
            dispatch({ type: 'FETCH_FAILURE' });
          }
        } else {
          cancel && cancel.end();
        }
      } catch (error) {
        /* if cancelled, this setting state of unmounted
         * component with dispatch would be a memory leak */
        if (
          !didCancel &&
          error &&
          error.response &&
          error.response.data &&
          error.response.data.Error === 'No statistics found'
        ) {
          const zeroPayload = Object.assign(defaultInitialData, { pagination: { total: 0 } });
          /* TODO(tdk): when 404 and page > 1, re-request page 1 */
          dispatch({ type: 'FETCH_SUCCESS', payload: zeroPayload });
        } else if (!didCancel && error.response) {
          const errorResPayload = Object.assign(defaultInitialData, { error: error.response });
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.log(
            'Response failure',
            error.response.data,
            error.response.status,
            error.response.headers,
            errorResPayload,
          );
          dispatch({ type: 'FETCH_FAILURE', payload: errorResPayload });
        } else if (!didCancel && error.request) {
          const errorReqPayload = Object.assign(defaultInitialData, { error: error.request });
          // The request was made but no response was received
          // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
          // http.ClientRequest in node.js
          console.log('request failure', error.request, errorReqPayload);
          dispatch({ type: 'FETCH_FAILURE', payload: errorReqPayload });
        } else if (!didCancel) {
          dispatch({ type: 'FETCH_FAILURE' });
        } else {
          console.log('tried to cancel on failure', cancel && cancel.params);
          cancel && cancel.end();
        }
      }
    };

    fetchData();
    return () => {
      didCancel = true;
      console.log('tried to cancel on effect cleanup ', cancel && cancel.params);
      cancel && cancel.end();
    };
  }, [throttledExternalQueryParamsState, forceUpdate, token, extraQuery]);

  return [state, dispatch];
};

export const stringify = (obj) => {
  const encodedQuery = encodeQueryParams(statsQueryAllSpecification, obj);
  return stringifyUQP(encodedQuery);
};
