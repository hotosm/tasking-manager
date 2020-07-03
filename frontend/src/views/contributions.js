import React from 'react';
import { useSelector } from 'react-redux';
import ReactPlaceholder from 'react-placeholder';

import useForceUpdate from '../hooks/UseForceUpdate';
// import { useInboxQueryAPI, useInboxQueryParams } from '../hooks/UseInboxQueryAPI';
import {
  useTaskContributionAPI,
  useTaskContributionQueryParams,
} from '../hooks/UseTaskContributionAPI';
import { MyTasksNav } from '../components/contributions/myTasksNav';
import { TaskResults } from '../components/contributions/taskResults';
import { ProjectCardPaginator } from '../components/projects/projectCardPaginator';
import { HeaderProfile } from '../components/userDetail/headerProfile';
import { UserDetail } from './userDetail';
import { useSetTitleTag } from '../hooks/UseMetaTags';

export const ContributionsPage = (props) => {
  useSetTitleTag('My tasks');
  const initialData = {
    mapResults: {
      features: [],
      type: 'FeatureCollection',
    },
    results: [],
    pagination: { hasNext: false, hasPrev: false, page: 1 },
  };

  const userToken = useSelector((state) => state.auth.get('token'));
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
      <div className="pb5 pt180 pull-center bg-tan">
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

export const ContributionsPageIndex = (props) => {
  return (
    <div className="bg-tan w-100 cf">
      <div className="w-100 cf pb3">
        <HeaderProfile selfProfile={true} />
      </div>
      <div className="w-100 ph5-l ph2 cf pb3">{props.children}</div>
    </div>
  );
};

export const UserStats = (props) => {
  useSetTitleTag('My stats');
  const userDetails = useSelector((state) => state.auth.get('userDetails'));
  return (
    <ReactPlaceholder
      type="media"
      showLoadingAnimation={true}
      rows={5}
      ready={userDetails !== undefined}
    >
      <UserDetail username={userDetails.username} withHeader={false} />
    </ReactPlaceholder>
  );
};
