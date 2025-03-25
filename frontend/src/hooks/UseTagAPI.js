import { useEffect, useReducer } from 'react';
import { useTypedSelector } from '@Store/hooks';
import axios from 'axios';

import { API_URL } from '../config';

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
        tags: action.payload && action.payload[Object.keys(action.payload)[0]],
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

export const useTagAPI = (initialData, tagType, processDataFn) => {
  const token = useTypedSelector((state) => state.auth.token);
  const locale = useTypedSelector((state) => state.preferences.locale);
  const [state, dispatch] = useReducer(dataFetchReducer, {
    isLoading: true,
    isError: false,
    tags: initialData,
  });

  useEffect(() => {
    let didCancel = false;
    /* TODO(tdk): support axios cancelling like on projectsAPI,
       make sure to consider how to monitor if form is unloaded */

    const fetchData = async () => {
      const queryParams = {
        organisations: '?omitManagerList=true',
      };
      dispatch({ type: 'FETCH_INIT' });
      try {
        let result;
        if (token) {
          result = await axios({
            url: `${API_URL}${tagType}/${queryParams[tagType] ? queryParams[tagType] : ''}`,
            method: 'GET',
            headers: { Authorization: `Token ${token}` },
          });
        } else {
          result = await axios(`${API_URL}${tagType}/`);
        }

        if (!didCancel) {
          if (result && result.headers && result.headers['content-type'].indexOf('json') !== -1) {
            if (processDataFn) {
              result.data.tags = processDataFn(result.data.tags, locale);
            }
            dispatch({ type: 'FETCH_SUCCESS', payload: result.data });
          } else {
            console.error('Invalid return content-type for organisation tags');
            dispatch({ type: 'FETCH_FAILURE' });
          }
        }
      } catch {
        /* if cancelled, this setting state of unmounted
         * component would be a memory leak */
        if (!didCancel) {
          dispatch({ type: 'FETCH_FAILURE' });
        }
      }
    };

    fetchData();
    return () => {
      didCancel = true;
    };
  }, [tagType, token, processDataFn, locale]);

  return [state];
};
