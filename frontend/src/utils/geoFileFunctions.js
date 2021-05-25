import React from 'react';
import { FormattedMessage } from 'react-intl';
import lineToPolygon from '@turf/line-to-polygon';
import area from '@turf/area';
import { kml } from '@tmcw/togeojson';

import messages from '../components/projectCreate/messages';
import { MAX_FILESIZE } from '../config';
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

function readFileAsync(file, format) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = reject;

    if (format === 'zip') {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  });
}

export const readGeoFile = async (file) => {
  const supportedFormats = ['json', 'geojson', 'kml', 'osm', 'xml', 'zip'];
  const format = file.name.split('.')[1].toLowerCase();

  if (supportedFormats.includes(format) === false) {
    throw Error('invalidFile');
  }

  verifyFileSize(file);

  let fileContent = await readFileAsync(file, format);
  switch (format) {
    case 'json':
    case 'geojson':
      return JSON.parse(fileContent);
    case 'kml':
      return kml(new DOMParser().parseFromString(fileContent, 'text/xml'));
    case 'osm':
      let osm = new DOMParser().parseFromString(fileContent, 'text/xml');
      return osmToGeojson(osm);
    case 'xml':
      let xml = new DOMParser().parseFromString(fileContent, 'text/xml');
      return osmToGeojson(xml);
    case 'zip':
      return shpjs(fileContent).then((geom) => geom);
    default:
      break;
  }
};

export const getErrorMsg = (msg) => {
  let intlMessageExists = !!messages[msg];

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
  return intlMessageExists ? <FormattedMessage {...messages[msg]} /> : null;
};
