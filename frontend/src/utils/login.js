import { fetchLocalJSONAPI } from '../network/genericJSONRequest';
import { OSM_REDIRECT_URI } from '../config';

export const osmLoginRedirect = (redirectTo) => {
  let url = `system/authentication/login/?redirect_uri=${OSM_REDIRECT_URI}`;
  fetchLocalJSONAPI(url).then((resp) => {
    let location = resp.auth_url;
    localStorage.setItem('osm_oauth_state', resp.state);
    localStorage.setItem('osm_oauth_redirect_to', redirectTo);
    window.location.href = location;
  });
};
