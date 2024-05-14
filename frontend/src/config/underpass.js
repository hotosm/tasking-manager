import { MAPBOX_TOKEN, UNDERPASS_URL } from '.';

export const underpassConfig = {
  API_URL: UNDERPASS_URL,
  MAPBOX_TOKEN,
  // set default sources of Tasking Manager
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap Contributors',
      maxzoom: 19,
    },
    Bing: {
      type: 'raster',
      tiles: ['https://ecn.t3.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=1'],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap Contributors',
      maxzoom: 18,
    },
    Mapbox: {
      type: 'raster',
      tiles: [
        `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`,
      ],
      tileSize: 512,
      attribution: '&copy; OpenStreetMap Contributors &copy; Mapbox',
      maxzoom: 19,
    },
    EsriWorldImagery: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap Contributors &copy; ESRI',
      maxzoom: 18,
    },
  },
};

export const availableImageryOptions = [
  { label: 'OSM', value: 'osm' },
  { label: 'Bing', value: 'Bing' },
  { label: 'Mapbox Satellite', value: 'Mapbox' },
  { label: 'ESRI World Imagery', value: 'EsriWorldImagery' },
];

export const statusList = {
  ALL: '',
  UNSQUARED: 'badgeom',
  OVERLAPPING: 'overlapping',
  BADVALUE: 'badvalue',
};

export const mappingTypesTags = {
  ROADS: 'highway',
  BUILDINGS: 'building',
  WATERWAYS: 'waterway',
};

export const mappingTypesFeatureTypes = {
  ROADS: 'line',
  BUILDINGS: 'polygon',
  WATERWAYS: 'line',
};
