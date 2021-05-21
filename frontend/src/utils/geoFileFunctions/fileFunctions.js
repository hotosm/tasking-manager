import React from 'react';
import { FormattedMessage } from 'react-intl';
import lineToPolygon from '@turf/line-to-polygon';
import area from '@turf/area';
import { kml } from '@tmcw/togeojson';

import messages from '../../components/projectCreate/messages';
import { MAX_FILESIZE } from '../../config';
import shpjs from 'shpjs';

var osmToGeojson = require('osmtogeojson');

export const verifyFileSize = (file) => {
  if (file.size >= MAX_FILESIZE) {
    throw Error('fileSize');
  }
};

export const validateFeature = (feature, supportedGeoms) => {
  if (supportedGeoms.includes(feature.geometry.type) === false) {
    throw Error(`unsupportedGeom - ${feature.geometry.type}`);
  }
  // Transform lineString to polygon
  if (feature.geometry.type === 'LineString') {
    const coords = feature.geometry.coordinates;
    if (JSON.stringify(coords[0]) !== JSON.stringify(coords[coords.length - 1])) {
      throw Error('closedLinestring');
    }
    return lineToPolygon(feature);
  }
  return feature;
};

export const verifyGeometry = (geom, supportedGeoms) => {
  if (geom.type !== 'FeatureCollection') {
    throw Error('noFeatureCollection');
  }
  // Validate geometry for each feature.
  geom.features = geom.features
    .map((feature) => validateFeature(feature, supportedGeoms))
    .filter((feature) => area(feature) > 0);
  return geom;
};

export const readGeoFile = (file, renderFn) => {
  const supportedFormats = ['json', 'geojson', 'kml', 'osm', 'xml', 'zip'];
  const format = file.name.split('.')[1].toLowerCase();

  if (supportedFormats.includes(format) === false) {
    throw Error('invalidFile');
  }

  verifyFileSize(file);

  let fileReader = new FileReader();

  if (format === 'zip') {
    fileReader.readAsArrayBuffer(file);
  } else {
    fileReader.readAsText(file);
  }

  fileReader.onload = () => {
    let geometry = null;

    switch (format) {
      case 'json':
      case 'geojson':
        geometry = JSON.parse(fileReader.result);
        break;
      case 'kml':
        geometry = kml(new DOMParser().parseFromString(fileReader.result, 'text/xml'));
        break;
      case 'osm':
        let osm = new DOMParser().parseFromString(fileReader.result, 'text/xml');
        geometry = osmToGeojson(osm);
        break;
      case 'xml':
        let xml = new DOMParser().parseFromString(fileReader.result, 'text/xml');
        geometry = osmToGeojson(xml);
        break;
      case 'zip':
        shpjs(fileReader.result).then((geom) => renderFn(geom));
        break;
      default:
        break;
    }
    if (format !== 'zip') renderFn(geometry);
  };
};

export const getErrorMsg = (msg) => {
  if (msg === 'fileSize') {
    return <FormattedMessage {...messages[msg]} values={{ fileSize: MAX_FILESIZE / 1000000 }} />;
  }
  if (msg.includes('unsupportedGeom')) {
    return (
      <FormattedMessage
        {...messages[msg.split('-')[0].trim()]}
        values={{ geometry: msg.split('-')[1].trim() }}
      />
    );
  }
  return <FormattedMessage {...messages[msg]} />;
};
