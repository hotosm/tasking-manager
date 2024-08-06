import React, { useEffect } from 'react';
import { FormattedMessage } from 'react-intl';
import { useSelector, useDispatch } from 'react-redux';

import messages from './messages';
import { Dropdown } from '../dropdown';

export const ProjectsActionFilter = ({ setQuery, fullProjectsQuery }) => {
  const dispatch = useDispatch();
  const action = useSelector((state) => state.preferences.action);
  const userDetails = useSelector((state) => state.auth.userDetails);

  useEffect(() => {
    // if action is not set on redux/localStorage,
    // set as 'any' for advanced mappers and 'map' for others
    if (!action || action === 'null') {
      dispatch({
        type: 'SET_ACTION',
        action: userDetails.mappingLevel === 'ADVANCED' ? 'any' : 'map',
      });
    }
  }, [dispatch, action, userDetails.mappingLevel]);

  return (
    <Dropdown
      onChange={(n) => {
        const value = n && n[0] && n[0].value;
        // clean the action query param if it was set on the URL,
        // as our main source of truth is the redux store
        if (fullProjectsQuery.action) {
          setQuery(
            {
              ...fullProjectsQuery,
              page: undefined,
              action: undefined,
            },
            'pushIn',
          );
        }
        // 'Archived' is a special case, as it is not a valid action
        dispatch({ type: 'SET_ACTION', action: value === 'ARCHIVED' ? 'any' : value });
        setQuery(
          {
            ...fullProjectsQuery,
            page: undefined,
            status: value !== 'ARCHIVED' ? undefined : 'ARCHIVED',
          },
          'pushIn',
        );
      }}
      // use the action query param, in case someone loads the page with /explore?action=*
      value={fullProjectsQuery.status || fullProjectsQuery.action || action || 'any'}
      options={[
        { label: <FormattedMessage {...messages.projectsToMap} />, value: 'map' },
        { label: <FormattedMessage {...messages.projectsToValidate} />, value: 'validate' },
        { label: <FormattedMessage {...messages.anyProject} />, value: 'any' },
        { label: <FormattedMessage {...messages.archived} />, value: 'ARCHIVED' },
      ]}
      display={'Action'}
      className={'ba b--tan bg-white mr3 f6 v-mid dn dib-ns pv2 br1 pl3 fw5 blue-dark'}
    />
  );
};
