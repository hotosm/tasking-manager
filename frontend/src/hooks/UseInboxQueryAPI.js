import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryParams, StringParam, NumberParam } from 'use-query-params';
import queryString from 'query-string';
import axios from 'axios';

import { CommaArrayParam } from '../utils/CommaArrayParam';
import { useThrottle } from '../hooks/UseThrottle';
import { remapParamsToAPI } from '../utils/remapParamsToAPI';
import { API_URL } from '../config';

/* See also moreFiltersForm, the useQueryParams are duplicated there for specific modular usage */
/* This one is e.g. used for updating the URL when returning to /contribute
 *  and directly submitting the query to the API */
const inboxQueryAllSpecification = {
  types: CommaArrayParam,
  fromUsername: StringParam,
  text: StringParam,
  taskId: NumberParam,
  project: NumberParam,
  page: NumberParam,
  pageSize: NumberParam,
  orderBy: StringParam,
  orderByType: StringParam,
};

/* This can be passed into inbox API or used independently */
export const useInboxQueryParams = () => {
  return useQueryParams(inboxQueryAllSpecification);
};

/* The API uses slightly different JSON keys than the queryParams,
   this fn takes an object with queryparam keys and outputs JSON keys
   while maintaining the same values */
/* TODO support full text search and change text=>project for that */
export const backendToQueryConversion = {
  types: 'messageType',
  fromUsername: 'from',
  project: 'project',
  taskId: 'taskId',
  status: 'status',
  orderByType: 'sortBy',
  orderBy: 'sortDirection',
  page: 'page',
  pageSize: 'pageSize',
};

const defaultInitialData = {
  mapResults: {
    features: [],
    type: 'FeatureCollection',
  },
  results: [],
  pagination: { hasNext: false, hasPrev: false, page: 1 },
};

export const useInboxQueryAPI = (
  initialData = defaultInitialData,
  ExternalQueryParamsState,
  forceUpdate = null,
) => {
  const throttledExternalQueryParamsState = useThrottle(ExternalQueryParamsState, 1500);
  /* Get the user bearer token from the Redux store */
  const token = useSelector((state) => state.auth.token);

  const state = useSelector((state) => state.notifications);
  const dispatch = useDispatch();

  useEffect(() => {
    let didCancel = false;
    let cancel;

    const fetchData = async () => {
      const CancelToken = axios.CancelToken;

      dispatch({
        type: 'FETCH_INIT',
      });

      const remappedParams = remapParamsToAPI(
        throttledExternalQueryParamsState,
        backendToQueryConversion,
      );

      try {
        if (!token) {
          throw Error('No authentication token specified for inbox query');
        }
        const result = await axios({
          url: `${API_URL}notifications/`,
          method: 'get',
          params: remappedParams,
          headers: {
            Authorization: `Token ${token}`,
            Accept: 'application/json',
          },
          cancelToken: new CancelToken(function executor(c) {
            // An executor function receives a cancel function as a parameter
            cancel = { end: c, params: throttledExternalQueryParamsState };
          }),
        });

        if (!didCancel) {
          if (result && result.headers && result.headers['content-type'].indexOf('json') !== -1) {
            dispatch({
              type: 'NOTIFICATIONS_SUCCESS',
              payload: result.data,
              params: throttledExternalQueryParamsState,
            });
          } else {
            console.error('Invalid return type for inbox search');
            dispatch({ type: 'NOTIFICATIONS_FAILURE' });
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
          dispatch({ type: 'NOTIFICATIONS_SUCCESS', payload: zeroPayload });
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
          dispatch({ type: 'NOTIFICATIONS_FAILURE', payload: errorResPayload });
        } else if (!didCancel && error.request) {
          const errorReqPayload = Object.assign(defaultInitialData, { error: error.request });
          // The request was made but no response was received
          // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
          // http.ClientRequest in node.js
          console.log('req failure', error.request, errorReqPayload);
          dispatch({ type: 'NOTIFICATIONS_FAILURE', payload: errorReqPayload });
        } else if (!didCancel) {
          dispatch({ type: 'NOTIFICATIONS_FAILURE' });
        } else {
          cancel && cancel.end();
        }
      }
    };

    fetchData();
    return () => {
      didCancel = true;
      cancel && cancel.end();
    };
  }, [throttledExternalQueryParamsState, forceUpdate, token, dispatch]);

  return [state, dispatch];
};

export const stringify = queryString.stringify;
