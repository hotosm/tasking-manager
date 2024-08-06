import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import messages from './messages';
import { RelativeTimeWithUnit } from '../../utils/formattedRelativeTime';
import ProjectProgressBar from './projectProgressBar';
import { DifficultyMessage } from '../mappingLevel';
import { ProjectStatusBox } from '../projectDetail/statusBox';
import { PROJECTCARD_CONTRIBUTION_SHOWN_THRESHOLD } from '../../config/index';
import { PriorityBox } from './priorityBox';
import { DueDateBox } from './dueDateBox';
import './styles.scss';

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
        <span className={`${littleFont}`}>
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
  difficulty,
  campaignTag,
  percentMapped,
  percentValidated,
  totalContributors,
  showBottomButtons = false,
}: Object) {
  const [isHovered, setHovered] = useState(false);
  const linkCombo = 'link pa2 f6 ba b--grey-light di w-50 truncate tc';

  const showBottomButtonsHovered = showBottomButtons === true ? isHovered : false;
  const bottomButtonSpacer = showBottomButtons ? 'pt3 pb4' : 'pv3';
  const bottomButtonMargin = showBottomButtons ? 'project-card-with-btn' : 'project-card';

  const bottomButtons = (
    <div className="absolute bottom-0 w-100">
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
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative blue-dark`}
    >
      <Link className="no-underline color-inherit" to={`/projects/${projectId}`}>
        <div
          className={`${bottomButtonSpacer} ba br1 bg-white shadow-hover h-100 flex flex-column justify-between b--card ${bottomButtonMargin}`}
        >
          <div>
            <div className="flex justify-between items-center">
              <div className="red">
                <img
                  className="h2"
                  src={organisationLogo}
                  alt={organisationLogo ? organisationName : ''}
                />
              </div>
              <div className="">
                {['DRAFT', 'ARCHIVED'].includes(status) ? (
                  <ProjectStatusBox status={status} className={'pv1 ph1 dib'} />
                ) : (
                  <PriorityBox
                    priority={priority}
                    extraClasses={'pv1 ph2 dib'}
                    showIcon={!['URGENT', 'MEDIUM'].includes(priority)} // inside the cards, don't show the icon for urgent or medium, due to the space required
                  />
                )}
              </div>
            </div>
            <div className="mt4 w-100">
              <div className="f7 blue-grey">#{projectId}</div>
              <h3
                title={name}
                className="mt3 f125 fw7 lh-title overflow-y-hidden pr4 project-title"
              >
                {name}
              </h3>
              <div className="tc f6">
                <div className="w-100 tl pr2 f7 blue-grey dib mb2 project-desc">
                  {shortDescription} {campaignTag ? ' · ' + campaignTag : ''}
                </div>
              </div>
            </div>
          </div>
          <div>
            <ProjectTeaser totalContributors={totalContributors} lastUpdated={lastUpdated} />
            <ProjectProgressBar percentMapped={percentMapped} percentValidated={percentValidated} />
            <div className="pt2 truncate flex justify-between items-center">
              <DifficultyMessage
                level={difficulty}
                className="fl f7 pv2 ttc fw5 blue-grey truncate"
              />
              <DueDateBox dueDate={dueDate} />
            </div>
          </div>
        </div>
      </Link>
      {showBottomButtonsHovered && bottomButtons}
    </article>
  );
}
