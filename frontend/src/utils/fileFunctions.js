import React from 'react';
import { FormattedMessage } from 'react-intl';
import lineToPolygon from '@turf/line-to-polygon';
import { kml } from '@tmcw/togeojson';

import messages from '../components/projectCreate/messages';
import { MAX_FILESIZE } from '../config';

var osmToGeojson = require('osmtogeojson');

export const readGeoFile = (e, format, error) => {
  const supportedFormats = ['json', 'geojson', 'kml', 'osm', 'xml', 'zip'];
  if (supportedFormats.includes(format) === false) {
    error.message = <FormattedMessage {...messages.invalidFile} />;
    throw error;
  }

  let geom = null;
  switch (format) {
    case 'json':
    case 'geojson':
      geom = JSON.parse(e.target.result);
      break;
    case 'kml':
      geom = kml(new DOMParser().parseFromString(e.target.result, 'text/xml'));
      break;
    case 'osm':
      let osm = new DOMParser().parseFromString(e.target.result, 'text/xml');
      geom = osmToGeojson(osm);
      break;
    case 'xml':
      let xml = new DOMParser().parseFromString(e.target.result, 'text/xml');
      geom = osmToGeojson(xml);
      break;
    default:
      break;
  }
  return geom;
};

export const verifyFileSize = (file, error) => {
  if (file.size >= MAX_FILESIZE) {
    error.message = (
      <FormattedMessage {...messages.fileSize} values={{ fileSize: MAX_FILESIZE / 1000000 }} />
    );
    throw error;
  }
};

const validateFeature = (e, supportedGeoms, err) => {
  if (supportedGeoms.includes(e.geometry.type) === false) {
    err.message = (
      <FormattedMessage {...messages.unsupportedGeom} values={{ geometry: e.geometry.type }} />
    );
    throw err;
  }
  // Transform lineString to polygon
  if (e.geometry.type === 'LineString') {
    const coords = e.geometry.coordinates;
    if (JSON.stringify(coords[0]) !== JSON.stringify(coords[coords.length - 1])) {
      err.message = <FormattedMessage {...messages.closedLinestring} />;
      throw err;
    }
    return lineToPolygon(e);
  }
  return e;
};

export const verifyGeometry = (geom, error, supportedGeoms) => {
  if (geom.type !== 'FeatureCollection') {
    error.message = <FormattedMessage {...messages.noFeatureCollection} />;
    throw error;
  }
  // Validate geometry for each feature.
  geom.features = geom.features.map((g) => validateFeature(g, supportedGeoms, error));
  return geom;
};
