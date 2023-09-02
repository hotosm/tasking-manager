import React from 'react';
import ReactPlaceholder from 'react-placeholder';
import { FormattedMessage } from 'react-intl';

import { useFetch } from '../../hooks/UseFetch';
import { ProjectCard } from '../projectCard/projectCard';
import { nCardPlaceholders } from '../projectCard/nCardPlaceholder';
import messages from './messages';

export const SimilarProjects = ({ projectId }) => {
  const [error, loading, similarProjects] = useFetch(
    `projects/queries/${projectId}/similar-projects/?limit=4`,
  );

  return (
    <div className="bg-white mb3">
      {!loading && (error || similarProjects.results.length === 0) ? (
        <p className="blue-light mv3 mh4">
          <FormattedMessage {...messages.noSimilarProjectsFound} />
        </p>
      ) : (
        <div className="ph4 cards-container">
          <ReactPlaceholder
            customPlaceholder={nCardPlaceholders(4)}
            showLoadingAnimation
            delay={10}
            ready={!loading}
          >
            {similarProjects.results?.map((project) => (
              <ProjectCard key={project.projectId} showBottomButtons={false} {...project} />
            ))}
          </ReactPlaceholder>
        </div>
      )}
    </div>
  );
};
