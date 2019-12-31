import { API_URL } from '../../config';
import {
  getIdUrl,
  getTaskGpxUrl,
  getTaskXmlUrl,
  getFieldPapersUrl,
  getPotlatch2Url,
  formatJosmUrl,
} from '../openEditor';

it('test if getIdUrl returns the correct url', () => {
  const testProject = {
    changesetTags: '{"comment": "#hotosm-project-5522 #osm_in #2018IndiaFloods #mmteamarm", "source": "not important"}',
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

it('test if getIdUrl without imagery and with multiple tasks returns the correct url', () => {
  const testProject = {
    changesetTags: '{"comment": "#hotosm-project-5522", "source": "not important"}',
    projectId: 1234,
  };
  expect(getIdUrl(testProject, [120.25684, -9.663953], 18, [1, 2])).toBe(
    'https://www.openstreetmap.org/edit?editor=id&' +
      '#map=18/-9.663953/120.25684' +
      '&comment=%23hotosm-project-5522' +
      '&gpx=http%3A%2F%2F127.0.0.1%3A5000%2Fapi%2Fv2%2Fprojects%2F1234%2Ftasks%2Fqueries%2Fgpx%2F%3Ftasks%3D1%2C2',
  );
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
  expect(getTaskGpxUrl(1, [1]).href).toBe(
    new URL('projects/1/tasks/queries/gpx/?tasks=1', API_URL).href,
  );
  expect(getTaskGpxUrl(2312, [1, 344, 54]).href).toBe(
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

it('test if formatJosmUrl returns the correct url', () => {
  expect(
    formatJosmUrl('imagery', {
      title: 'osm',
      type: 'tms',
      url: 'http://tile.openstreetmap.org/{zoom}/{x}/{y}.png',
    }).href,
  ).toBe(
    new URL(
      '?title=osm&type=tms&url=http%3A%2F%2Ftile.openstreetmap.org%2F%7Bzoom%7D%2F%7Bx%7D%2F%7By%7D.png',
      'http://127.0.0.1:8111/imagery',
    ).href,
  );
});
