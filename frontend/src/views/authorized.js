import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setAuthDetails } from '../store/actions/auth';
import { getItem, removeItem } from '../utils/safe_storage';
import { OSM_REDIRECT_URI } from '../config';
import { fetchLocalJSONAPI } from '../network/genericJSONRequest';
import { AnimatedLoadingIcon } from '../components/button';

export function Authorized(props) {
  const authComplete = (authCode, state) => {
    let callback_url = `system/authentication/callback/?redirect_uri=${OSM_REDIRECT_URI}&code=${authCode}`;
    const emailAddress = getItem('email_address');
    if (emailAddress !== null) {
      callback_url += `&email_address=${emailAddress}`;
      removeItem('email_address');
    }
    return fetchLocalJSONAPI(callback_url).then((res) => {
      const storedState = getItem('osm_oauth_state');
      const redirectTo = getItem('osm_oauth_redirect_to');

      if (storedState !== state) {
        throw new Error('States do not match');
      }

      const params = new URLSearchParams({
        username: res.username,
        osm_oauth_token: res.session.access_token,
        session_token: res.session_token,
        picture: res.picture,
        redirect_to: redirectTo,
      }).toString();
      window.location.href = `/authorized/?${params}`;
    });
  };

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    let authCode = params.get('code');
    let state = params.get('state');
    if (authCode !== null) {
      // Without this catch, a failed callback (or a state mismatch) rejects
      // silently and the user sits on "Redirecting ..." indefinitely.
      authComplete(authCode, state).catch(() => navigate('/login'));
      return;
    }
    const username = params.get('username');
    const sessionToken = params.get('session_token');
    const osm_oauth_token = params.get('osm_oauth_token');

    // A failed or abandoned OSM login lands back here with no credentials.
    // Dispatching them anyway stores a junk token -- btoa(null) yields the
    // string 'bnVsbA==' rather than throwing -- and starts a doomed request
    // for user "null" that switches the global loader on.
    if (!username || !sessionToken) {
      navigate('/login');
      return;
    }

    dispatch(setAuthDetails(username, sessionToken, osm_oauth_token));
    const redirectUrl =
      params.get('redirect_to') && params.get('redirect_to') !== '/'
        ? params.get('redirect_to')
        : '/welcome';
    navigate(redirectUrl);
  }, [dispatch, location.search, navigate]);

  return (
    <div className="pa3">
      <h3>
        <AnimatedLoadingIcon /> Redirecting ...
      </h3>
    </div>
  );
}
