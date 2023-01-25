import React from 'react';
import { useLocation } from '@reach/router';
import { useSelector } from 'react-redux';

import useForceUpdate from '../hooks/UseForceUpdate';
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

  const location = useLocation();
  const userToken = useSelector((state) => state.auth.token);
  //eslint-disable-next-line
  const [contributionsQuery, setContributionsQuery] = useTaskContributionQueryParams();
  const [forceUpdated, forceUpdate] = useForceUpdate();
  const [state] = useTaskContributionAPI(initialData, contributionsQuery, forceUpdated);

  if (!userToken) {
    props.navigate('/login', {
      replace: true,
      state: { from: location.pathname },
    });
  }

  return (
    <section className="pb5 pt180 pull-center">
      <MyTasksNav />
      <TaskResults retryFn={forceUpdate} state={state} />
      <ProjectCardPaginator projectAPIstate={state} setQueryParam={setContributionsQuery} />
    </section>
  );
};

export const ContributionsPageIndex = (props) => {
  return (
    <div className="bg-blue-light 0-10 w-100 cf" style={{ background: 'rgba(146, 157, 179,0.1)' }}>
      <div className="w-100 cf">
        <HeaderProfile selfProfile={true} />
      </div>
      <div className="w-100 ph5-l ph2 cf pb6">{props.children}</div>
    </div>
  );
};

export const UserStats = () => {
  useSetTitleTag('My stats');
  const userDetails = useSelector((state) => state.auth.userDetails);

  return <UserDetail username={userDetails.username} withHeader={false} />;
};
