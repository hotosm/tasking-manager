import React from 'react';

import { useFetch } from '../hooks/UseFetch';
import { TaskSelection } from '../components/taskSelection';
import { NotFound } from './notFound';


const Error = ({ error }) => <span>Error:{error.message}</span>;

export function SelectTask({ id }: Object) {
  const [error, loading, data] = useFetch(`projects/${id}/queries/summary/`);
  if (error) {
    if (error.message === 'NOT FOUND') {
      return <NotFound projectId={id} />
    };
    return <Error error={error} />
  };
  return (
    <div className="cf">
      <TaskSelection project={data} loading={loading} />
    </div>
  );
}
