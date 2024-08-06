import { formatProjectTag, formatTitleTag } from '../UseMetaTags';
import { ORG_CODE } from '../../config';
describe('test formatProjectTag and formatTitleTag', () => {
  const instanceName = ORG_CODE ? `${ORG_CODE} Tasking Manager` : 'Tasking Manager';
  it('return project information and instance name', () => {
    const project = {
      projectId: 1,
      projectInfo: {
        name: 'Test Project',
      },
    };
    expect(formatProjectTag(project)).toBe(`#1: Test Project`);
    expect(formatTitleTag(formatProjectTag(project))).toBe(`#1: Test Project - ${instanceName}`);
  });
  it('return only instance name', () => {
    expect(formatProjectTag({})).toBe('');
    expect(formatTitleTag(formatProjectTag({}))).toBe(instanceName);
  });
  it('return a page name', () => {
    expect(formatTitleTag('username')).toBe(`username - ${instanceName}`);
  });
});
