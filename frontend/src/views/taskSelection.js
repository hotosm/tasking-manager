import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';

import { TaskSelection } from '../components/taskSelection';
import { NotFound } from './notFound';
import { useProjectSummaryQuery } from '../api/projects';
import { Preloader } from '../components/preloader';
import { FallbackComponent } from './fallback';

const ProjectError = ({ error }) => <span>Error:{error.message}</span>;

export function SelectTask() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const { data, status, error } = useProjectSummaryQuery(id);

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [navigate, token]);

  if (status === 'loading') {
    return <Preloader />;
  }

  if (status === 'error') {
    if (error.response.status === 404) {
      return <NotFound projectId={id} />;
    }
    return <ProjectError error={error} />;
  }

  return (
    <ErrorBoundary FallbackComponent={FallbackComponent}>
      <TaskSelection project={data} />
    </ErrorBoundary>
  );
}
