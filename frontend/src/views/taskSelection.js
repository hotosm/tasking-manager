import React from 'react';
import { useSelector } from 'react-redux';

import { useFetch } from '../hooks/UseFetch';
import { TaskSelection } from '../components/taskSelection';
import { NotFound } from './notFound';
import { Login } from './login';

const Error = ({ error }) => <span>Error:{error.message}</span>;

export function SelectTask({ id }: Object) {
  const [error, loading, data] = useFetch(`projects/${id}/queries/summary/`);
  const token = useSelector(state => state.auth.get('token'));
  if (error) {
    if (error.message === 'NOT FOUND') {
      return <NotFound projectId={id} />;
    }
    return <Error error={error} />;
  }
  if (token) {
    return (
      <div className="cf">
        <TaskSelection project={data} loading={loading} />
      </div>
    );
  } else {
    return <Login redirect_to={`projects/${id}/map`} />;
  }
}
