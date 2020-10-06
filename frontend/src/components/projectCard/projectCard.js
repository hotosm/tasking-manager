import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from '@reach/router';

import messages from './messages';
import { RelativeTimeWithUnit } from '../../utils/formattedRelativeTime';
import ProjectProgressBar from './projectProgressBar';
import { MappingLevelMessage } from '../mappingLevel';
import { ProjectStatusBox } from '../projectDetail/statusBox';
import { PROJECTCARD_CONTRIBUTION_SHOWN_THRESHOLD } from '../../config/index';
import { PriorityBox } from './priorityBox';

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
      <div title={lastUpdated} className={`${outerDivStyles} ${className || ''}`}>
        <span className={littleFont}>
          <FormattedMessage {...messages['projectLastContribution']} />{' '}
          <RelativeTimeWithUnit date={lastUpdated} />
        </span>
      </div>
    );
  } else {
    return (
      <div title={lastUpdated} className={`${outerDivStyles} ${className || ''}`}>
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

export function ProjectCard({
  projectId,
  name,
  shortDescription,
  organisationName,
  organisationLogo,
  lastUpdated,
  dueDate,
  priority,
  status,
  mapperLevel,
  campaignTag,
  percentMapped,
  percentValidated,
  totalContributors,
  cardWidthClass = 'w-25-l',
  showBottomButtons = false,
}: Object) {
  const [isHovered, setHovered] = useState(false);
  const linkCombo = 'link pa2 f6 ba b--grey-light di w-50 truncate tc';

  const showBottomButtonsHovered = showBottomButtons === true ? isHovered : false;
  const bottomButtonSpacer = showBottomButtons ? 'pt3 pb4' : 'pv3';
  const bottomButtonMargin = showBottomButtons ? 'pb0' : 'pb3';
  const bottomButtons = (
    <div className="absolute bottom-0 w-100 pr3">
      <Link
        to={`/manage/projects/${projectId}`}
        className={`fl bg-grey-light blue-grey bn ${linkCombo}`}
      >
        <FormattedMessage {...messages.editProject} />
      </Link>
      <Link to={`/projects/${projectId}/tasks`} className={`fr bg-red white bn ${linkCombo}`}>
        <FormattedMessage {...messages.projectTasks} />
      </Link>
    </div>
  );

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative fl ${cardWidthClass} base-font w-50-m w-100 mb3 ${bottomButtonMargin} pr3 blue-dark mw5 `}
    >
      <Link className="no-underline color-inherit" to={`/projects/${projectId}`}>
        <div className={`${bottomButtonSpacer} ph3 ba br1 b--grey-light bg-white shadow-hover`}>
          <div className="cf w-100">
            <div className="w-40 tr fr">
              {['DRAFT', 'ARCHIVED'].includes(status) ? (
                <ProjectStatusBox status={status} className={'pv1 ph1 dib'} />
              ) : (
                <PriorityBox
                  priority={priority}
                  extraClasses={'pv1 ph2 dib'}
                  hideMediumAndLow={!showBottomButtons}
                  showIcon={priority !== 'URGENT'} // inside the cards, don't show the icon for urgent, due to the space required
                />
              )}
            </div>
            <div className="w-60 cf pr1 red dib">
              <img
                className="h2 pa1"
                src={organisationLogo}
                alt={organisationLogo ? organisationName : ''}
              />
            </div>
          </div>
          <div className="ma1 w-100">
            <div className="f5 blue-grey mt1 lh-title">#{projectId}</div>
            <h3 title={name} className="pb2 mt1 f5 fw6 h3 lh-title overflow-y-hidden">
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
              <div className="cf pt2 h2 truncate">
                <MappingLevelMessage
                  level={mapperLevel}
                  className="fl f7 pv2 ttc fw5 blue-grey truncate"
                />
              </div>
            </div>
          </div>
        </div>
      </Link>
      {showBottomButtonsHovered && bottomButtons}
    </div>
  );
}
