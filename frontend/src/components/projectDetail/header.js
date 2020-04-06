import React from 'react';
import { Link } from '@reach/router';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { PriorityBox } from '../projectcard/projectCard';

export function HeaderLine({ author, projectId, priority }: Object) {
  const userLink = (
    <Link to={`/users/${author}`} className="link blue-dark underline">
      {author}
    </Link>
  );
  const projectIdLink = (
    <Link to={`/projects/${projectId}`} className="no-underline">
      <span className="blue-light">#{projectId}</span>
    </Link>
  );
  return (
    <div className="cf">
      <div className="w-70 dib fl">
        <span className="blue-dark">
          <FormattedMessage
            {...messages.createdBy}
            values={{ user: userLink, id: projectIdLink }}
          />
        </span>
      </div>
      {priority && (
        <div className="mw4 dib fr">
          <PriorityBox priority={priority} extraClasses={'pv2 ph3'} />
        </div>
      )}
    </div>
  );
}

export const ProjectStatusBox = ({ status, className }: Object) => {
  return (
    <div className={`tc br1 f7 ttu ba b--red red ${className}`}>
      <FormattedMessage {...messages[`status_${status}`]} />
    </div>
  );
};

export const ProjectHeader = ({ project }: Object) => {
  return (
    <>
      <HeaderLine
        author={project.author}
        projectId={project.projectId}
        priority={project.projectPriority}
      />
      <div className="cf">
        <div>
          <h3 className="f2 fw6 mt2 mb3 ttu barlow-condensed blue-dark dib">
            {project.projectInfo && project.projectInfo.name}
          </h3>
          {['DRAFT', 'ARCHIVED'].includes(project.status) && (
            <ProjectStatusBox status={project.status} className={'pv2 ph3 ml3 mb3 v-mid dib'} />
          )}
        </div>
        <TagLine campaigns={project.campaigns} countries={project.countryTag} />
      </div>
    </>
  );
};

function TagLine({ campaigns = [], countries = [] }: Object) {
  let tags = [];
  tags = campaigns.map((i) => i.name).concat(countries);
  return (
    <span className="blue-light">
      {tags.map((tag, n) => (
        <>
          <span className={n === 0 ? 'dn' : 'ph2'}>&#183;</span>
          {tag}
        </>
      ))}
    </span>
  );
}
