import bbox from '@turf/bbox';
import { formatOSMChaLink, getFilterId } from '../osmchaLink';

describe('test OSMCha link to project', () => {
  it('with osmchaFilterId', () => {
    const project = { osmchaFilterId: 'abcd-1234-xwyz-7890', aoiBBOX: '0.5,0,1,1.5' };
    expect(formatOSMChaLink(project)).toBe('https://osmcha.org/?aoi=abcd-1234-xwyz-7890');
  });

  it('without osmchaFilterId, but with other params', () => {
    const project = {
      osmchaFilterId: null,
      aoiBBOX: '0,0,1,1',
      changesetComment: '#TM4-TEST',
      created: '2019-08-27T12:20:42.460024Z',
    };
    expect(formatOSMChaLink(project)).toBe(
      `https://osmcha.org/?filters=${encodeURIComponent(
        '{"in_bbox":[{"label":"0,0,1,1","value":"0,0,1,1"}],"area_lt":[{"label":2,"value":2}],"date__gte":[{"label":"2019-08-27","value":"2019-08-27"}],"comment":[{"label":"#TM4-TEST","value":"#TM4-TEST"}]}',
      )}`,
    );
  });

  it('with aoiBBOX as a list', () => {
    const project = {
      osmchaFilterId: null,
      aoiBBOX: [0, 0, 1, 1],
      changesetComment: '#TM4-TEST',
      created: '2019-08-27T12:20:42.460024Z',
    };
    expect(formatOSMChaLink(project)).toBe(
      `https://osmcha.org/?filters=${encodeURIComponent(
        '{"in_bbox":[{"label":"0,0,1,1","value":"0,0,1,1"}],"area_lt":[{"label":2,"value":2}],"date__gte":[{"label":"2019-08-27","value":"2019-08-27"}],"comment":[{"label":"#TM4-TEST","value":"#TM4-TEST"}]}',
      )}`,
    );
  });
});

describe('test OSMCha link to task', () => {
  it('without user information', () => {
    const taskGeom = {
      coordinates: [
        [
          [
            [120.1, -9.1],
            [120.0, -9.1],
            [120.0, -9.0],
            [120.1, -9.0],
            [120.1, -9.1],
          ],
        ],
      ],
      type: 'MultiPolygon',
    };
    const taskInfo = {
      aoiBBOX: bbox(taskGeom),
      changesetComment: '#TM4-TEST',
      created: '2019-08-27T12:20:42.460024Z',
      usernames: ['user_1', 'user_2'],
    };
    expect(formatOSMChaLink(taskInfo)).toBe(
      `https://osmcha.org/?filters=${encodeURIComponent(
        '{"in_bbox":[{"label":"120,-9.1,120.1,-9","value":"120,-9.1,120.1,-9"}],"date__gte":[{"label":"2019-08-27","value":"2019-08-27"}],"comment":[{"label":"#TM4-TEST","value":"#TM4-TEST"}],"users":[{"label":"user_1","value":"user_1"},{"label":"user_2","value":"user_2"}]}',
      )}`,
    );
  });
});

describe('getFilterId return only the uuid of the saved filter', () => {
  it('with an OSMCha URL containing /filters', () => {
    expect(getFilterId('https://osmcha.org/filters?aoi=a8824b2f-8c65-4420-8566-911889caffce')).toBe(
      'a8824b2f-8c65-4420-8566-911889caffce',
    );
  });
  it('with an OSMCha URL', () => {
    expect(getFilterId('https://osmcha.org/?aoi=a8824b2f-8c65-4420-8566-911889caffce')).toBe(
      'a8824b2f-8c65-4420-8566-911889caffce',
    );
  });
  it('with an uuid', () => {
    expect(getFilterId('a8824b2f-8c65-4420-8566-911889caffce')).toBe(
      'a8824b2f-8c65-4420-8566-911889caffce',
    );
  });
});
