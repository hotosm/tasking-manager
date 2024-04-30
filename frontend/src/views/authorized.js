import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setAuthDetails } from '../store/actions/auth';

export function Authorized(props) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [isReadyToRedirect, setIsReadyToRedirect] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    let authCode = params.get('code');
    let state = params.get('state');
    if (authCode !== null) {
      window.opener.authComplete(authCode, state);
      window.close();
      return;
    }
    const username = params.get('username');
    const sessionToken = params.get('session_token');
    const osm_oauth_token = params.get('osm_oauth_token');
    dispatch(setAuthDetails(username, sessionToken, osm_oauth_token));
    const redirectUrl =
      params.get('redirect_to') && params.get('redirect_to') !== '/'
        ? params.get('redirect_to')
        : '/welcome';
    setIsReadyToRedirect(true);
    navigate(redirectUrl);
  }, [dispatch, location.search, navigate]);

  return <>{!isReadyToRedirect ? null : <div>redirecting</div>}</>;
}
