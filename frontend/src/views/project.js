import React, { Suspense, lazy, useEffect, useState, useLayoutEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import ReactPlaceholder from 'react-placeholder';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';

import { ProjectNav } from '../components/projects/projectNav';
import { MyProjectNav } from '../components/projects/myProjectNav';
import { MoreFiltersForm } from '../components/projects/moreFiltersForm';
import { ProjectDetail } from '../components/projectDetail/index';
import { ProjectCardPaginator } from '../components/projects/projectCardPaginator';
import { ProjectSearchResults } from '../components/projects/projectSearchResults';
import { ProjectsMap } from '../components/projects/projectsMap';
import PrivateProjectError from '../components/projectDetail/privateProjectError';
import { useExploreProjectsQueryParams, stringify } from '../hooks/UseProjectsQueryAPI';
import { useSetTitleTag } from '../hooks/UseMetaTags';
import { NotFound } from './notFound';
import { ProjectDetailPlaceholder } from '../components/projectDetail/projectDetailPlaceholder';
import { useProjectsQuery, useProjectQuery } from '../api/projects';
import { useWindowSize } from '../hooks/UseWindowSize';
import { useOnClickOutside } from '../hooks/UseOnClickOutside';

const smallScreenSize = 960;

// returns true if the element or one of its parents has the classname
function hasSomeParentClass(element, classname) {
  if (typeof element.className === 'string' && element.className.split(' ').indexOf(classname) >= 0)
    return true;
  return element.parentNode && hasSomeParentClass(element.parentNode, classname);
}

const ProjectCreate = lazy(() => import('../components/projectCreate/index'));

export const CreateProject = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProjectCreate />
    </Suspense>
  );
};

export const ProjectsPage = () => {
  useSetTitleTag('Explore projects');
  const { pathname } = useLocation();
  const action = useSelector((state) => state.preferences['action']);
  const [fullProjectsQuery, setProjectQuery] = useExploreProjectsQueryParams();
  const isMapShown = useSelector((state) => state.preferences['mapShown']);
  const searchResultWidth = isMapShown ? 'two-column' : 'one-column';

  const {
    data: projects,
    status,
    refetch,
  } = useProjectsQuery(fullProjectsQuery, action, {
    // prevent api call until the filters are applied
    enabled: !pathname.includes('/explore/filters/'),
    cacheTime: 0,
  });

  return (
    <div className="pull-center" id="projects-container">
      <ProjectNav>
        <Outlet />
      </ProjectNav>
      <section className={`${searchResultWidth} explore-projects-container`}>
        <div>
          <ProjectSearchResults
            className={`${isMapShown ? 'pl3' : 'ph3'}`}
            status={status}
            projects={projects?.results}
            pagination={projects?.pagination}
            retryFn={refetch}
          />
          <ProjectCardPaginator
            status={status}
            pagination={projects?.pagination}
            fullProjectsQuery={fullProjectsQuery}
            setQueryParam={setProjectQuery}
          />
        </div>
        {isMapShown && (
          <div className="explore-projects-map">
            <ProjectsMap
              mapResults={projects?.mapResults}
              fullProjectsQuery={fullProjectsQuery}
              setQuery={setProjectQuery}
            />
          </div>
        )}
      </section>
    </div>
  );
};

export const UserProjectsPage = ({ management }) => {
  const location = useLocation();
  const navigate = useNavigate();
  useSetTitleTag(management ? 'Manage projects' : 'My projects');
  const userToken = useSelector((state) => state.auth.token);

  const [fullProjectsQuery, setProjectQuery] = useExploreProjectsQueryParams();
  const isMapShown = useSelector((state) => state.preferences['mapShown']);
  const searchResultWidth = isMapShown ? 'two-column' : 'one-column';

  const { data: projects, status, refetch } = useProjectsQuery(fullProjectsQuery);

  useEffect(() => {
    if (!userToken) {
      /* use replace to so the back button does not get interrupted */
      navigate('/login', { replace: true });
    }
  }, [navigate, userToken]);

  if (
    !fullProjectsQuery.createdByMe &&
    !fullProjectsQuery.managedByMe &&
    !fullProjectsQuery.mappedByMe &&
    !fullProjectsQuery.favoritedByMe &&
    !fullProjectsQuery.status
  ) {
    setProjectQuery({ managedByMe: true });
  }

  return (
    <div className="pull-center">
      <MyProjectNav location={location} management={management} />
      <section className={`${searchResultWidth} explore-projects-container`}>
        <div>
          <ProjectSearchResults
            status={status}
            projects={projects?.results}
            pagination={projects?.pagination}
            retryFn={refetch}
            showBottomButtons={location?.pathname.startsWith('/manage/')}
            management={management}
          />
          <ProjectCardPaginator
            status={status}
            pagination={projects?.pagination}
            fullProjectsQuery={fullProjectsQuery}
            setQueryParam={setProjectQuery}
          />
        </div>
        {isMapShown && (
          <div className="explore-projects-map">
            <ProjectsMap
              mapResults={projects?.mapResults}
              fullProjectsQuery={fullProjectsQuery}
              setQuery={setProjectQuery}
            />
          </div>
        )}
      </section>
    </div>
  );
};

export const ProjectsPageIndex = (props) => {
  return null;
};

export const MoreFilters = () => {
  const [position, setPosition] = useState({ top: 0, left: 0, height: 0, width: 0 });
  const [projectContainerHeight, setProjectContainerHeight] = useState({ height: 0 });
  const [scrollHeight, setScrollHeight] = useState(0);
  const navigate = useNavigate();
  const [fullProjectsQuery] = useExploreProjectsQueryParams();
  const [componentHeight, setComponentHeight] = useState(`${window.innerHeight}px`);
  const filterElement = document?.getElementById('more-filter-id');
  const projectContainerElement = document?.getElementById('projects-container');
  const [width] = useWindowSize();

  // calculate position of more filter button for layout
  useLayoutEffect(() => {
    if (!filterElement || !projectContainerElement) return;

    const { top, left, height, width } = filterElement.getBoundingClientRect();
    const { height: containerHeight } = projectContainerElement.getBoundingClientRect();
    const navbarHeight = document.getElementById('explore-nav').offsetHeight;
    // calculate difference between explore project page and navbar to set popover overlay height
    setProjectContainerHeight(containerHeight - navbarHeight);
    setPosition({ top, left, height, width });
    setScrollHeight(window.scrollY);
  }, [filterElement, width, projectContainerElement]);

  useEffect(() => {
    const contentHeight =
      document.getElementById('explore-nav').offsetHeight +
      document.getElementById('top-header').offsetHeight;

    const handleResize = () => {
      setComponentHeight(window.innerHeight - contentHeight);
    };

    handleResize();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const currentUrl = `/explore${
    stringify(fullProjectsQuery) ? ['?', stringify(fullProjectsQuery)].join('') : ''
  }`;
  const moreFilterRef = useRef(null);

  useOnClickOutside(moreFilterRef, (e) => {
    const clickedElement = e.target;
    const isClearSelectButton = hasSomeParentClass(clickedElement, 'react-select__clear-indicator');
    if (
      e.target.id === 'more-filter-id' ||
      isClearSelectButton //prevent popup close on clicking clear button of select component
    )
      return;
    navigate(currentUrl);
  });

  const isSmallScreen = width < smallScreenSize;

  return (
    <>
      <div
        ref={moreFilterRef}
        className={`absolute z-4 bg-white ${
          // compare screen size for two different design in small screen and large screen of filter section
          isSmallScreen ? ' left-0  mt1 w-40-l w-100  h4 ph1 ph5-l' : 'pa2 ba b--light-gray'
        }`}
        style={
          isSmallScreen
            ? { height: `${componentHeight}px` }
            : {
                // 250 is half the width of filter component to place filter exactly center of more-filter button
                left: position.left - 250 + position.width / 2,
                top: position.top + position.height + 10 + scrollHeight,
                width: '31.25em',
                boxShadow: '2px 1px 23px -1px rgba(143,130,130,0.75)',
              }
        }
      >
        <div
          className={`${
            isSmallScreen ? 'scrollable-container h-100  overflow-x-hidden overflow-y-auto' : ''
          }`}
        >
          <MoreFiltersForm currentUrl={currentUrl} />
        </div>
      </div>
      {!isSmallScreen && (
        <div
          style={{
            left: `${position.left + position.width / 2}px`,
            top: position.top + position.height + 2 + scrollHeight,
          }}
          className={`absolute w1 h1 bg-white bl bt b--grey-light rotate-45 z-5`}
        />
      )}

      <div
        role="button"
        className="absolute right-0 z-2 br w-100-l w-0 bg-blue-dark o-70"
        style={{
          height: `${projectContainerHeight}px`,
        }}
      />
    </>
  );
};

export const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: project, status, error } = useProjectQuery(id);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (status === 'loading') {
    return (
      <ReactPlaceholder
        showLoadingAnimation={true}
        customPlaceholder={<ProjectDetailPlaceholder />}
        ready={false}
      />
    );
  }
  if (status === 'error') {
    return (
      <>
        {error.response.data.SubCode === 'PrivateProject' ? (
          <PrivateProjectError />
        ) : (
          <NotFound projectId={id} />
        )}
      </>
    );
  }
  return (
    <ProjectDetail
      project={project.data}
      projectLoading={false}
      tasksError={false}
      tasks={project.data.tasks}
      navigate={navigate}
      type="detail"
    />
  );
};

export const ManageProjectsPage = (props) => <UserProjectsPage {...props} management={true} />;
