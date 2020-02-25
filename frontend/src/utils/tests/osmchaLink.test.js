import { formatOSMChaLink } from '../osmchaLink';

describe('calculate the correct OSMCha link to project', () => {
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
