import { fetchLocalJSONAPI } from '../network/genericJSONRequest';
import * as safeStorage from '../utils/safe_storage';
import { OSM_REDIRECT_URI } from '../config';

// Code taken from https://github.com/mapbox/osmcha-frontend/blob/master/src/utils/create_popup.js
export function createPopup(title: string = 'Authentication', location: string) {
  const width = 500;
  const height = 630;
  const settings = [
    ['width', width],
    ['height', height],
    ['left', window.innerWidth / 2 - width / 2],
    ['top', window.innerHeight / 2 - height / 2],
  ]
    .map((x) => x.join('='))
    .join(',');

  const popup = window.open(location, '_blank', settings);
  if (!popup) return;

  return popup;
}

export const createLoginWindow = (redirectTo) => {
  const popup = createPopup('OSM auth', '');
  let url = `system/authentication/login/?redirect_uri=${OSM_REDIRECT_URI}`;
  fetchLocalJSONAPI(url).then((resp) => {
    popup.location = resp.auth_url;
    // Perform token exchange.

    window.authComplete = (authCode, state) => {
      let callback_url = `system/authentication/callback/?redirect_uri=${OSM_REDIRECT_URI}&code=${authCode}`;
      const emailAddress = safeStorage.getItem('email_address');
      if (emailAddress !== null) {
        callback_url += `&email_address=${emailAddress}`;
        safeStorage.removeItem('email_address');
      }

      if (resp.state === state) {
        fetchLocalJSONAPI(callback_url).then((res) => {
          const params = new URLSearchParams({
            username: res.username,
            osm_oauth_token: res.session.access_token,
            session_token: res.session_token,
            picture: res.picture,
            redirect_to: redirectTo,
          }).toString();
          let redirectUrl = `/authorized/?${params}`;
          window.location.href = redirectUrl;
        });
      } else {
        throw new Error('States do not match');
      }
    };
  });
};
