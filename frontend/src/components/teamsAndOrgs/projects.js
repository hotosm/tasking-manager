import React from 'react';
import { Link } from '@reach/router';
import { FormattedMessage } from 'react-intl';
import ReactPlaceholder from 'react-placeholder';

import messages from './messages';
import { ProjectCard } from '../projectCard/projectCard';
import { AddButton, ViewAllLink } from './management';

export function Projects({
  projects,
  viewAllEndpoint,
  ownerEntity,
  showAddButton = false,
  showManageButtons = true,
}: Object) {
  return (
    <div className="bg-white b--grey-light ba pa4 mb3">
      <div className="cf db">
        <h3 className="f3 blue-dark mv0 fw6 dib v-mid">
          <FormattedMessage {...messages.projects} />
        </h3>
        {showAddButton && (
          <Link to={'/manage/projects/new/'} className="dib ml4">
            <AddButton />
          </Link>
        )}
        <ViewAllLink link={viewAllEndpoint} />
        <div className="cf pt4">
          <ReactPlaceholder
            showLoadingAnimation={true}
            type="rect"
            color="#f0efef"
            style={{ width: 250, height: 300 }}
            delay={10}
            ready={projects && projects.results}
          >
            {projects &&
              projects.results &&
              projects.results
                .slice(0, 6)
                .map((card, n) => (
                  <ProjectCard
                    cardWidthClass="w-third-l"
                    {...card}
                    key={n}
                    showBottomButtons={showManageButtons}
                  />
                ))}
            {projects && projects.results && projects.results.length === 0 && (
              <span className="blue-grey">
                <FormattedMessage
                  {...messages.noProjectsFound}
                  values={{
                    entity: (
                      <span className="ttl">
                        <FormattedMessage {...messages[ownerEntity]} />
                      </span>
                    ),
                  }}
                />
              </span>
            )}
          </ReactPlaceholder>
        </div>
      </div>
    </div>
  );
}
