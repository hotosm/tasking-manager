import { useEffect, useState } from 'react';
import axios from 'axios';

import { StatsNumber } from '../homepage/stats';
import './styles.scss';

export function CrisisStats() {
  const crises = [
    {
      title: 'Refugee Response',
      description: 'Shelter and buildings mapped in earthquake-affected areas of Turkey and Syria',
      projectIds: [14232, 14264, 14220, 14226, 14246, 14315],
    },
    {
      title: 'Ecuador Floods',
      description: 'Shelter and buildings mapped in earthquake-affected areas of Turkey and Syria',
      projectIds: [14979, 14991],
    },
  ];

  return (
    <section className="ph6-l ph4 pv5 category-cards-ctr">
      {crises.map(({ title, description, projectIds }) => (
        <CrisisStatCard
          key={title}
          title={title}
          description={description}
          projectIds={projectIds}
        />
      ))}
    </section>
  );
}

function CrisisStatCard({ title, description, projectIds }) {
  const [stats, setStats] = useState(null);
  const hashtags = projectIds.map((projectId) => `hotosm-project-${projectId}`).join(',');

  const buildingsCount =
    stats && Object.values(stats).reduce((sum, project) => sum + project.buildings, 0);

  useEffect(() => {
    axios
      .get(`https://demo.contributions-stats.ohsome.org/api/stats/${hashtags}`)
      .then(({ data }) => setStats(data));
  }, [hashtags]);

  return (
    <article className="tc mv3 blue-grey fw5 ph3">
      <p className="f1 lh-solid red barlow-condensed ma0">
        <StatsNumber value={buildingsCount || 0} />
      </p>
      <h6 className="f7 ttu pt2 pb1 ma0 fw5">{title}</h6>
      <p className="ma0">{description}</p>
    </article>
  );
}
