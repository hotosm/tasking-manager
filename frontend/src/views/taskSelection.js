import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

import { TaskSelection } from '../components/taskSelection';
import { NotFound } from './notFound';
import { useProjectSummaryQuery, useProjectQuery } from '../api/projects';
import { Preloader } from '../components/preloader';

const publicRoutes = ['/instructions'];

export function SelectTask() {
  const { id } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const {
    data: projectSummaryData,
    error: projectSummaryError,
    status: projectSummaryStatus,
  } = useProjectSummaryQuery(id, {
    useErrorBoundary: (error) => error.response.status !== 404,
    enabled: !!token,
  });
  const {
    data: projectData,
    error: projectError,
    status: projectStatus,
  } = useProjectQuery(id, {
    enabled: !token,
  });

  useEffect(() => {
    const isPublicRoute = publicRoutes.some((url) => pathname.includes(url));
    if (!isPublicRoute && !token) {
      navigate('/login');
    }
  }, [navigate, token, pathname]);

  const status = token ? projectSummaryStatus : projectStatus;
  const error = token ? projectSummaryError : projectError;

  if (status === 'loading') {
    return <Preloader />;
  }

  if (status === 'error') {
    if (error.response.status === 404) {
      return <NotFound projectId={id} />;
    }
  }

  const project = token ? projectSummaryData : projectData.data;

  return <TaskSelection project={project} />;
}
