export const isStaging = process.env.REACT_APP_STACK === 'STAGING';
export const isProd = process.env.REACT_APP_STACK === 'PRODUCTION';


// API CONFIG
// on local environment, use 127.0.0.1 not localhost,
// otherwise the authentication will not work
let api_url;
if (isProd) {
  api_url = 'https://tasks.hotosm.org/api/v1/';
} else if (isStaging) {
  api_url = 'https://tasks-stage.hotosm.org/api/v1/';
} else {
  api_url = process.env.API_URL || 'http://127.0.0.1:5000/api/v1/';
}
export const API_URL = api_url;

export const EDITS_API_URL = process.env.EDITS_API_URL || 'https://osm-stats-production-api.azurewebsites.net/stats/hotosm';


// ORGANIZATION CONFIG
export const ORG_NAME = process.env.ORG_NAME || 'Humanitarian OpenStreetMap Team';
export const ORG_CODE = process.env.ORG_CODE || 'HOT';
export const ORG_URL = process.env.ORG_URL || 'hotosm.org'; // don't use http or https on this var

// ORGANIZATION SOCIAL NETWORKS
export const ORG_TWITTER = process.env.ORG_TWITTER || 'http://twitter.com/hotosm/';
export const ORG_FB = process.env.ORG_FB || 'https://www.facebook.com/hotosm';
export const ORG_INSTAGRAM = process.env.ORG_INSTAGRAM || 'https://www.instagram.com/hot.osm/';
export const ORG_YOUTUBE = process.env.ORG_YOUTUBE || 'https://www.youtube.com/user/hotosm';
export const ORG_GITHUB = process.env.ORG_GITHUB || 'https://github.com/hotosm/';


// DEFAULT locale
export const DEFAULT_LOCALE = process.env.TM_DEFAULT_LOCALE || 'en';
