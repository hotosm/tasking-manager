import React from 'react';
import { FormattedMessage, FormattedRelative } from 'react-intl';
import { Link } from '@reach/router';

import DueDateBox from './dueDateBox';
import ProjectProgressBar from './projectProgressBar';
import { MappingLevelMessage } from '../mappingLevel';
import messages from './messages';
import { PROJECTCARD_CONTRIBUTION_SHOWN_THRESHOLD } from '../../config/index';

export function PriorityBox({ priority, extraClasses }: Object) {
  let color = 'blue-grey';
  let borderColor = 'b--grey';
  if (priority === 'URGENT') {
    color = 'red';
    borderColor = 'b--red';
  }
  const translated = priority ? (
    <FormattedMessage {...messages['projectPriority' + priority]} />
  ) : (
    ''
  );
  return (
    <div className={`tc br1 f7 ttu ba ${borderColor} ${color} ${extraClasses}`}>{translated}</div>
  );
}

export function ProjectTeaser({
  lastUpdated,
  totalContributors,
  className,
  littleFont = 'f7',
  bigFont = 'f6',
}: Object) {
  /* outerDivStyles must have f6 even if sub-divs have f7 to fix grid issues*/
  const outerDivStyles = 'f6 tl blue-grey truncate mb2';

  if (totalContributors < PROJECTCARD_CONTRIBUTION_SHOWN_THRESHOLD) {
    return (
      <div className={`${outerDivStyles} ${className}`}>
        <span className={littleFont}>
          <FormattedMessage {...messages['projectLastContribution']} />{' '}
          <FormattedRelative value={lastUpdated} />
        </span>
      </div>
    );
  } else {
    return (
      <div className={`${outerDivStyles} ${className}`}>
        <span className={`${littleFont} blue-light`}>
          <FormattedMessage
            {...messages['projectTotalContributors']}
            values={{
              number: <span className={`blue-grey b ${bigFont}`}>{totalContributors || 0}</span>,
            }}
          />
        </span>
      </div>
    );
  }
}

function ProjectOrgLogo(organisationTag) {
  return (
    <div className="bg-black pa1" style={{ filter: 'invert(1)' }}>
      <div
        title={organisationTag.organisationTag}
        className={`contain ${getLogoClass(organisationTag)} w-auto h2`}
      ></div>
    </div>
  );
}

export function getLogoClass(organisationTag: String) {
  const orgs = [
    { className: 'org-unicef', organisationTag: 'UNICEF' },
    { className: 'org-usaid', organisationTag: '#YouthMappers' },
    { className: 'org-gfdrr', organisationTag: 'UNICEF' },
    { className: 'org-aws', organisationTag: 'AWS' },
    { className: 'org-redcross', organisationTag: 'Missing Maps' },
    { className: 'org-redcross', organisationTag: 'American Red Cross' },
    { className: 'org-msf', organisationTag: 'Médecins Sans Frontières' },
  ];

  if (organisationTag.organisationTag) {
    const searchResult = orgs.find(a => a.organisationTag === organisationTag.organisationTag);
    return searchResult && searchResult.className;
  } else {
    return null;
  }
}

export function ProjectCard({
  projectId,
  name,
  shortDescription,
  organisationTag,
  lastUpdated,
  dueDate,
  priority,
  mapperLevel,
  campaignTag,
  percentMapped,
  percentValidated,
  totalContributors,
  cardWidthClass = 'w-25-l',
}: Object) {
  return (
    <Link className="" to={`/projects/${projectId}`}>
      <article className={`fl ${cardWidthClass} base-font w-50-m w-100 mb3 ph2 blue-dark mw5`}>
        <div className="pv3 ph3 ba br1 b--grey-light shadow-hover ">
          <div className="mt3 w-33 fr">
            <PriorityBox priority={priority} extraClasses={'pv1 ph2'} />
          </div>
          <div className="w-50 red dib">
            <ProjectOrgLogo organisationTag={organisationTag} />
          </div>
          <div className="ma1 w-100">
            <div className="f7 blue-grey">#{projectId}</div>
            <h3 title={name} className="pb2 f5 fw6 h3 lh-title overflow-y-hidden">
              {name}
            </h3>
            <div className="tc f6">
              <div className="w-100 tl pr2 f7 blue-light dib lh-title mb2 h2 overflow-y-hidden">
                {shortDescription} {campaignTag ? ' · ' + campaignTag : ''}
              </div>
              <ProjectTeaser totalContributors={totalContributors} lastUpdated={lastUpdated} />
              <ProjectProgressBar
                percentMapped={percentMapped}
                percentValidated={percentValidated}
              />
              <div className="cf pt2 h2">
                <MappingLevelMessage level={mapperLevel} className="fl f7 mt1 ttc fw5 blue-grey" />
                <DueDateBox dueDate={dueDate} />
              </div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
