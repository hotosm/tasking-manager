export const isStaging = process.env.REACT_APP_STACK === 'STAGING';
export const isProd = process.env.REACT_APP_STACK === 'PRODUCTION';


// API CONFIG
let api_url;
if (isProd) {
  api_url = 'https://tasks.hotosm.org/api/v1/';
} else if (isStaging) {
  api_url = 'https://tasks-stage.hotosm.org/api/v1/';
} else {
  api_url = process.env.API_URL || 'http://localhost:5000/api/v1/';
}


// ORGANIZATION CONFIG
const org_name = process.env.ORG_NAME || 'Humanitarian OpenStreetMap Team';
const org_code = process.env.ORG_CODE || 'HOT';
const org_url = process.env.ORG_URL || 'hotosm.org'; // don't use http or https on this var


export const API_URL = api_url;
export const ORG_NAME = org_name;
export const ORG_CODE = org_code;
export const ORG_URL = org_url;
