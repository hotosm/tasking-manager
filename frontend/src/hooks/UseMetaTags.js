import { useMeta, useTitle } from 'react-meta-elements';

import { ORG_CODE } from '../config';

export const formatProjectTag = (project) => {
  return project.projectId
    ? `#${project.projectId}: ${project.projectInfo && project.projectInfo.name}`
    : '';
};

export const formatTitleTag = (title) => {
  const instanceName = ORG_CODE ? `${ORG_CODE} Tasking Manager` : 'Tasking Manager';
  return title ? `${title} - ${instanceName}` : instanceName;
};

export const useSetTitleTag = (title) => {
  const titleTag = formatTitleTag(title);
  useTitle(titleTag);
  useMeta({ property: 'og:title', content: titleTag });
  useMeta({ property: 'twitter:title', content: titleTag.substr(0, 70) });
  return true;
};

export const useSetProjectPageTitleTag = (project) => {
  return useSetTitleTag(formatProjectTag(project));
};
