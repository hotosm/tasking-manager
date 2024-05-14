import { useSelector } from 'react-redux';
import { useEffect, useReducer } from 'react';
import axios from 'axios';

import { useQueryParams, StringParam, NumberParam } from 'use-query-params';
import { stringify as stringifyUQP } from 'query-string';
import { CommaArrayParam } from '../utils/CommaArrayParam';
import { useThrottle } from '../hooks/UseThrottle';
import { remapParamsToAPI } from '../utils/remapParamsToAPI';
import { API_URL } from '../config';

const contributionsQueryAllSpecification = {
  status: CommaArrayParam,
  minDate: StringParam,
  maxDate: StringParam,
  projectStatus: StringParam,
  page: StringParam,
  orderBy: StringParam,
  projectId: NumberParam,
};

/* This can be passed into project API or used independently */
export const useTaskContributionQueryParams = () => {
  const uqp = useQueryParams(contributionsQueryAllSpecification);
  return uqp;
};

/* The API uses slightly different JSON keys than the queryParams,
   this fn takes an object with queryparam keys and outputs JSON keys
   while maintaining the same values */
/* TODO backend–add pagination:
  orderByType: 'sortBy',
  orderBy: 'sortDirection',
  page: 'page',
  pageSize: 'pageSize'
  */
/* TODO support full text search and change text=>project for that */
const backendToQueryConversion = {
  status: 'status',
  minDate: 'min_action_date',
  maxDate: 'max_action_date',
  projectStatus: 'project_status',
  orderBy: 'sort_by',
  projectId: 'project_id',
};

const dataFetchReducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_INIT':
      return {
        ...state,
        isLoading: true,
        isError: false,
      };
    case 'FETCH_MISSINGUSER':
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
        tasks: action.payload.tasks,
        pagination: action.payload.pagination,
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

const defaultInitialData = {
  tasks: [],
  pagination: {
    hasNext: false,
    hasPrev: false,
    nextNum: null,
    page: 1,
    pages: 1,
    prevNum: null,
    perPage: 100,
    total: 0,
  },
};

/* suggested URL /api/v2/users/{user_id}/tasks?status=READY&project_id=2&min_action_date=2019-04-9&max_action_date=2019-04-10 */
export const useTaskContributionAPI = (
  initialData = defaultInitialData,
  ExternalQueryParamsState,
  forceUpdate = null,
) => {
  const throttledExternalQueryParamsState = useThrottle(ExternalQueryParamsState, 1500);

  /* Get the user bearer token from the Redux store */
  const token = useSelector((state) => state.auth.token);
  const user_id = useSelector((state) => state.auth.userDetails && state.auth.userDetails.id);

  const [state, dispatch] = useReducer(dataFetchReducer, {
    isLoading: true,
    isError: false,
    tasks: initialData.results,
    pagination: initialData.pagination,
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

      try {
        if (!token || !user_id) {
          dispatch({ type: 'FETCH_MISSINGUSER' });
          didCancel = true;
        }
        const remappedParams = remapParamsToAPI(
          throttledExternalQueryParamsState,
          backendToQueryConversion,
        );
        const result = await axios({
          url: `${API_URL}users/${user_id}/tasks/`,
          method: 'get',
          params: remappedParams,
          headers: { Authorization: `Token ${token}` },
          cancelToken: new CancelToken(function executor(c) {
            // An executor function receives a cancel function as a parameter
            cancel = { end: c, params: throttledExternalQueryParamsState };
          }),
        });

        if (!didCancel) {
          if (result && result.headers && result.headers['content-type'].indexOf('json') !== -1) {
            dispatch({ type: 'FETCH_SUCCESS', payload: result.data });
          } else {
            console.error('Invalid return type for contribution search');
            dispatch({ type: 'FETCH_FAILURE' });
          }
        } else {
          cancel.end();
        }
      } catch (error) {
        /* if cancelled, this setting state of unmounted
         * component with dispatch would be a memory leak */
        if (
          !didCancel &&
          error &&
          error.response &&
          error.response.data &&
          error.response.data.Error === 'No messages found'
        ) {
          const zeroPayload = Object.assign(defaultInitialData, { pagination: { total: 0 } });
          /* TODO(tdk): when 404 and page > 1, re-request page 1 */
          dispatch({ type: 'FETCH_SUCCESS', payload: zeroPayload });
        } else if (!didCancel && error.response) {
          const errorResPayload = Object.assign(defaultInitialData, { error: error.response });
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.log(
            'Res failure',
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
          console.log('req failure', error.request, errorReqPayload);
          dispatch({ type: 'FETCH_FAILURE', payload: errorReqPayload });
        } else if (!didCancel) {
          dispatch({ type: 'FETCH_FAILURE' });
        } else {
          // console.log("tried to cancel on failure",cancel.params);
          cancel && cancel.end();
        }
      }
    };

    fetchData();
    return () => {
      didCancel = true;
      // console.log("tried to cancel on effect cleanup ",cancel.params)
      cancel && cancel.end();
    };
  }, [throttledExternalQueryParamsState, forceUpdate, token, user_id]);

  return [state, dispatch];
};

export const stringify = stringifyUQP;
