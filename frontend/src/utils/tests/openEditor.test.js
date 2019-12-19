import { API_URL } from '../../config';
import { getIdUrl, getGPXUrl } from '../openEditor';

it('test if getIdUrl returns the correct url', () => {
  const testProject = {
    changesetComment: '#hotosm-project-5522 #osm_in #2018IndiaFloods #mmteamarm',
    projectId: 1234,
    imagery: "tms[1,22]:https://api.mapbox.com/styles/v1/tm4/code123/tiles/256/{zoom}/{x}/{y}?access_token=pk.123"
  };
  expect(
    getIdUrl(testProject, [120.25684, -9.663953], 18, [1])
  ).toBe(
    'https://www.openstreetmap.org/edit?editor=id&' +
    '#map=18/-9.663953/120.25684' +
    '&comment=%23hotosm-project-5522%20%23osm_in%20%232018IndiaFloods%20%23mmteamarm' +
    '&background=custom:https%3A%2F%2Fapi.mapbox.com%2Fstyles%2Fv1%2Ftm4%2Fcode123%2Ftiles%2F256%2F%7Bz%7D%2F%7Bx%7D%2F%7By%7D%3Faccess_token%3Dpk.123' +
    '&gpx=http%3A%2F%2F127.0.0.1%3A5000%2Fapi%2Fv2%2Fprojects%2F1234%2Ftasks%2Fqueries%2Fgpx%2F%3Ftasks%3D1'
  );
});

it('test if getGPXUrl returns the correct url', () => {
  expect(
    getGPXUrl(1, [1])
  ).toStrictEqual(
    new URL('/projects/1/tasks/queries/gpx/?tasks=1', API_URL)
  );
  expect(
    getGPXUrl(2312, [1, 344, 54])
  ).toStrictEqual(
    new URL('/projects/2312/tasks/queries/gpx/?tasks=1,344,54', API_URL)
  );
});
