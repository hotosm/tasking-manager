import * as config from '../index';

// API_URL can be a URL object or a string
it('exports API_URL', () => {
  expect(['object', 'string']).toContain(typeof config.API_URL);
});
it('exports API_VERSION', () => {
  expect(['object', 'string']).toContain(typeof config.API_VERSION);
});
it('exports OHSOME_STATS_BASE_URL', () => {
  expect(typeof config.OHSOME_STATS_BASE_URL).toBe('string');
});
it('exports ORG_URL', () => {
  expect(typeof config.ORG_URL).toBe('string');
});
it('exports ORG_LOGO', () => {
  expect(typeof config.ORG_LOGO).toBe('string');
});
it('exports HOMEPAGE_IMG_HIGH', () => {
  expect(typeof config.HOMEPAGE_IMG_HIGH).toBe('string');
});
it('exports HOMEPAGE_IMG_LOW', () => {
  expect(typeof config.HOMEPAGE_IMG_LOW).toBe('string');
});
it('exports ORG_NAME', () => {
  expect(typeof config.ORG_NAME).toBe('string');
});
it('exports ORG_CODE', () => {
  expect(typeof config.ORG_CODE).toBe('string');
});
it('exports ORG_TWITTER', () => {
  expect(typeof config.ORG_TWITTER).toBe('string');
});
it('exports ORG_FB', () => {
  expect(typeof config.ORG_FB).toBe('string');
});
it('exports ORG_INSTAGRAM', () => {
  expect(typeof config.ORG_INSTAGRAM).toBe('string');
});
it('exports ORG_YOUTUBE', () => {
  expect(typeof config.ORG_YOUTUBE).toBe('string');
});
it('exports ORG_GITHUB', () => {
  expect(typeof config.ORG_GITHUB).toBe('string');
});
it('exports OSM_CLIENT_ID', () => {
  expect(typeof config.OSM_CLIENT_ID).toBe('string');
});
it('exports OSM_CLIENT_SECRET', () => {
  expect(typeof config.OSM_CLIENT_SECRET).toBe('string');
});
it('exports OSM_REDIRECT_URI', () => {
  expect(typeof config.OSM_REDIRECT_URI).toBe('string');
});
it('exports MATOMO_ID', () => {
  expect(typeof config.MATOMO_ID).toBe('string');
});
it('exports SERVICE_DESK', () => {
  expect(typeof config.SERVICE_DESK).toBe('string');
});
it('exports HOMEPAGE_VIDEO_URL', () => {
  expect(typeof config.HOMEPAGE_VIDEO_URL).toBe('string');
});
it('exports IMAGE_UPLOAD_SERVICE', () => {
  expect(typeof config.IMAGE_UPLOAD_SERVICE).toBe('string');
});
it('DEFAULT_LOCALE to be english', () => {
  expect(config.DEFAULT_LOCALE).toBe('en');
});
it('exports PROJECTCARD_CONTRIBUTION_SHOWN_THRESHOLD', () => {
  expect(typeof config.PROJECTCARD_CONTRIBUTION_SHOWN_THRESHOLD).toBe('number');
});
it('exports INTERMEDIATE_LEVEL_COUNT', () => {
  expect(typeof config.INTERMEDIATE_LEVEL_COUNT).toBe('number');
});
it('exports ADVANCED_LEVEL_COUNT', () => {
  expect(typeof config.ADVANCED_LEVEL_COUNT).toBe('number');
});
it('exports MAX_FILESIZE', () => {
  expect(typeof config.MAX_FILESIZE).toBe('number');
});
it('exports MAX_AOI_AREA', () => {
  expect(typeof config.MAX_AOI_AREA).toBe('number');
});
it('exports TASK_COLOURS', () => {
  expect(typeof config.TASK_COLOURS).toBe('object');
  expect(typeof config.TASK_COLOURS.READY).toBe('string');
});
it('exports CHART_COLOURS', () => {
  expect(typeof config.CHART_COLOURS).toBe('object');
  expect(typeof config.CHART_COLOURS.red).toBe('string');
});
it('exports MAP_STYLE and type is object or string', () => {
  expect(config.MAP_STYLE).toBeTruthy();
  expect(['object', 'string'].includes(typeof config.MAP_STYLE)).toBeTruthy();
});
it('exports BASEMAP_OPTIONS and type is object or string', () => {
  expect(config.BASEMAP_OPTIONS).toBeTruthy();
  expect(typeof config.BASEMAP_OPTIONS).toBe('object');
});
it('exports MAPBOX_RTL_PLUGIN_URL', () => {
  expect(config.MAPBOX_RTL_PLUGIN_URL).toBe(
    'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.0/mapbox-gl-rtl-text.js',
  );
});
it('exports DROPZONE_SETTINGS', () => {
  expect(typeof config.DROPZONE_SETTINGS).toBe('object');
  expect(config.DROPZONE_SETTINGS.accept).toStrictEqual({
    'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'],
  });
  expect(config.DROPZONE_SETTINGS.maxSize).toBe(256000);
  expect(config.DROPZONE_SETTINGS.multiple).toBeFalsy();
});
it('exports OSM_REGISTER_URL', () => {
  expect(config.OSM_REGISTER_URL.startsWith('https://')).toBeTruthy();
});
it('exports OSM_SERVER_URL', () => {
  expect(config.OSM_SERVER_URL.startsWith('https://')).toBeTruthy();
});
it('exports ID_EDITOR_URL', () => {
  expect(config.ID_EDITOR_URL.startsWith('https://')).toBeTruthy();
});
it('exports POTLATCH2_EDITOR_URL', () => {
  expect(config.POTLATCH2_EDITOR_URL.startsWith('https://')).toBeTruthy();
});
