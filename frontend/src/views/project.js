import React from 'react';
import { useSelector } from 'react-redux';
import { ProjectNav } from '../components/projects/projectNav';
import { MoreFiltersForm } from '../components/projects/moreFiltersForm';

import {
  useProjectsQueryAPI,
  useExploreProjectsQueryParams,
  stringify,
} from '../hooks/UseProjectsQueryAPI';
import { useTagAPI } from '../hooks/UseTagAPI';
import useForceUpdate from '../hooks/UseForceUpdate';

import { ProjectCardPaginator } from '../components/projects/projectCardPaginator';
import { ProjectSearchResults } from '../components/projects/projectSearchResults';
import { ProjectsMap } from '../components/projects/projectsMap';

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
  const searchResultWidth = isMapShown ? 'w-60-ns w-100' : 'w-100';

  return (
    <div className="pt180 pull-center">
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

export const ProjectsPageIndex = props => {
  return null;
};

export const MoreFilters = props => {
  const [fullProjectsQuery] = useExploreProjectsQueryParams();

  /* These two divs define the More Filters page. */
  /* z-2 is needed because the progress bar hide-child hover popups are z-1.  */
  const leftpanelDivStyle = 'absolute left-0 z-2 mt1 w-40-l w-100 h-100 bg-white h4 pa3';
  const rightpanelShadowDivStyle = 'absolute right-0 z-2 br w-60-l w-0 h-100 bg-blue-dark o-70 h6';
  return (
    <>
      <div className={leftpanelDivStyle}>
        <MoreFiltersForm />
        {props.children}
      </div>

      <div
        onClick={() =>
          props.navigate(
            `/contribute${
              stringify(fullProjectsQuery) ? ['?', stringify(fullProjectsQuery)].join('') : ''
            }`,
          )
        }
        className={rightpanelShadowDivStyle}
      ></div>
    </>
  );
};
