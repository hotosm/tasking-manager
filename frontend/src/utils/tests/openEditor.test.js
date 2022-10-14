import { API_URL } from '../../config';
import {
  getIdUrl,
  getTaskGpxUrl,
  getTaskXmlUrl,
  formatImageryUrl,
  getFieldPapersUrl,
  getPotlatch2Url,
  formatJosmUrl,
  formatCustomUrl,
  getImageryInfo,
  formatExtraParams,
} from '../openEditor';

describe('test if getIdUrl', () => {
  it('returns the correct url with locale=pt-BR', () => {
    const testProject = {
      changesetComment: '#hotosm-project-5522 #osm_in #2018IndiaFloods #mmteamarm',
      projectId: 1234,
      imagery:
        'tms[1,22]:https://api.mapbox.com/styles/v1/tm4/code123/tiles/256/{zoom}/{x}/{y}?access_token=pk.123',
    };
    expect(getIdUrl(testProject, [120.25684, -9.663953], 18, [1])).toBe(
      'https://www.openstreetmap.org/edit?editor=id&' +
        '#map=18/-9.663953/120.25684' +
        '&comment=%23hotosm-project-5522%20%23osm_in%20%232018IndiaFloods%20%23mmteamarm' +
        '&background=custom:https%3A%2F%2Fapi.mapbox.com%2Fstyles%2Fv1%2Ftm4%2Fcode123%2Ftiles%2F256%2F%7Bz%7D%2F%7Bx%7D%2F%7By%7D%3Faccess_token%3Dpk.123' +
        '&gpx=http%3A%2F%2F127.0.0.1%3A5000%2Fapi%2Fv2%2Fprojects%2F1234%2Ftasks%2Fqueries%2Fgpx%2F%3Ftasks%3D1',
    );
  });

  it('with customUrl returns the correct formatted url', () => {
    const testProject = {
      changesetComment: '#hotosm-project-5522 #osm_in #2018IndiaFloods #mmteamarm',
      projectId: 1234,
      imagery:
        'tms[1,22]:https://api.mapbox.com/styles/v1/tm4/code123/tiles/256/{zoom}/{x}/{y}?access_token=pk.123',
    };
    expect(getIdUrl(testProject, [120.25684, -9.663953], 18, [1], 'https://mapwith.ai/rapid')).toBe(
      'https://mapwith.ai/rapid?' +
        '#map=18/-9.663953/120.25684' +
        '&comment=%23hotosm-project-5522%20%23osm_in%20%232018IndiaFloods%20%23mmteamarm' +
        '&background=custom:https%3A%2F%2Fapi.mapbox.com%2Fstyles%2Fv1%2Ftm4%2Fcode123%2Ftiles%2F256%2F%7Bz%7D%2F%7Bx%7D%2F%7By%7D%3Faccess_token%3Dpk.123' +
        '&gpx=http%3A%2F%2F127.0.0.1%3A5000%2Fapi%2Fv2%2Fprojects%2F1234%2Ftasks%2Fqueries%2Fgpx%2F%3Ftasks%3D1',
    );
  });

  it('with idPresets returns the url param', () => {
    const testProject = {
      changesetComment: '#hotosm-project-5522 #osm_in #2018IndiaFloods #mmteamarm',
      projectId: 1234,
      idPresets: ['building', 'highway', 'natural/water'],
    };
    expect(getIdUrl(testProject, [120.25684, -9.663953], 18, [1])).toBe(
      'https://www.openstreetmap.org/edit?editor=id&' +
        '#map=18/-9.663953/120.25684' +
        '&comment=%23hotosm-project-5522%20%23osm_in%20%232018IndiaFloods%20%23mmteamarm' +
        '&gpx=http%3A%2F%2F127.0.0.1%3A5000%2Fapi%2Fv2%2Fprojects%2F1234%2Ftasks%2Fqueries%2Fgpx%2F%3Ftasks%3D1' +
        '&presets=building%2Chighway%2Cnatural%2Fwater',
    );
  });

  it('Integrated iD returns only the #map params and the extraParams', () => {
    const testProject = {
      changesetComment: '#hotosm-project-5522 #osm_in #2018IndiaFloods #mmteamarm',
      projectId: 1234,
      idPresets: ['building', 'highway', 'natural/water'],
      extraIdParams: '&validationDisable=crossing_ways/highway*&photo_user=user1,user2',
      imagery:
        'tms[1,22]:https://api.mapbox.com/styles/v1/tm4/code123/tiles/256/{zoom}/{x}/{y}?access_token=pk.123',
    };
    expect(getIdUrl(testProject, [120.25684, -9.663953], 18, [1], '?editor=ID')).toBe(
      '?editor=ID#map=18/-9.663953/120.25684&validationDisable=crossing_ways%2Fhighway*&photo_user=user1%2Cuser2',
    );
  });

  it('without imagery and with multiple tasks returns the correct url', () => {
    const testProject = {
      changesetComment: '#hotosm-project-5522',
      projectId: 1234,
    };
    expect(getIdUrl(testProject, [120.25684, -9.663953], 18, [1, 2])).toBe(
      'https://www.openstreetmap.org/edit?editor=id&' +
        '#map=18/-9.663953/120.25684' +
        '&comment=%23hotosm-project-5522' +
        '&gpx=http%3A%2F%2F127.0.0.1%3A5000%2Fapi%2Fv2%2Fprojects%2F1234%2Ftasks%2Fqueries%2Fgpx%2F%3Ftasks%3D1%2C2',
    );
  });

  it('with a imagery that is not a URL and with multiple tasks returns the correct url', () => {
    const testProject = {
      changesetComment: '#hotosm-project-5522',
      projectId: 1234,
      imagery: 'Maxar-Premium',
    };
    expect(getIdUrl(testProject, [120.25684, -9.663953], 18, [1, 2])).toBe(
      'https://www.openstreetmap.org/edit?editor=id&' +
        '#map=18/-9.663953/120.25684' +
        '&comment=%23hotosm-project-5522' +
        '&background=Maxar-Premium' +
        '&gpx=http%3A%2F%2F127.0.0.1%3A5000%2Fapi%2Fv2%2Fprojects%2F1234%2Ftasks%2Fqueries%2Fgpx%2F%3Ftasks%3D1%2C2',
    );
  });
});

it('test if formatCustomUrl returns the url with question mark', () => {
  expect(formatCustomUrl('https://mapwith.ai/rapid')).toBe('https://mapwith.ai/rapid?');
  expect(formatCustomUrl('https://mapwith.ai/rapid?')).toBe('https://mapwith.ai/rapid?');
});

it('test if getFieldPapersUrl returns the correct url', () => {
  expect(getFieldPapersUrl([1.232123234, -2.3432563434], 18)).toBe(
    'http://fieldpapers.org/compose#18/-2.34326/1.23212',
  );
});

it('test if getPotlatch2Url returns the correct url', () => {
  expect(getPotlatch2Url([1.232123234, -2.3432563434], 18)).toBe(
    'https://www.openstreetmap.org/edit?editor=potlatch2#map=18/-2.34326/1.23212',
  );
});

it('test if getTaskGpxUrl returns the correct url', () => {
  expect(getTaskGpxUrl(1, [1])).toBe(
    new URL('projects/1/tasks/queries/gpx/?tasks=1', API_URL).href,
  );
  expect(getTaskGpxUrl(2312, [1, 344, 54])).toBe(
    new URL('projects/2312/tasks/queries/gpx/?tasks=1,344,54', API_URL).href,
  );
});

it('test if getTaskXmlUrl returns the correct url', () => {
  expect(getTaskXmlUrl(1, [1]).href).toBe(
    new URL('projects/1/tasks/queries/xml/?tasks=1', API_URL).href,
  );
  expect(getTaskXmlUrl(2312, [1, 344, 54]).href).toBe(
    new URL('projects/2312/tasks/queries/xml/?tasks=1,344,54', API_URL).href,
  );
});

describe('test if formatJosmUrl', () => {
  it('returns the correct url', () => {
    expect(
      formatJosmUrl('imagery', {
        title: 'osm',
        type: 'tms',
        min_zoom: 1,
        max_zoom: 20,
        url: 'http://tile.openstreetmap.org/{zoom}/{x}/{y}.png',
      }).href,
    ).toBe(
      new URL(
        '?title=osm&type=tms&min_zoom=1&max_zoom=20&url=http%3A%2F%2Ftile.openstreetmap.org%2F%7Bzoom%7D%2F%7Bx%7D%2F%7By%7D.png',
        'http://127.0.0.1:8111/imagery',
      ).href,
    );
  });
});

describe('test get imagery type from URL', () => {
  it('without prefix', () => {
    const imagery = 'http://tile.openstreetmap.org/{zoom}/{x}/{y}.png';
    expect(getImageryInfo(imagery)).toStrictEqual(['tms', null, null]);
  });
  it('with tms prefix', () => {
    const tms = 'tms:http://tile.openstreetmap.org/{zoom}/{x}/{y}.png';
    expect(getImageryInfo(tms)).toStrictEqual(['tms', null, null]);

    const tmsWithZoom = 'tms[0:22]http://tile.openstreetmap.org/{zoom}/{x}/{y}.png';
    expect(getImageryInfo(tmsWithZoom)).toStrictEqual(['tms', 0, 22]);

    const tmsWithOneZoom = 'tms[22]:http://tile.openstreetmap.org/{zoom}/{x}/{y}.png';
    expect(getImageryInfo(tmsWithOneZoom)).toStrictEqual(['tms', null, 22]);

    const tmsWithMinZoom = 'tms[0:]http://tile.openstreetmap.org/{zoom}/{x}/{y}.png';
    expect(getImageryInfo(tmsWithMinZoom)).toStrictEqual(['tms', 0, null]);

    const tmsWithInvalidZoom = 'tms[:]http://tile.openstreetmap.org/{zoom}/{x}/{y}.png';
    expect(getImageryInfo(tmsWithInvalidZoom)).toStrictEqual(['tms', null, null]);

    const tmsWithMaxZoom = 'tms[:22]http://tile.openstreetmap.org/{zoom}/{x}/{y}.png';
    expect(getImageryInfo(tmsWithMaxZoom)).toStrictEqual(['tms', null, 22]);
  });
  it('with wms prefix', () => {
    const wms = 'wms:http://tile.openstreetmap.org/{zoom}/{x}/{y}.png';
    expect(getImageryInfo(wms)).toStrictEqual(['wms', null, null]);

    const wmsWithZoom = 'wms[0:22]http://tile.openstreetmap.org/{zoom}/{x}/{y}.png';
    expect(getImageryInfo(wmsWithZoom)).toStrictEqual(['wms', 0, 22]);

    const wmsWithOneZoom = 'wms[22]:http://tile.openstreetmap.org/{zoom}/{x}/{y}.png';
    expect(getImageryInfo(wmsWithOneZoom)).toStrictEqual(['wms', null, 22]);

    const wmsWithMinZoom = 'wms[0:]http://tile.openstreetmap.org/{zoom}/{x}/{y}.png';
    expect(getImageryInfo(wmsWithMinZoom)).toStrictEqual(['wms', 0, null]);

    const wmsWithMaxZoom = 'wms[:22]http://tile.openstreetmap.org/{zoom}/{x}/{y}.png';
    expect(getImageryInfo(wmsWithMaxZoom)).toStrictEqual(['wms', null, 22]);
  });
});

describe('formatImageryUrl', () => {
  it('returns a string starting with http and replaces {zoom} by {z}', () => {
    expect(formatImageryUrl('wms:http://tile.openstreetmap.org/{zoom}/{x}/{y}.png')).toBe(
      'http://tile.openstreetmap.org/{z}/{x}/{y}.png',
    );
    expect(formatImageryUrl('tms[0:]https://tile.openstreetmap.org/{zoom}/{x}/{y}.png')).toBe(
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    );
  });
  it('in case the imagery is not an URL, return the same string', () => {
    expect(formatImageryUrl('Bing')).toBe('Bing');
    expect(formatImageryUrl('EsriWorldImageryClarity')).toBe('EsriWorldImageryClarity');
    expect(formatImageryUrl('Maxar-Premium')).toBe('Maxar-Premium');
  });
});

describe('formatExtraParams', () => {
  it('returns the parameter values formated as URI component', () => {
    expect(
      formatExtraParams('&validationDisable=crossing_ways/highway*&photo_user=user1,user2'),
    ).toBe('&validationDisable=crossing_ways%2Fhighway*&photo_user=user1%2Cuser2');
  });
});
