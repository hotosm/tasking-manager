import { retrieveDefaultChangesetComment } from '../defaultChangesetComment';

describe('retrieveDefaultChangesetComment', () => {
  // defaultChangesetComment structure: organisation-project-projectId
  it('returns the default comment included in the changeset comment', () => {
    let changesetComment = '#volunteers #organisation-project-1000 #builldings';
    expect(retrieveDefaultChangesetComment(changesetComment, 1000)).toEqual([
      '#organisation-project-1000',
    ]);
  });

  it('returns an empty array for changeset comment without the default comment ', () => {
    let changesetComment = '#volunteers #builldings';
    expect(retrieveDefaultChangesetComment(changesetComment, 1000)).toEqual([]);
  });
});
