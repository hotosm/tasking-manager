import React, { useState, useEffect } from 'react';

import { ProjectCard } from '../projectCard/projectCard';
import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';

export const RelatedProjects = ({ projectId }) => {
  const [relatedProjects, setRelatedProjects] = useState([]);

  useEffect(() => {
    fetchLocalJSONAPI(`projects/queries/${projectId}/related-projects/`).then((data) => {
      setRelatedProjects(data.results);
    });
  }, [projectId]);

  return (
    <div className="bg-white mb3">
      <div className="pt4 ph4 cards-container">
        {relatedProjects.map((project) => (
          <ProjectCard key={project.id} showBottomButtons={false} {...project} />
        ))}
      </div>
    </div>
  );
};
