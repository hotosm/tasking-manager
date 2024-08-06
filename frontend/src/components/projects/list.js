import React from 'react';
import { Link } from 'react-router-dom';
import ReactTooltip from 'react-tooltip';
import { FormattedMessage } from 'react-intl';

import messages from '../projectCard/messages';
import { MapIcon, MappedIcon, ValidatedIcon, GearIcon, UserIcon } from '../svgIcons';
import { ProjectStatusBox } from '../projectDetail/statusBox';
import { PriorityBox } from '../projectCard/priorityBox';

export function ProjectListItem({ project }: Object) {
  return (
    <div className="bg-white bluedark base-font w-100 mb1 db h3">
      <div className="pv3 ph3-l ph2 br1 cf">
        <div className="w-10 h fl tc">
          <img
            src={project.organisationLogo}
            alt={project.organisationName}
            className="object-fit-cover v-mid h2"
          />
        </div>
        <div className="w-40 h fl v-mid ph3 truncate">
          <Link to={`/projects/${project.projectId}`} className="link blue-dark">
            <span className="f5 blue-grey">#{project.projectId}</span>{' '}
            <span className="f4 b">{project.name}</span>
          </Link>
        </div>
        <div className="w-40 fl">
          <FormattedMessage {...messages.percentMapped} values={{ n: project.percentMapped }}>
            {(msg) => (
              <>
                <div className="w-25-ns w-third fl" data-tip={msg}>
                  <MappedIcon className="h1 w1 pr2" />
                  {project.percentMapped}%
                </div>
                <ReactTooltip place="bottom" />
              </>
            )}
          </FormattedMessage>
          <FormattedMessage {...messages.percentValidated} values={{ n: project.percentValidated }}>
            {(msg) => (
              <>
                <div className="w-25-ns w-third fl" data-tip={msg}>
                  <ValidatedIcon className="h1 w1 pr2" />
                  {project.percentValidated}%
                </div>
                <ReactTooltip place="bottom" />
              </>
            )}
          </FormattedMessage>
          <FormattedMessage
            {...messages.projectTotalContributors}
            values={{ number: project.totalContributors }}
          >
            {(msg) => (
              <>
                <div className="w-20-ns w-third fl" data-tip={msg}>
                  <UserIcon className="h1 w1 pr2" />
                  {project.totalContributors}
                </div>
                <ReactTooltip place="bottom" />
              </>
            )}
          </FormattedMessage>
          <div className="w-30-ns dib-ns dn fl">
            {['DRAFT', 'ARCHIVED'].includes(project.status) ? (
              <ProjectStatusBox status={project.status} className={'pv1 ph1 dib'} />
            ) : (
              <PriorityBox
                priority={project.priority}
                extraClasses={'pv1 ph2 dib'}
                showIcon={!['URGENT', 'MEDIUM'].includes(project.priority)} // inside the cards, don't show the icon for urgent or medium, due to the space required
              />
            )}
          </div>
        </div>
        <div className="w-10 fr tr">
          <FormattedMessage {...messages.editProject}>
            {(msg) => (
              <Link
                to={`/manage/projects/${project.projectId}`}
                className="link blue-light hover-blue-grey ph1"
                title={msg}
              >
                <GearIcon height="20px" width="auto" />
              </Link>
            )}
          </FormattedMessage>
          <FormattedMessage {...messages.projectTasks}>
            {(msg) => (
              <Link
                to={`/projects/${project.projectId}/tasks/`}
                className="link blue-light hover-blue-grey ph1 dib-ns dn"
                title={msg}
              >
                <MapIcon height="20px" width="auto" />
              </Link>
            )}
          </FormattedMessage>
        </div>
      </div>
    </div>
  );
}
