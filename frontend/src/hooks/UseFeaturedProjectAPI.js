import { useEffect, useReducer } from 'react';
import axios from 'axios';

import { API_URL } from '../config';

/* Pagination is client-side and only used in the featuredProject page */
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
        projects: action.payload,
      };
    case 'FETCH_FAILURE':
      return {
        ...state,
        isLoading: false,
        isError: true,
      };
    case 'NEXT_PAGE':
      return {
        ...state,
        activeProjectCardPage: state.activeProjectCardPage + 1,
      };
    case 'LAST_PAGE':
      return {
        ...state,
        activeProjectCardPage: state.activeProjectCardPage - 1,
      };
    case 'NEXT_PAGE_MOBILE':
      return {
        ...state,
        activeProjectCardPageMobile: state.activeProjectCardPageMobile + 1,
      };
    case 'LAST_PAGE_MOBILE':
      return {
        ...state,
        activeProjectCardPageMobile: state.activeProjectCardPageMobile - 1,
      };
    default:
      console.log(action);
      throw new Error();
  }
};

export const useFeaturedProjectAPI = initialData => {
  const [state, dispatch] = useReducer(dataFetchReducer, {
    isLoading: true,
    isError: false,
    activeProjectCardPageMobile: 0,
    activeProjectCardPage: 0,
    projects: initialData,
  });

  useEffect(() => {
    let didCancel = false;
    let cancel;

    const fetchData = async () => {
      const CancelToken = axios.CancelToken;

      dispatch({ type: 'FETCH_INIT' });
      try {
        const result = await axios({
          url: `${API_URL}projects/queries/featured`,
          method: 'get',
          cancelToken: new CancelToken(function executor(c) {
            // An executor function receives a cancel function as a parameter
            cancel = { end: c };
          }),
        });
        if (result && result.headers && result.headers['content-type'].indexOf('json') === -1) {
          dispatch({ type: 'FETCH_FAILURE' });
          didCancel = true;
        }

        if (!didCancel) {
          dispatch({ type: 'FETCH_SUCCESS', payload: result.data });
        } else {
          cancel.end();
        }
      } catch (error) {
        /* if cancelled, this setting state of unmounted
         * component would be a memory leak */
        if (!didCancel) {
          dispatch({ type: 'FETCH_FAILURE' });
        } else {
          cancel.end();
        }
      }
    };

    fetchData();
    return () => {
      didCancel = true;
      cancel.end();
    };
  }, []);

  return [state, dispatch];
};
