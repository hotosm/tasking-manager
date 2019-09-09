import { useEffect, useReducer } from 'react';
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
        tags: action.payload && action.payload.tags,
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

export const useTagAPI = (initialData, tagType) => {
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
      dispatch({ type: 'FETCH_INIT' });
      try {
        const result = await axios(`${API_URL}${tagType}/`);

        if (!didCancel) {
          dispatch({ type: 'FETCH_SUCCESS', payload: result.data });
        }
      } catch (error) {
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
  }, [tagType]);

  return [state];
};
