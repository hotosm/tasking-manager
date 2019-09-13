import React, { useEffect, useState } from 'react';

import { TaskSelection } from '../components/taskSelection';
import { fetchLocalJSONAPI } from '../network/genericJSONRequest';

const useFetch = url => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({});
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const response = await fetchLocalJSONAPI(url);
        setData(response);
      } catch (e) {
        setError(e);
      }
      setLoading(false);
    })();
  }, [url]);
  return { error, loading, data };
};

const Error = ({ error }) => <span>Error:{error.message}</span>;

export function SelectTaskToMap({ id }: Object) {
  const { error, loading, data } = useFetch(`projects/${id}/queries/summary/`);
  if (error) return <Error error={error} />;
  return (
    <div className="cf">
      <TaskSelection type={'mapping'} project={data} loading={loading} />
    </div>
  );
}

export function SelectTaskToValidate({ id }: Object) {
  const { error, loading, data } = useFetch(`projects/${id}/queries/summary/`);
  if (error) return <Error error={error} />;
  return (
    <div className="cf">
      <TaskSelection type={'validation'} project={data} loading={loading} />
    </div>
  );
}
