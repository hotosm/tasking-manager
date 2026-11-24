import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FormattedMessage } from 'react-intl';

import useForceUpdate from '../hooks/UseForceUpdate';
import {
  useTaskContributionAPI,
  useTaskContributionQueryParams,
} from '../hooks/UseTaskContributionAPI';
import { MyTasksNav } from '../components/contributions/myTasksNav';
import { AssignedTasks } from '../components/contributions/assignedTasks';
import contributionsMessages from '../components/contributions/messages';
import { useAssignedTasksQuery } from '../api/user';
import { TaskResults } from '../components/contributions/taskResults';
import { ProjectCardPaginator } from '../components/projects/projectCardPaginator';
import { HeaderProfile } from '../components/userDetail/headerProfile';
import { UserDetail } from './userDetail';
import { useSetTitleTag } from '../hooks/UseMetaTags';

export const ContributionsPage = () => {
  useSetTitleTag('My tasks');
  const navigate = useNavigate();
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

  useEffect(() => {
    if (!userToken) {
      navigate('/login', {
        replace: true,
        state: { from: location.pathname },
      });
    }
  }, [location.pathname, navigate, userToken]);

  return (
    <section className="pb5 pt180 pull-center">
      <MyTasksNav />
      <TaskResults retryFn={forceUpdate} state={state} />
      <ProjectCardPaginator
        projectAPIstate={state}
        status={state.isLoading ? 'pending' : 'success'}
        pagination={state?.pagination}
        setQueryParam={setContributionsQuery}
      />
    </section>
  );
};

export const AssignedTasksPage = () => {
  useSetTitleTag('Assigned tasks');
  const navigate = useNavigate();
  const location = useLocation();
  const userToken = useSelector((state) => state.auth.token);
  const [page, setPage] = useState(1);
  const [pendingOnly, setPendingOnly] = useState(true);
  const { data, isLoading, isError } = useAssignedTasksQuery({
    pendingOnly,
    page,
    perPage: 20,
  });

  useEffect(() => {
    if (!userToken) {
      navigate('/login', {
        replace: true,
        state: { from: location.pathname },
      });
    }
  }, [location.pathname, navigate, userToken]);

  return (
    <section className="pb5 pt180 pull-center">
      <header className="w-100 cf mt4">
        <h3 className="barlow-condensed blue-dark f2 ma0 v-mid dib ttu pl2 pl0-l">
          <FormattedMessage {...contributionsMessages.assignedTasks} />
        </h3>
        <Link to="/contributions/tasks" className="red link ph3 f6 v-mid dib pv2 mh1 fr">
          <FormattedMessage {...contributionsMessages.allMyTasks} />
        </Link>
      </header>
      <AssignedTasks
        data={data}
        isLoading={isLoading}
        isError={isError}
        pendingOnly={pendingOnly}
        setPendingOnly={(value) => {
          setPendingOnly(value);
          setPage(1);
        }}
        setPage={setPage}
      />
    </section>
  );
};

export const ContributionsPageIndex = (props) => {
  return (
    <div className="bg-blue-light 0-10 w-100 cf" style={{ background: 'rgba(146, 157, 179,0.1)' }}>
      <div className="w-100 cf">
        <HeaderProfile selfProfile={true} />
      </div>
      <div className="w-100 ph5-l ph2 cf pb6">
        <Outlet />
      </div>
    </div>
  );
};

export const UserStats = () => {
  useSetTitleTag('My stats');
  const userDetails = useSelector((state) => state.auth.userDetails);

  return <UserDetail username={userDetails.username} withHeader={false} />;
};
