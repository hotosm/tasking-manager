import fs from 'fs';
import {
  twoFeaturesOneInvalid,
  validMultiPolygonAoi,
  emptyMultiPolygon,
  polygonAndMultiPolygon,
} from './snippets/AOI';
import {
  PolygonTypeFeature,
  LineStringTypeFeature,
  MultiPolygonTypeFeature,
  closedLinestringFeature,
  convertedLineStringToPolygonFeature,
} from './snippets/feature';

import { parsedGeometry } from './snippets/parsedGeometry';
import { MAX_FILESIZE } from '../../config';

import {
  verifyGeometry,
  verifyFileSize,
  validateFeature,
  readGeoFile,
  verifyFileFormat,
} from '../geoFileFunctions';

describe('verifyGeometry', () => {
  const supportedGeoms = ['Polygon', 'MultiPolygon'];
  it('with an empty MultiPolygon, should return no features', () => {
    expect(verifyGeometry(emptyMultiPolygon, supportedGeoms).features.length).toBe(0);
  });
  it('with a valid MultiPolygon geometry', () => {
    expect(verifyGeometry(validMultiPolygonAoi, supportedGeoms)).toEqual(validMultiPolygonAoi);
  });
  it('with a polygon and a MultiPolygon', () => {
    expect(verifyGeometry(polygonAndMultiPolygon, supportedGeoms)).toEqual(polygonAndMultiPolygon);
  });
  it('with an aoi containing an empty MultiPolygon, should exclude the invalid geometry', () => {
    expect(twoFeaturesOneInvalid.features.length).toBe(2);
    expect(verifyGeometry(twoFeaturesOneInvalid, supportedGeoms).features.length).toBe(1);
  });
  it('throws an error if geometry is not a FeatureCollection', () => {
    expect(() => verifyGeometry(PolygonTypeFeature)).toThrow('noFeatureCollection');
  });
});

describe('verifyFileSize', () => {
  it('throws an error when the file is too large', () => {
    let file = new File([new ArrayBuffer(MAX_FILESIZE)], 'file.json');
    expect(() => verifyFileSize(file)).toThrow('fileSize');
  });

  it('does not throw an error when file is expected size or below', () => {
    let file = new File([new ArrayBuffer(MAX_FILESIZE - 10)], 'file.json');
    expect(() => verifyFileSize(file)).not.toThrow('fileSize');
  });
});

describe('validateFeature', () => {
  let supportedGeoms = ['Polygon', 'LineString'];

  it('returns valid geometry', () => {
    expect(validateFeature(PolygonTypeFeature, supportedGeoms)).toEqual(PolygonTypeFeature);
  });

  it('throws an error when feature geometry type is an unclosed LineString', () => {
    expect(() => validateFeature(LineStringTypeFeature, supportedGeoms)).toThrow(
      'closedLinestring',
    );
  });

  it('returns a polygon feature for a closedLineString geometry type', () => {
    expect(() => validateFeature(closedLinestringFeature, supportedGeoms)).not.toThrow(
      'closedLinestring',
    );
    expect(validateFeature(closedLinestringFeature, supportedGeoms)).toEqual(
      convertedLineStringToPolygonFeature,
    );
  });

  it('throws an error when feature contains an unsupported Geometry type - MultiPolygon', () => {
    expect(() => validateFeature(MultiPolygonTypeFeature, supportedGeoms)).toThrow(
      'unsupportedGeom - MultiPolygon',
    );
  });
});

describe('verifyFileFormat', () => {
  it('throws an error for an invalid geometry file type - .txt', () => {
    let file = new File([new ArrayBuffer(1024)], 'file.txt');
    expect(() => verifyFileFormat(file)).toThrow('invalidFile');
  });

  it('does not throw an error for a valid file format - .json', () => {
    let file = new File([new ArrayBuffer(1024)], 'file.json');
    expect(() => verifyFileFormat(file)).not.toThrow('invalidFile');
  });

  it('does not throw an error for a valid file format - .kml', () => {
    let file = new File([new ArrayBuffer(1024)], 'file.kml');
    expect(() => verifyFileFormat(file)).not.toThrow('invalidFile');
  });

  it('does not throw an error for a valid file format - .xml', () => {
    let file = new File([new ArrayBuffer(1024)], 'file.xml');
    expect(() => verifyFileFormat(file)).not.toThrow('invalidFile');
  });

  it('does not throw an error for a valid file format - .osm', () => {
    let file = new File([new ArrayBuffer(1024)], 'file.osm');
    expect(() => verifyFileFormat(file)).not.toThrow('invalidFile');
  });

  it('does not throw an error for a valid file format - .zip', () => {
    let file = new File([new ArrayBuffer(1024)], 'file.zip');
    expect(() => verifyFileFormat(file)).not.toThrow('invalidFile');
  });
});

describe('readGeoFile', () => {
  it('parses geojson file content and returns geometry', () => {
    let data = fs.readFileSync('src/utils/tests/snippets/testFiles/testFile.geojson');
    let file = new File([data], 'file.geojson', { type: 'text/GeoJSON' });
    return readGeoFile(file).then((geom) => {
      expect(geom).toEqual(parsedGeometry);
    });
  });

  it('parses kml file content and returns geometry', () => {
    let data = fs.readFileSync('src/utils/tests/snippets/testFiles/testFile.kml');
    let file = new File([data], 'file.kml', { type: 'text/kml' });
    return readGeoFile(file).then((geom) => {
      expect(geom).toEqual(parsedGeometry);
    });
  });
});
