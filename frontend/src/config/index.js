// API ENDPOINTS
export const API_VERSION = process.env.REACT_APP_API_VERSION || 'v2';
export const API_URL = process.env.REACT_APP_API_URL
  ? new URL('/api/' + API_VERSION + '/', process.env.REACT_APP_API_URL)
  : 'https://tasking-manager-staging-api.hotosm.org/' + API_VERSION + '/';
export const OHSOME_STATS_BASE_URL =
  process.env.REACT_APP_OHSOME_STATS_BASE_URL || 'https://stats.now.ohsome.org/api';
// APPLICATION SETTINGS
export const DEFAULT_LOCALE = process.env.REACT_APP_DEFAULT_LOCALE || 'en';
export const ENVIRONMENT = process.env.REACT_APP_ENVIRONMENT || '';
export const PROJECTCARD_CONTRIBUTION_SHOWN_THRESHOLD =
  process.env.REACT_APP_PROJECTCARD_CONTRIBUTION_SHOWN_THRESHOLD || 5;
export const INTERMEDIATE_LEVEL_COUNT =
  Number(process.env.REACT_APP_TM_MAPPER_LEVEL_INTERMEDIATE) || 250;
export const ADVANCED_LEVEL_COUNT = Number(process.env.REACT_APP_TM_MAPPER_LEVEL_ADVANCED) || 500;
export const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || '';
export const ENABLE_SERVICEWORKER = process.env.REACT_APP_ENABLE_SERVICEWORKER || 0;
export const MAX_AOI_AREA = Number(process.env.REACT_APP_MAX_AOI_AREA) || 5000;
export const MAX_FILESIZE = parseInt(process.env.REACT_APP_MAX_FILESIZE) || 1000000; // bytes

// ORGANISATIONAL INFORMATION
export const ORG_NAME = process.env.REACT_APP_ORG_NAME || 'Humanitarian OpenStreetMap Team';
export const ORG_CODE = process.env.REACT_APP_ORG_CODE || 'HOT';
export const ORG_URL = process.env.REACT_APP_ORG_URL || '';
export const ORG_LOGO = process.env.REACT_APP_ORG_LOGO || '';
export const HOMEPAGE_IMG_HIGH = process.env.REACT_APP_HOMEPAGE_IMG_HIGH || '';
export const HOMEPAGE_IMG_LOW = process.env.REACT_APP_HOMEPAGE_IMG_LOW || '';
export const OSM_CLIENT_ID = process.env.REACT_APP_OSM_CLIENT_ID || '';
export const OSM_CLIENT_SECRET = process.env.REACT_APP_OSM_CLIENT_SECRET || '';
export const OSM_REDIRECT_URI = process.env.REACT_APP_OSM_REDIRECT_URI || '';
export const ORG_PRIVACY_POLICY_URL = process.env.REACT_APP_ORG_PRIVACY_POLICY_URL || '';
export const OSM_REGISTER_URL =
  process.env.REACT_APP_OSM_REGISTER_URL || 'https://www.openstreetmap.org/user/new';
export const ORG_TWITTER = process.env.REACT_APP_ORG_TWITTER || 'https://twitter.com/hotosm';
export const ORG_FB = process.env.REACT_APP_ORG_FB || 'https://www.facebook.com/hotosm';
export const ORG_INSTAGRAM =
  process.env.REACT_APP_ORG_INSTAGRAM || 'https://www.instagram.com/open.mapping.hubs/';
export const ORG_YOUTUBE =
  process.env.REACT_APP_ORG_YOUTUBE || 'https://www.youtube.com/user/hotosm';
export const ORG_GITHUB = process.env.REACT_APP_ORG_GITHUB || 'https://github.com/hotosm';
export const MATOMO_ID = process.env.REACT_APP_MATOMO_ID || '';
export const SERVICE_DESK = process.env.REACT_APP_SERVICE_DESK || '';
export const IMAGE_UPLOAD_SERVICE = process.env.REACT_APP_IMAGE_UPLOAD_API_URL || '';
export const TM_DEFAULT_CHANGESET_COMMENT =
  process.env.REACT_APP_TM_DEFAULT_CHANGESET_COMMENT || '#hotosm-project';
export const HOMEPAGE_VIDEO_URL = process.env.REACT_APP_HOMEPAGE_VIDEO_URL || '';
// Sentry.io DSN
export const SENTRY_FRONTEND_DSN = process.env.REACT_APP_SENTRY_FRONTEND_DSN;

// OSM API and Editor URLs
export const OSM_SERVER_URL =
  process.env.REACT_APP_OSM_SERVER_URL || 'https://www.openstreetmap.org';
export const ID_EDITOR_URL =
  process.env.REACT_APP_ID_EDITOR_URL || 'https://www.openstreetmap.org/edit?editor=id&';
export const POTLATCH2_EDITOR_URL =
  process.env.REACT_APP_POTLATCH2_EDITOR_URL ||
  'https://www.openstreetmap.org/edit?editor=potlatch2';
export const RAPID_EDITOR_URL =
  process.env.REACT_APP_RAPID_EDITOR_URL || 'https://mapwith.ai/rapid';
export const EXPORT_TOOL_S3_URL = process.env.REACT_APP_EXPORT_TOOL_S3_URL || '';
export const ENABLE_EXPORT_TOOL = process.env.REACT_APP_ENABLE_EXPORT_TOOL || '';

export const TASK_COLOURS = {
  READY: '#fff',
  LOCKED_FOR_MAPPING: '#fff',
  MAPPED: '#ade6ef',
  LOCKED_FOR_VALIDATION: '#ade6ef',
  VALIDATED: '#40ac8c',
  INVALIDATED: '#fceca4',
  BADIMAGERY: '#d8dae4',
  PRIORITY_AREAS: '#efd1d1',
};

export const CHART_COLOURS = {
  red: '#d73f3f',
  green: '#3e9c67',
  blue: '#3389D6',
  orange: '#f09733',
  white: '#fff',
};

const fallbackRasterStyle = {
  version: 8,
  // "glyphs": "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
  glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
  sources: {
    'raster-tiles': {
      type: 'raster',
      tiles: ['https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'],
      tileSize: 128,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright/">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: 'simple-tiles',
      type: 'raster',
      source: 'raster-tiles',
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

const wmsDensityStyle = {
  version: 8,
  glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
  sources: {
    'raster-tiles': {
      type: 'raster',
      tiles: [
        'https://sedac.ciesin.columbia.edu/geoserver/wms?bbox={bbox-epsg-3857}&format=image/png&service=WMS&version=1.1.1&request=GetMap&srs=EPSG:3857&transparent=true&width=256&height=256&layers=gpw-v3:gpw-v3-population-density-future-estimates_2005',
      ],
      tileSize: 256,
      attribution:
        '© <a href="https://sedac.ciesin.columbia.edu">Socioeconomic Data and Applications Center (SEDAC)</a>',
    },
  },
  layers: [
    {
      id: 'simple-tiles',
      type: 'raster',
      source: 'raster-tiles',
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

const bingStyle = {
  version: 8,
  sprite: 'https://maps.tilehosting.com/styles/basic/sprite',
  glyphs:
    'https://maps.tilehosting.com/fonts/{fontstack}/{range}.pbf.pict?key=alS7XjesrAd6uvek9nRE',
  sources: {
    'raster-tiles': {
      type: 'raster',
      tiles: [
        'https://ecn.t0.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=587&mkt=en-gb&n=z',
        'https://ecn.t1.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=587&mkt=en-gb&n=z',
        'https://ecn.t2.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=587&mkt=en-gb&n=z',
        'https://ecn.t3.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=587&mkt=en-gb&n=z',
      ],
      attribution:
        '© <a href="https://blog.openstreetmap.org/2010/11/30/microsoft-imagery-details">Microsoft Corporation</a>',
    },
  },
  layers: [
    {
      id: 'simple-tiles',
      type: 'raster',
      source: 'raster-tiles',
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

export const BASEMAP_OPTIONS = [
  { label: 'default', value: 'bright-v9' },
  { label: 'humanitarian', value: fallbackRasterStyle },
  { label: 'density', value: wmsDensityStyle },
  { label: 'bing', value: bingStyle },
  { label: 'mapbox satellite', value: 'satellite-v9' },
];

export const MAP_STYLE = MAPBOX_TOKEN
  ? `mapbox://styles/mapbox/${BASEMAP_OPTIONS[0].value}`
  : BASEMAP_OPTIONS[1].value;
export const MAPBOX_RTL_PLUGIN_URL =
  'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.0/mapbox-gl-rtl-text.js';

export const UNDERPASS_URL = process.env.REACT_APP_UNDERPASS_URL || 'https://underpass.hotosm.org';

export const DROPZONE_SETTINGS = {
  accept: {
    'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'],
  },
  multiple: false,
  maxSize: 256000,
  // noClick is needed to avoid file picker dialogs when switching between `Write` and `Preview` in `CommentInputField`
  // At time of writing, this workaround is only needed on Chromium based browsers.
  noClick: true,
};
