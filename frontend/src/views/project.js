import React, { Suspense } from 'react';
import { useSelector } from 'react-redux';

import { ProjectNav } from '../components/projects/projectNav';
import { MyProjectNav } from '../components/projects/myProjectNav';
import { MoreFiltersForm } from '../components/projects/moreFiltersForm';
import { ProjectDetail } from '../components/projectDetail/index';
import { ManagementMenu } from '../components/teamsAndOrgs/menu';
import { ProjectCardPaginator } from '../components/projects/projectCardPaginator';
import { ProjectSearchResults } from '../components/projects/projectSearchResults';
import { ProjectsMap } from '../components/projects/projectsMap';
import {
  useProjectsQueryAPI,
  useExploreProjectsQueryParams,
  stringify,
} from '../hooks/UseProjectsQueryAPI';
import { useTagAPI } from '../hooks/UseTagAPI';
import useForceUpdate from '../hooks/UseForceUpdate';
import { useFetch } from '../hooks/UseFetch';

const ProjectCreate = React.lazy(() => import('../components/projectCreate/index'));

export const CreateProject = (props) => {
  return(
    <Suspense fallback={<div>Loading...</div>}>
      <ProjectCreate {...props} />
    </Suspense>
  );
}

export const ProjectsPage = props => {
  const initialData = {
    mapResults: {
      features: [],
      type: 'FeatureCollection',
    },
    results: [],
    pagination: { hasNext: false, hasPrev: false, page: 1 },
  };

  const [fullProjectsQuery, setProjectQuery] = useExploreProjectsQueryParams();
  const [forceUpdated, forceUpdate] = useForceUpdate();
  const [state] = useProjectsQueryAPI(initialData, fullProjectsQuery, forceUpdated);
  const [orgAPIState] = useTagAPI([], 'organisations');

  const isMapShown = useSelector(state => state.preferences['mapShown']);
  const searchResultWidth = isMapShown ? 'w-60-l w-100' : 'w-100';

  return (
    <div className="pull-center">
      <ProjectNav location={props.location} orgAPIState={orgAPIState}>
        {
          props.children
          /* This is where the MoreFilters component is rendered
        using the router, as a child route.
        */
        }
      </ProjectNav>
      <section className="cf">
        <ProjectSearchResults
          state={state}
          retryFn={forceUpdate}
          className={`${searchResultWidth} fl`}
        />
        {isMapShown && (
          <ProjectsMap
            state={state}
            fullProjectsQuery={fullProjectsQuery}
            setQuery={setProjectQuery}
            className={`dib w-40-l w-100 fl`}
          />
        )}
      </section>
      <ProjectCardPaginator projectAPIstate={state} setQueryParam={setProjectQuery} />
    </div>
  );
};

export const ManageProjectsPage = props => {
  const userDetails = useSelector(state => state.auth.get('userDetails'));
  const userToken = useSelector(state => state.auth.get('token'));

  const initialData = {
    mapResults: {
      features: [],
      type: 'FeatureCollection',
    },
    results: [],
    pagination: { hasNext: false, hasPrev: false, page: 1 },
  };

  const [fullProjectsQuery, setProjectQuery] = useExploreProjectsQueryParams();
  const [forceUpdated, forceUpdate] = useForceUpdate();
  const [state] = useProjectsQueryAPI(initialData, fullProjectsQuery, forceUpdated);
  const [orgAPIState] = useTagAPI([], 'organisations');

  const isMapShown = useSelector(state => state.preferences['mapShown']);
  const searchResultWidth = isMapShown ? 'w-60-l w-100' : 'w-100';

  if (!userToken) {
    /* use replace to so the back button does not get interrupted */
    props.navigate('/login', {replace: true})
  }

  if (
     !fullProjectsQuery.createdByMe &&
     !fullProjectsQuery.contributedToByMe &&
     !fullProjectsQuery.favoritedByMe &&
     !fullProjectsQuery.createdByMeArchived
  ) {
    setProjectQuery({createdByMe: true});
  }

  return (
    <div className="pull-center ph5-l bg-tan">
      {userDetails && ['ADMIN', 'PROJECT_MANAGER'].includes(userDetails.role) &&
        <ManagementMenu />
      }
      <MyProjectNav location={props.location} orgAPIState={orgAPIState}>
        {
          props.children
          /* This is where the MoreFilters component is rendered
        using the router, as a child route.
        */
        }
      </MyProjectNav>
      <section className="cf">
        <ProjectSearchResults
          state={state}
          retryFn={forceUpdate}
          className={`${searchResultWidth} fl`}
          showBottomButtons={true}
        />
        {isMapShown && (
          <ProjectsMap
            state={state}
            fullProjectsQuery={fullProjectsQuery}
            setQuery={setProjectQuery}
            className={`dib w-40-l w-100 fl`}
          />
        )}
      </section>
      <ProjectCardPaginator projectAPIstate={state} setQueryParam={setProjectQuery} />
    </div>
  );
};

export const ProjectsPageIndex = props => {
  return null;
};

export const MoreFilters = props => {
  const [fullProjectsQuery] = useExploreProjectsQueryParams();

  const currentUrl = `/explore${
    stringify(fullProjectsQuery) ? ['?', stringify(fullProjectsQuery)].join('') : ''
  }`;
  return (
    <>
      <div className="absolute left-0 z-4 mt1 w-40-l w-100 h-100 bg-white h4 ph1 ph5-l">
        <MoreFiltersForm currentUrl={currentUrl} />
        {props.children}
      </div>
      <div
        onClick={() => props.navigate(currentUrl)}
        className="absolute right-0 z-5 br w-60-l w-0 h-100 bg-blue-dark o-70 h6"
      ></div>
    </>
  );
};

export const ProjectDetailPage = props => {
  const userPreferences = useSelector(state => state.preferences);
  const Error = ({ error }) => <span>Error:{error.message}</span>;

  // replace by queries/summary/ soon
  const [visualError, visualLoading, visualData] = useFetch(
    `projects/${props.id}/contributions/queries/day/`,
  );
  const [error, loading, data] = useFetch(`projects/${props.id}/`);
  const [tasksError, tasksLoading, tasks] = useFetch(`projects/${props.id}/tasks/`);
  const [totalMappersError, totalMappersLoading, totalMappers] = useFetch(
    `projects/${props.id}/statistics/`,
  );

  if (error) return <Error error={error} />;
  if (visualError) return <Error error={visualError} />;

  return (
    <ProjectDetail
      project={data}
      projectLoading={loading}
      userPreferences={userPreferences}
      percentDoneVisData={visualData}
      percentDoneVisLoading={visualLoading}
      tasksError={tasksError}
      tasks={tasks}
      tasksLoading={tasksLoading}
      totalMappersError={totalMappersError}
      totalMappersLoading={totalMappersLoading}
      totalMappers={totalMappers}
      navigate={props.navigate}
      type="detail"
    />
  );
};
