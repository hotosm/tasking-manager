import { fetchLocalJSONAPI } from '../network/genericJSONRequest';
import * as safeStorage from '../utils/safe_storage';

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
    .map(x => x.join('='))
    .join(',');

  const popup = window.open(location, '_blank', settings);
  if (!popup) return;

  return popup;
}

export const createLoginWindow = redirectTo => {
  const popup = createPopup('OSM auth', '');
  let url = `system/authentication/login/?callback_url=${window.location.origin}/authorized/`;
  fetchLocalJSONAPI(url).then(resp => {
    popup.location = resp.auth_url;
    // Perform token exchange.
    window.authComplete = verifier => {
      const tokens = new URLSearchParams({
        oauth_token: resp.oauth_token,
        oauth_token_secret: resp.oauth_token_secret,
      }).toString();
      let callback_url = `system/authentication/callback/?${tokens}&oauth_verifier=${verifier}`;

      const emailAddress = safeStorage.getItem('email_address');
      if (emailAddress !== null) {
        callback_url += `&email_address=${emailAddress}`;
        safeStorage.removeItem('email_address');
      }

      fetchLocalJSONAPI(callback_url).then(res => {
        const params = new URLSearchParams({
          username: res.username,
          session_token: res.session_token,
          picture: res.picture,
        }).toString();
        let redirectUrl = `/authorized/?${params}`;
        window.location.href = redirectUrl;
      });
    };
  });
};
