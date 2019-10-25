import { useEffect, useReducer, useState } from 'react';
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
    case 'FETCH_TOGGLE_INIT':
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
        fetched: true,
        isFav: action.payload && action.payload.favorited,
      };
    case 'FETCH_TOGGLE_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isError: false,
        isToggleError: false,
        fetched: true,
        isFav: !state.isFav,
      };
    case 'FETCH_TOGGLE_FAILURE':
      return {
        ...state,
        isLoading: false,
        isError: false,
        fetched: true,
      };
    case 'FETCH_FAILURE':
      return {
        ...state,
        isLoading: false,
        isError: true,
        fetched: false,
      };
    default:
      console.log(action);
      throw new Error();
  }
};

export const useFavProjectAPI = (initialData, projectId, token) => {
  const [state, dispatch] = useReducer(dataFetchReducer, {
    isLoading: true,
    isError: false,
    isToggleError: false,
    isFav: initialData,
  });

  /* Used to allow user to redo the side effects for the toggle */
  /* for more complicated side effects, use something like
   * https://www.reddit.com/r/reasonml/comments/c6eer3/a_better_usereducer_colocating_side_effects_with/ */
  const [toggleFetchType, setToggleFetchType] = useState('GET');

  const toggleFetchMethod = state => {
    if (state.isFav === false) {
      /* set favorite to true on project */
      return 'POST';
    } else if (state.isFav === true) {
      /* set favorite to false on project */
      return 'DELETE';
    }
  };

  const dispatchToggle = () => {
    if (!state.isLoading) {
      setToggleFetchType(toggleFetchMethod(state));
    }
  };

  useEffect(() => {
    let didCancel = false;

    const fetchData = async toggleFetchType => {
      const isToggle = toggleFetchType !== 'GET' ? '_TOGGLE' : '';

      dispatch({ type: `FETCH${isToggle}_INIT` });
      try {
        if (!projectId) {
          throw Error();
        }

        const result = await axios({
          method: toggleFetchType,
          url: `${API_URL}projects/${projectId}/favorite/`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Token ${token}`,
          },
        });

        if (!didCancel) {
          if (toggleFetchType !== 'GET' && result.data.project_id !== projectId) {
            return Error('Project altered and project in response did not match');
          }
          dispatch({ type: `FETCH${isToggle}_SUCCESS`, payload: result.data });
        }
      } catch (error) {
        /* if cancelled, this setting state of unmounted
         * component would be a memory leak */
        if (!didCancel) {
          dispatch({ type: `FETCH${isToggle}_FAILURE` });
        }
      }
    };

    fetchData(toggleFetchType);

    return () => {
      didCancel = true;
    };
  }, [projectId, token, toggleFetchType]);

  return [state, dispatchToggle];
};
