import { formatProjectTag, formatTitleTag } from '../UseMetaTags';
import { ORG_CODE } from '../../config';

describe('test formatProjectTag and formatTitleTag', () => {
  it('return project information and instance name', () => {
    const project = {
      projectId: 1,
      projectInfo: {
        name: 'Test Project',
      },
    };
    expect(formatProjectTag(project)).toBe(`#1: Test Project`);
    expect(formatTitleTag(formatProjectTag(project))).toBe(
      `#1: Test Project - ${ORG_CODE} Tasking Manager`,
    );
  });
  it('return only instance name', () => {
    expect(formatProjectTag({})).toBe('');
    expect(formatTitleTag(formatProjectTag({}))).toBe(`${ORG_CODE} Tasking Manager`);
  });
  it('return a page name', () => {
    expect(formatTitleTag('username')).toBe(`username - ${ORG_CODE} Tasking Manager`);
  });
});
