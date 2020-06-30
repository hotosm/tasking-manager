import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from '@reach/router';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { PriorityBox } from '../projectCard/priorityBox';
import { translateCountry } from '../../utils/countries';
import { ProjectStatusBox } from './statusBox';
import { EditButton } from '../button';
import { useEditProjectAllowed } from '../../hooks/UsePermissions';

export function HeaderLine({ author, projectId, priority, showEditLink, organisation }: Object) {
  const projectIdLink = (
    <Link to={`/projects/${projectId}`} className="no-underline pointer">
      <span className="blue-light">#{projectId}</span>
    </Link>
  );
  return (
    <div className="cf">
      <div className="w-70-ns w-100 dib fl pv2">
        <span className="blue-dark">{projectIdLink}</span>
        {organisation ? <span> | {organisation}</span> : null}
      </div>
      <div className="w-30-ns w-100 dib fl tr">
        {showEditLink && (
          <EditButton url={`/manage/projects/${projectId}`}>
            <FormattedMessage {...messages.editProject} />
          </EditButton>
        )}
        {priority && (
          <div className="mw4 dib">
            <PriorityBox
              priority={priority}
              extraClasses={'pv2 ph3 mh1 mv1'}
              hideMediumAndLow
              showIcon
            />
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
        organisation={project.organisationName}
        showEditLink={showEditLink && userCanEditProject}
      />
      <div className="cf">
        <div>
          <h3
            className="f2 fw6 mt2 mb3 ttu barlow-condensed blue-dark dib"
            lang={project.projectInfo.locale}
          >
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
        <span key={n}>
          <span className={n === 0 ? 'dn' : 'ph2'}>&#183;</span>
          {tag}
        </span>
      ))}
    </span>
  );
}
