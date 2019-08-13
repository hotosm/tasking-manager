// API ENDPOINTS
export const API_URL = process.env.REACT_APP_BASE_URL ? process.env.REACT_APP_BASE_URL + '/api/v1/'  :  'http://127.0.0.1:5000/api/v1/'
export const EDITS_API_URL = process.env.REACT_APP_EDITS_API_URL || '';

// APPLICATION SETTINGS
export const DEFAULT_LOCALE = process.env.REACT_APP_DEFAULT_LOCALE || 'en';
export const PROJECTCARD_CONTRIBUTION_SHOWN_THRESHOLD = process.env.REACT_APP_PROJECTCARD_CONTRIBUTION_SHOWN_THRESHOLD || 5;

// ORGANISATIONAL INFORMATION
export const ORG_NAME = process.env.REACT_APP_ORG_NAME || '';
export const ORG_CODE = process.env.REACT_APP_ORG_CODE || '';
export const ORG_URL = process.env.REACT_APP_ORG_URL || '';
export const ORG_TWITTER = process.env.REACT_APP_ORG_TWITTER || 'http://twitter.com';
export const ORG_FB = process.env.REACT_APP_ORG_FB || 'https://www.facebook.com';
export const ORG_INSTAGRAM = process.env.REACT_APP_ORG_INSTAGRAM || 'https://www.instagram.com';
export const ORG_YOUTUBE = process.env.REACT_APP_ORG_YOUTUBE || 'https://www.youtube.com';
export const ORG_GITHUB = process.env.REACT_APP_ORG_GITHUB || 'https://github.com/';
