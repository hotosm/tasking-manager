import { TM_DEFAULT_CHANGESET_COMMENT } from '../config';

export const retrieveDefaultChangesetComment = (changesetComment, projectId) => {
  const regex = new RegExp(`${TM_DEFAULT_CHANGESET_COMMENT}-${projectId}`);
  return changesetComment.split(' ').filter((c) => c.match(regex) !== null);
};
