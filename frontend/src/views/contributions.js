import React from 'react';

// import { useInboxQueryAPI, useInboxQueryParams } from '../hooks/UseInboxQueryAPI';
import { useTaskContributionAPI, useTaskContributionQueryParams } from '../hooks/UseTaskContributionAPI';

import useForceUpdate from '../hooks/UseForceUpdate';
import { useSelector } from 'react-redux';

import { MyTasksNav } from '../components/contributions/myTasksNav';
import {
  TaskResults,
} from '../components/contributions/taskResults';

import { TaskBodyModal } from '../components/contributions/taskBodyCard';

import { useFetch } from '../hooks/UseFetch';

export const ContributionsPage = props => {
  const initialData = {
    mapResults: {
      features: [],
      type: 'FeatureCollection',
    },
    results: [],
    pagination: { hasNext: false, hasPrev: false, page: 1 },
  };

  const userToken = useSelector(state => state.auth.get('token'));
  //eslint-disable-next-line
  const [contributionsQuery, setContributionsQuery] = useTaskContributionQueryParams();
  const [forceUpdated, forceUpdate] = useForceUpdate();
  const [state] = useTaskContributionAPI(initialData, contributionsQuery, forceUpdated) 

  if (!userToken) {
    /* use replace to so the back button does not get interrupted */
    props.navigate('/login', { replace: true });
  }

  return (
    <>
    <div className="pt4-l pb5 ph5-l ph4 pt180 pull-center bg-tan">
      {
        props.children
        /* This is where the full task body component is rendered
        using the router, as a child route.
        */
      }
      <section className="cf">

        <MyTasksNav />
        <TaskResults retryFn={forceUpdate} state={state} />
        {/* TODO support pagination on this API
        <ProjectCardPaginator projectAPIstate={state} setQueryParam={setContributionsQuery} /> 
        */}

        {/* delete me! TDK */}
        <code className={`dn`}>{JSON.stringify(state)}</code>
      </section>
    </div>
    </>
  );
};

export const ContributionsPageIndex = props => {
  return null;
};

export const ContributionDetail = props => {
  const [thisTaskError, thisTaskLoading, thisTask] = useFetch(
    `notifications/${props.id}/`,
  );

  /* Inside, this loads a TaskBodyCard */
  return (
    <TaskBodyModal
      navigate={props.navigate}
      thisTaskError={thisTaskError}
      thisTaskLoading={thisTaskLoading}
      thisTask={thisTask}
      />
  );
};
