import React from 'react';
import { useSelector } from 'react-redux';

import useForceUpdate from '../hooks/UseForceUpdate';
// import { useInboxQueryAPI, useInboxQueryParams } from '../hooks/UseInboxQueryAPI';
import {
  useTaskContributionAPI,
  useTaskContributionQueryParams,
} from '../hooks/UseTaskContributionAPI';
import { MyTasksNav } from '../components/contributions/myTasksNav';
import { TaskResults } from '../components/contributions/taskResults';
import { ProjectCardPaginator } from '../components/projects/projectCardPaginator';

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
  const [state] = useTaskContributionAPI(initialData, contributionsQuery, forceUpdated);

  if (!userToken) {
    /* use replace to so the back button does not get interrupted */
    props.navigate('/login', { replace: true });
  }

  return (
    <>
      <div className="pt4-l pb5 ph5-l ph2 pt180 pull-center bg-tan">
        {
          props.children
          /* This is where the full task body component is rendered
        using the router, as a child route.
        */
        }
        <section className="cf">
          <MyTasksNav />
          <TaskResults retryFn={forceUpdate} state={state} />
          <ProjectCardPaginator projectAPIstate={state} setQueryParam={setContributionsQuery} />
        </section>
      </div>
    </>
  );
};

export const ContributionsPageIndex = props => {
  return null;
};
