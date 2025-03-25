import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// Extracts the necessary parameters from the URL, constructs and redirects to the path.
export function Redirect({ to }) {
  const params = useParams();
  const navigate = useNavigate();
  let pathToRedirect = to;
  if (params) {
    Object.keys(params).forEach((paramKey) => {
      pathToRedirect = pathToRedirect.replace(`:${paramKey}`, params[paramKey]);
    });
  }

  useEffect(() => {
    navigate(pathToRedirect);
  });

  return null;
}
