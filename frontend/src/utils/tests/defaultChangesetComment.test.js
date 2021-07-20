import { retrieveDefaultChangesetComment } from '../defaultChangesetComment';
import { TM_DEFAULT_CHANGESET_COMMENT } from '../../config';

describe('retrieveDefaultChangesetComment', () => {
  // defaultChangesetComment structure: organisation-project-projectId
  it('returns the default comment included in the changeset comment', () => {
    let changesetComment = `#volunteers ${TM_DEFAULT_CHANGESET_COMMENT}-1000 #builldings`;
    expect(retrieveDefaultChangesetComment(changesetComment, 1000)).toEqual([
      `${TM_DEFAULT_CHANGESET_COMMENT}-1000`,
    ]);
  });

  it('returns an empty array for changeset comment without the default comment ', () => {
    let changesetComment = '#volunteers #builldings';
    expect(retrieveDefaultChangesetComment(changesetComment, 1000)).toEqual([]);
  });
});
