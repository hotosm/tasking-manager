import React, { useState, useEffect } from 'react';
import ReactPlaceholder from 'react-placeholder';
import { useSelector } from 'react-redux';
import { FormattedMessage } from 'react-intl';

import { ProjectCard } from '../projectCard/projectCard';
import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';
import { nCardPlaceholders } from '../projectCard/nCardPlaceholder';
import messages from './messages';

export const RelatedProjects = ({ projectId }) => {
  const [relatedProjects, setRelatedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const userToken = useSelector((state) => state.auth.token);

  useEffect(() => {
    fetchLocalJSONAPI(`projects/queries/${projectId}/related-projects/?limit=4`, userToken).then(
      (data) => {
        setRelatedProjects(data.results);
        setLoading(false);
      },
    );
  }, [projectId, userToken]);
  return (
    <div className="bg-white mb3">
      {!loading && relatedProjects.length === 0 ? (
        <p className="blue-light f6 mv3 mh4">
          <FormattedMessage {...messages.noRelatedProjectsFound} />
        </p>
      ) : (
        <div className="pt4 ph4 cards-container">
          <ReactPlaceholder
            customPlaceholder={nCardPlaceholders(4)}
            showLoadingAnimation={true}
            delay={10}
            ready={!loading}
          >
            {relatedProjects.map((project) => (
              <ProjectCard key={project.id} showBottomButtons={false} {...project} />
            ))}
          </ReactPlaceholder>
        </div>
      )}
    </div>
  );
};
