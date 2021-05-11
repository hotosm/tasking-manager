import {
  twoFeaturesOneInvalid,
  validMultiPolygonAoi,
  emptyMultiPolygon,
  polygonAndMultiPolygon,
} from './snippets/AOI';

import { verifyGeometry } from '../fileFunctions';

describe('verifyGeometry', () => {
  const supportedGeoms = ['Polygon', 'MultiPolygon'];
  it('with an empty MultiPolygon, should return no features', () => {
    expect(verifyGeometry(emptyMultiPolygon, {}, supportedGeoms).features.length).toBe(0);
  });
  it('with a valid MultiPolygon geometry', () => {
    expect(verifyGeometry(validMultiPolygonAoi, {}, supportedGeoms)).toEqual(validMultiPolygonAoi);
  });
  it('with a polygon and a MultiPolygon', () => {
    expect(verifyGeometry(polygonAndMultiPolygon, {}, supportedGeoms)).toEqual(
      polygonAndMultiPolygon,
    );
  });
  it('with an aoi containing an empty MultiPolygon, should exclude the invalid geometry', () => {
    expect(twoFeaturesOneInvalid.features.length).toBe(2);
    expect(verifyGeometry(twoFeaturesOneInvalid, {}, supportedGeoms).features.length).toBe(1);
  });
});
