export const retrieveDefaultChangesetComment = (changesetComment, projectId) => {
  let pattern = `\\w*(-project-${projectId})$`;
  const regex = new RegExp(pattern);
  let defaultComment = changesetComment.split(' ').filter((c) => {
    return c.match(regex) !== null;
  });
  return defaultComment;
};
