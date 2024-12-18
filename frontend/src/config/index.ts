// API ENDPOINTS
export const API_VERSION = import.meta.env.VITE_API_VERSION || 'v2';
export const API_URL = import.meta.env.VITE_API_URL
  ? new URL('/api/' + API_VERSION + '/', import.meta.env.VITE_API_URL)
  : 'http://127.0.0.1:5000/api/' + API_VERSION + '/';
export const OHSOME_STATS_BASE_URL =
  import.meta.env.VITE_OHSOME_STATS_BASE_URL || 'https://stats.now.ohsome.org/api';
// APPLICATION SETTINGS
export const DEFAULT_LOCALE = import.meta.env.VITE_DEFAULT_LOCALE || 'en';
export const ENVIRONMENT = import.meta.env.VITE_ENVIRONMENT || '';
export const PROJECTCARD_CONTRIBUTION_SHOWN_THRESHOLD =
  import.meta.env.VITE_PROJECTCARD_CONTRIBUTION_SHOWN_THRESHOLD || 5;
export const INTERMEDIATE_LEVEL_COUNT =
  Number(import.meta.env.VITE_TM_MAPPER_LEVEL_INTERMEDIATE) || 250;
export const ADVANCED_LEVEL_COUNT = Number(import.meta.env.VITE_TM_MAPPER_LEVEL_ADVANCED) || 500;
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';
export const ENABLE_SERVICEWORKER = import.meta.env.VITE_ENABLE_SERVICEWORKER || 0;
export const MAX_AOI_AREA = Number(import.meta.env.VITE_MAX_AOI_AREA) || 5000;
export const MAX_FILESIZE = parseInt(import.meta.env.VITE_MAX_FILESIZE) || 1000000; // bytes

// ORGANISATIONAL INFORMATION
export const ORG_NAME = import.meta.env.VITE_ORG_NAME || 'Humanitarian OpenStreetMap Team';
export const ORG_CODE = import.meta.env.VITE_ORG_CODE || 'HOT';
export const ORG_URL = import.meta.env.VITE_ORG_URL || '';
export const ORG_LOGO = import.meta.env.VITE_ORG_LOGO || '';
export const HOMEPAGE_IMG_HIGH = import.meta.env.VITE_HOMEPAGE_IMG_HIGH || '';
export const HOMEPAGE_IMG_LOW = import.meta.env.VITE_HOMEPAGE_IMG_LOW || '';
export const OSM_CLIENT_ID = import.meta.env.VITE_OSM_CLIENT_ID || '';
export const OSM_CLIENT_SECRET = import.meta.env.VITE_OSM_CLIENT_SECRET || '';
export const OSM_REDIRECT_URI = import.meta.env.VITE_OSM_REDIRECT_URI || '';
export const ORG_PRIVACY_POLICY_URL = import.meta.env.VITE_ORG_PRIVACY_POLICY_URL || '';
export const OSM_REGISTER_URL =
  import.meta.env.VITE_OSM_REGISTER_URL || 'https://www.openstreetmap.org/user/new';
export const ORG_TWITTER = import.meta.env.VITE_ORG_TWITTER || 'https://twitter.com/hotosm';
export const ORG_FB = import.meta.env.VITE_ORG_FB || 'https://www.facebook.com/hotosm';
export const ORG_INSTAGRAM =
  import.meta.env.VITE_ORG_INSTAGRAM || 'https://www.instagram.com/open.mapping.hubs/';
export const ORG_YOUTUBE =
  import.meta.env.VITE_ORG_YOUTUBE || 'https://www.youtube.com/user/hotosm';
export const ORG_GITHUB = import.meta.env.VITE_ORG_GITHUB || 'https://github.com/hotosm';
export const MATOMO_ID = import.meta.env.VITE_MATOMO_ID || '';
export const SERVICE_DESK = import.meta.env.VITE_SERVICE_DESK || '';
export const IMAGE_UPLOAD_SERVICE = import.meta.env.VITE_IMAGE_UPLOAD_API_URL || '';
export const TM_DEFAULT_CHANGESET_COMMENT =
  import.meta.env.VITE_TM_DEFAULT_CHANGESET_COMMENT || '#hotosm-project';
export const HOMEPAGE_VIDEO_URL = import.meta.env.VITE_HOMEPAGE_VIDEO_URL || '';
// Sentry.io DSN
export const SENTRY_FRONTEND_DSN = import.meta.env.VITE_SENTRY_FRONTEND_DSN;

// OSM API and Editor URLs
export const OSM_SERVER_URL =
  import.meta.env.VITE_OSM_SERVER_URL || 'https://www.openstreetmap.org';
export const OSM_SERVER_API_URL =
  import.meta.env.VITE_OSM_SERVER_API_URL || 'https://api.openstreetmap.org';
export const ID_EDITOR_URL =
  import.meta.env.VITE_ID_EDITOR_URL || 'https://www.openstreetmap.org/edit?editor=id&';
export const POTLATCH2_EDITOR_URL =
  import.meta.env.VITE_POTLATCH2_EDITOR_URL ||
  'https://www.openstreetmap.org/edit?editor=potlatch2';
export const RAPID_EDITOR_URL = import.meta.env.VITE_RAPID_EDITOR_URL || 'https://mapwith.ai/rapid';
export const EXPORT_TOOL_S3_URL = import.meta.env.VITE_EXPORT_TOOL_S3_URL || '';
export const ENABLE_EXPORT_TOOL = import.meta.env.VITE_ENABLE_EXPORT_TOOL || '';

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
  gray: '#C9C9C9',
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

export const UNDERPASS_URL = import.meta.env.VITE_UNDERPASS_URL || 'https://underpass.hotosm.org';

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

// TM_DEFAULT_CHANGESET_COMMENT without '#'
export const defaultChangesetComment = TM_DEFAULT_CHANGESET_COMMENT.replace('#', '');
