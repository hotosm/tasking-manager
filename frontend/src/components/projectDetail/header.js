import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from '@reach/router';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { PriorityBox } from '../projectcard/priorityBox';
import { translateCountry } from '../../utils/countries';
import { ProjectStatusBox } from './statusBox';
import { useEditProjectAllowed } from '../../hooks/UsePermissions';

export function HeaderLine({ author, projectId, priority, showEditLink }: Object) {
  const userLink = (
    <Link to={`/users/${author}`} className="link blue-dark underline">
      {author}
    </Link>
  );
  const projectIdLink = (
    <Link to={`/projects/${projectId}`} className="no-underline pointer">
      <span className="blue-light">#{projectId}</span>
    </Link>
  );
  return (
    <div className="cf">
      <div className="w-70-ns w-100 dib fl pv2">
        <span className="blue-dark">
          <FormattedMessage
            {...messages.createdBy}
            values={{ user: userLink, id: projectIdLink }}
          />
        </span>
      </div>
      <div className="w-30-ns w-100 dib fl tr">
        {showEditLink && (
          <Link
            to={`/manage/projects/${projectId}`}
            className="pointer no-underline br1 fw6 f7 dib pv2 ph3 ba b--red white bg-red mr3"
          >
            <FormattedMessage {...messages.editProject} />
          </Link>
        )}
        {priority && (
          <div className="mw4 dib">
            <PriorityBox priority={priority} extraClasses={'pv2 ph3'} hideMediumAndLow showIcon />
          </div>
        )}
      </div>
    </div>
  );
}

export const ProjectHeader = ({ project, showEditLink }: Object) => {
  const locale = useSelector((state) => state.preferences.locale);
  const [userCanEditProject] = useEditProjectAllowed(project);

  return (
    <>
      <HeaderLine
        author={project.author}
        projectId={project.projectId}
        priority={project.projectPriority}
        showEditLink={showEditLink && userCanEditProject}
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
        <TagLine
          campaigns={project.campaigns}
          countries={
            locale.includes('en')
              ? project.countryTag
              : translateCountry(project.countryTag, locale)
          }
        />
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
